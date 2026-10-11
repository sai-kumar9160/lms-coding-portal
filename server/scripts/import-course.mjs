// Imports a course syllabus (JSON) into the database for one college.
// Usage (from E:\LMS\server):
//   npm run course:import -- --file prisma/data/courses/python-basics-to-oop.json --college srk123 --owner teacher@college.edu [--notes "C:\path\notes.pdf"] [--publish]
// The owner must be an active teacher or College Admin of that college. A course with the same code is never overwritten.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { db } from '../config/db.config.js';
import { fileModel } from '../src/models/file.model.js';
import { tmpDir } from '../src/services/file-storage.service.js';
import { attachChapterPdfs } from './lib/chapter-pdfs.mjs';

// pages: the lesson's page range in the notes PDF; with --notes that range becomes the lesson's chapter PDF.
const lesson = z.object({ title: z.string().trim().min(2).max(150), content: z.string().trim().min(10).max(100000), pages: z.tuple([z.number().int().min(1), z.number().int().min(1)]).optional() });
const courseFile = z.object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,20}$/),
    title: z.string().trim().min(3).max(150),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    durationHours: z.number().int().min(1).max(2000).optional(),
    description: z.string().trim().min(5).max(2000),
    objectives: z.string().max(5000).default(''),
    outcomes: z.string().max(5000).default(''),
    modules: z.array(z.object({ title: z.string().trim().min(2).max(150), description: z.string().max(2000).default(''), lessons: z.array(lesson).min(1) })).min(1),
});

const { values: args } = parseArgs({ options: { file: { type: 'string' }, college: { type: 'string' }, owner: { type: 'string' }, notes: { type: 'string' }, publish: { type: 'boolean', default: false } } });
const stop = (message) => { console.error(message); process.exit(1); };
if (!args.file || !args.college || !args.owner)
    stop('Usage: npm run course:import -- --file <course.json> --college <college code> --owner <email> [--notes <pdf>] [--publish]');

try {
    const data = courseFile.parse(JSON.parse(fs.readFileSync(path.resolve(args.file), 'utf8')));
    const college = await db.college.findFirst({ where: { slug: args.college, activeIndicator: 1 } });
    if (!college) stop(`College "${args.college}" not found`);
    const owner = await db.user.findFirst({ where: { email: args.owner.toLowerCase(), collegeId: college.id, role: { in: ['TEACHER', 'COLLEGE_ADMIN'] }, status: 'ACTIVE', activeIndicator: 1 } });
    if (!owner) stop(`No active teacher or College Admin "${args.owner}" in ${college.name}`);
    if (await db.course.findFirst({ where: { collegeId: college.id, code: data.code } }))
        stop(`${college.name} already has a course with code ${data.code}; it was not changed.`);

    // The notes PDF is stored like a normal upload (type check, checksum, college folder) and linked as the course syllabus.
    let syllabusFileId = null;
    if (args.notes) {
        const source = path.resolve(args.notes);
        const copy = path.join(tmpDir, randomUUID());
        fs.copyFileSync(source, copy);
        syllabusFileId = (await fileModel.store({ id: owner.id }, college.id, 'DOCUMENT', { path: copy, originalname: path.basename(source), size: fs.statSync(source).size })).id;
    }

    const audit = { collegeId: college.id, createdBy: owner.id };
    const course = await db.course.create({ data: {
        title: data.title, description: data.description, code: data.code, level: data.level, durationHours: data.durationHours,
        objectives: data.objectives, outcomes: data.outcomes, syllabusFileId, status: args.publish ? 'PUBLISHED' : 'DRAFT', teacherId: owner.id, ...audit,
        instructors: { create: { userId: owner.id, role: 'OWNER', ...audit } },
        modules: { create: data.modules.map((module, m) => ({ title: module.title, description: module.description, position: m, ...audit,
            lessons: { create: module.lessons.map(({ pages, ...item }, l) => ({ ...item, position: l, ...audit })) } })) },
    }, include: { modules: { include: { lessons: true } } } });
    let chapters = 0;
    if (args.notes) {
        const pagesByTitle = new Map(data.modules.flatMap(m => m.lessons).filter(l => l.pages).map(l => [l.title, l.pages]));
        const lessonsWithPages = course.modules.flatMap(m => m.lessons).filter(l => pagesByTitle.has(l.title)).map(l => ({ id: l.id, title: l.title, pages: pagesByTitle.get(l.title) }));
        chapters = await attachChapterPdfs({ ownerId: owner.id, collegeId: college.id, notesPath: path.resolve(args.notes), lessons: lessonsWithPages });
    }
    await db.auditLog.create({ data: { collegeId: college.id, actorId: owner.id, action: 'import', entityType: 'course', entityId: course.id, after: { code: data.code, title: data.title, source: path.basename(args.file), units: data.modules.length } } });
    const lessons = data.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    console.log(`Imported ${data.code} "${data.title}" into ${college.name}: ${data.modules.length} units, ${lessons} lessons, ${syllabusFileId ? 'syllabus PDF linked, ' : ''}${chapters ? `${chapters} chapter PDFs, ` : ''}status ${args.publish ? 'PUBLISHED' : 'DRAFT'}.`);
}
catch (error) {
    stop(error instanceof z.ZodError ? `Invalid course file: ${error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}` : error.message);
}
finally {
    await db.$disconnect();
}
