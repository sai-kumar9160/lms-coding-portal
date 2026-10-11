// Loads formatted chapter content (Markdown + figure images produced by scripts/pdf-to-markdown.py) into the
// lessons of an imported course, so each lesson shows the full chapter text on the page.
// Usage (from E:\LMS\server):
//   node scripts/import-chapter-content.mjs --file prisma/data/courses/python-basics-to-oop.json --college srk123 --content prisma/data/courses/python-basics-to-oop [--replace]
// Lessons are matched by title via manifest.json. Without --replace, lessons that already have formatted content are skipped.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { db } from '../config/db.config.js';
import { fileModel } from '../src/models/file.model.js';
import { tmpDir } from '../src/services/file-storage.service.js';

const { values: args } = parseArgs({ options: { file: { type: 'string' }, college: { type: 'string' }, content: { type: 'string' }, replace: { type: 'boolean', default: false } } });
const stop = (message) => { console.error(message); process.exit(1); };
if (!args.file || !args.college || !args.content)
    stop('Usage: node scripts/import-chapter-content.mjs --file <course.json> --college <college code> --content <folder> [--replace]');

try {
    const data = JSON.parse(fs.readFileSync(path.resolve(args.file), 'utf8'));
    const folder = path.resolve(args.content);
    const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'));
    const college = await db.college.findFirst({ where: { slug: args.college, activeIndicator: 1 } });
    if (!college) stop(`College "${args.college}" not found`);
    const course = await db.course.findFirst({ where: { collegeId: college.id, code: data.code, activeIndicator: 1 }, include: { modules: { where: { activeIndicator: 1 }, include: { lessons: { where: { activeIndicator: 1 } } } } } });
    if (!course) stop(`${college.name} has no course ${data.code}; import it first.`);
    const lessons = new Map(course.modules.flatMap(m => m.lessons).map(l => [l.title, l]));
    let updated = 0, images = 0;
    for (const chapter of manifest) {
        const lesson = lessons.get(chapter.title);
        if (!lesson || (lesson.contentFormat === 'MARKDOWN' && !args.replace))
            continue;
        let markdown = fs.readFileSync(path.join(folder, chapter.markdown), 'utf8').replace(/\r\n/g, '\n');
        if (args.replace) // images of the previous import are detached from the lesson
            await db.fileUpload.updateMany({ where: { lessonId: lesson.id }, data: { lessonId: null, activeIndicator: 0 } });
        for (const name of chapter.images) {
            const tmp = path.join(tmpDir, randomUUID());
            fs.copyFileSync(path.join(folder, name), tmp);
            const file = await fileModel.store({ id: course.teacherId }, college.id, 'IMAGE', { path: tmp, originalname: name, size: fs.statSync(tmp).size }, { lessonId: lesson.id });
            markdown = markdown.split(`asset:${name}`).join(`file:${file.id}`);
            images++;
        }
        await db.lesson.update({ where: { id: lesson.id }, data: { content: markdown, contentFormat: 'MARKDOWN', updatedBy: course.teacherId } });
        updated++;
    }
    await db.auditLog.create({ data: { collegeId: college.id, actorId: course.teacherId, action: 'import_content', entityType: 'course', entityId: course.id, after: { lessons: updated, images, source: path.basename(folder) } } });
    console.log(`Loaded formatted content into ${updated} lessons of ${data.code} (${images} images).`);
}
catch (error) {
    stop(error.message);
}
finally {
    await db.$disconnect();
}
