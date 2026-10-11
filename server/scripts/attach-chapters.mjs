// Attaches one PDF per chapter to an already imported course, using the page ranges in the course JSON.
// Usage (from E:\LMS\server):
//   node scripts/attach-chapters.mjs --file prisma/data/courses/python-basics-to-oop.json --college srk123 --notes "C:\path\notes.pdf"
// Lessons are matched by title; lessons that already have a file are left unchanged.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { db } from '../config/db.config.js';
import { attachChapterPdfs } from './lib/chapter-pdfs.mjs';

const { values: args } = parseArgs({ options: { file: { type: 'string' }, college: { type: 'string' }, notes: { type: 'string' } } });
const stop = (message) => { console.error(message); process.exit(1); };
if (!args.file || !args.college || !args.notes)
    stop('Usage: node scripts/attach-chapters.mjs --file <course.json> --college <college code> --notes <pdf>');

try {
    const data = JSON.parse(fs.readFileSync(path.resolve(args.file), 'utf8'));
    const college = await db.college.findFirst({ where: { slug: args.college, activeIndicator: 1 } });
    if (!college) stop(`College "${args.college}" not found`);
    const course = await db.course.findFirst({ where: { collegeId: college.id, code: data.code, activeIndicator: 1 }, include: { modules: { where: { activeIndicator: 1 }, include: { lessons: { where: { activeIndicator: 1 } } } } } });
    if (!course) stop(`${college.name} has no course ${data.code}; import it first.`);
    const pagesByTitle = new Map(data.modules.flatMap(m => m.lessons).filter(l => l.pages).map(l => [l.title, l.pages]));
    const lessons = course.modules.flatMap(m => m.lessons).filter(l => pagesByTitle.has(l.title) && !l.fileId).map(l => ({ id: l.id, title: l.title, pages: pagesByTitle.get(l.title) }));
    const attached = await attachChapterPdfs({ ownerId: course.teacherId, collegeId: college.id, notesPath: path.resolve(args.notes), lessons });
    await db.auditLog.create({ data: { collegeId: college.id, actorId: course.teacherId, action: 'attach_chapters', entityType: 'course', entityId: course.id, after: { chapters: attached, source: path.basename(args.notes) } } });
    console.log(`Attached ${attached} chapter PDFs to ${data.code} in ${college.name}.`);
}
catch (error) {
    stop(error.message);
}
finally {
    await db.$disconnect();
}
