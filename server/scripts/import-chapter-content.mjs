// Loads formatted chapter content (Markdown + figure images produced by scripts/pdf-to-markdown.py) into the
// lessons of an imported course, so each lesson shows the full chapter text on the page.
// Usage (from E:\LMS\server):
//   node scripts/import-chapter-content.mjs --file data/courses/python-basics-to-oop.json --college srk123 --content data/courses/python-basics-to-oop [--replace]
// Lessons are matched by title via manifest.json. Without --replace, lessons that already have formatted content are skipped.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { db } from '../config/db.config.js';
import { writeAuditLog } from './lib/audit-log.mjs';
import { findCollege, findCourseWithLessons } from './lib/course-lookup.mjs';
import { fileMdl } from '../src/modules/file/models/fileMdl.js';
import { tmpDir } from '../src/services/file-storage.service.js';

const { values: args } = parseArgs({ options: { file: { type: 'string' }, college: { type: 'string' }, content: { type: 'string' }, replace: { type: 'boolean', default: false } } });
const stop = (message) => { console.error(message); process.exit(1); };
if (!args.file || !args.college || !args.content)
    stop('Usage: node scripts/import-chapter-content.mjs --file <course.json> --college <college code> --content <folder> [--replace]');

try {
    const data = JSON.parse(fs.readFileSync(path.resolve(args.file), 'utf8'));
    const folder = path.resolve(args.content);
    const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'));
    const college = await findCollege(args.college);
    if (!college) stop(`College "${args.college}" not found`);
    const course = await findCourseWithLessons(college.id, data.code);
    if (!course) stop(`${college.name} has no course ${data.code}; import it first.`);
    const lessons = new Map(course.modules.flatMap(m => m.lessons).map(l => [l.title, l]));
    let updated = 0, images = 0;
    for (const chapter of manifest) {
        const lesson = lessons.get(chapter.title);
        if (!lesson || (lesson.contentFormat === 'MARKDOWN' && !args.replace))
            continue;
        let markdown = fs.readFileSync(path.join(folder, chapter.markdown), 'utf8').replace(/\r\n/g, '\n');
        if (args.replace) // images of the previous import are detached from the lesson
            await db.run('UPDATE file_upld_dtl_t SET lesson_id = NULL, a_in = 0 WHERE lesson_id = $1', [lesson.id]);
        for (const name of chapter.images) {
            const tmp = path.join(tmpDir, randomUUID());
            fs.copyFileSync(path.join(folder, name), tmp);
            const file = await fileMdl.store({ id: course.teacherId }, college.id, 'IMAGE', { path: tmp, originalname: name, size: fs.statSync(tmp).size }, { lessonId: lesson.id });
            markdown = markdown.split(`asset:${name}`).join(`file:${file.id}`);
            images++;
        }
        await db.run(`UPDATE "Lesson" SET content = $2, content_fmt_cd = 'MARKDOWN', updte_usr_id = $3 WHERE id = $1`, [lesson.id, markdown, course.teacherId]);
        updated++;
    }
    await writeAuditLog({ collegeId: college.id, actorId: course.teacherId, action: 'import_content', entityType: 'course', entityId: course.id, after: { lessons: updated, images, source: path.basename(folder) } });
    console.log(`Loaded formatted content into ${updated} lessons of ${data.code} (${images} images).`);
}
catch (error) {
    stop(error.message);
}
finally {
    await db.end();
}
