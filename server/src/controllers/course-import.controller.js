import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { fileModel } from '../models/file.model.js';
import { tmpDir, resolveKey, removeFile } from '../services/file-storage.service.js';
import { createCourseFromPdf, rebuildCourseFromPdf } from '../services/pdf-course.service.js';
import { instructs } from '../models/course.model.js';
import { audit } from '../services/audit.service.js';
import { uploadConfig } from '../../config/upload.config.js';
import { db } from '../../config/db.config.js';
import { fail } from '../utils/http-error.js';

const storage = multer.diskStorage({ destination: tmpDir, filename: (_req, _file, callback) => callback(null, randomUUID()) });
const receive = multer({ storage, limits: { fileSize: uploadConfig.maxBytes.DOCUMENT, files: 1, fields: 6 } }).single('file');
const inputSchema = z.object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().max(2000).optional(),
    code: z.string().trim().toUpperCase().refine(value => value === '' || /^[A-Z0-9-]{2,20}$/.test(value), 'Use 2-20 letters, digits or hyphens').transform(value => value || undefined).optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', '']).transform(value => value || undefined).optional(),
});

// POST /api/courses/:id/rebuild-from-pdf: re-converts the course's linked PDF and replaces its units and lessons.
// Allowed for the course's editors (its college's admins and its instructors).
export async function rebuildFromPdf(req, res) {
    const course = await db.course.findFirst({ where: { id: req.params.id, collegeId: req.collegeId, activeIndicator: 1, ...(req.identity.role === 'TEACHER' ? instructs(req.identity) : {}) }, include: { syllabusFile: true } });
    if (!course)
        fail(404, 'Course not found');
    if (!course.syllabusFile || course.syllabusFile.activeIndicator !== 1)
        fail(400, 'This course has no PDF to rebuild from. Upload one in Edit course first.');
    const result = await rebuildCourseFromPdf(req.identity, req.collegeId, course, resolveKey(course.syllabusFile.storageKey));
    await audit(req, { action: 'rebuild_from_pdf', entityType: 'course', entityId: course.id, after: { units: result.units, lessons: result.lessons, images: result.images, source: course.syllabusFile.originalName } });
    res.json(result);
}

// POST /api/courses/from-pdf (multipart: file + title, optional description, code, level).
// Converts the PDF into a DRAFT course owned by the signed-in user; it can take up to a few minutes for large PDFs.
export async function createFromPdf(req, res) {
    try {
        await new Promise((resolve, reject) => receive(req, res, error => error ? reject(error) : resolve()));
    }
    catch (error) {
        if (error instanceof multer.MulterError)
            fail(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400, error.code === 'LIMIT_FILE_SIZE' ? `PDF is larger than ${uploadConfig.maxBytes.DOCUMENT / 1048576} MB` : 'Send one PDF in the "file" field');
        throw error;
    }
    if (!req.file)
        fail(400, 'Choose a PDF to upload');
    let input;
    try {
        input = inputSchema.parse(req.body ?? {});
    }
    catch (error) {
        await removeFile(req.file.path); // invalid form: drop the temporary upload
        throw error;
    }
    if (input.code && await db.course.findFirst({ where: { collegeId: req.collegeId, code: input.code } })) {
        await removeFile(req.file.path);
        fail(409, `This college already has a course with code ${input.code}`);
    }
    const stored = await fileModel.store(req.identity, req.collegeId, 'DOCUMENT', req.file);
    const record = await db.fileUpload.findUniqueOrThrow({ where: { id: stored.id } });
    const result = await createCourseFromPdf(req.identity, req.collegeId, { ...input, fileName: stored.originalName }, { fileId: stored.id, path: resolveKey(record.storageKey) });
    await audit(req, { action: 'create_from_pdf', entityType: 'course', entityId: result.id, after: { title: result.title, units: result.units, lessons: result.lessons, images: result.images, source: stored.originalName } });
    res.status(201).json(result);
}
