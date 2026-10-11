import { z } from 'zod';
import { courseModel } from '../models/course.model.js';
import { audit } from '../services/audit.service.js';
import { renderSyllabus } from '../services/syllabus-pdf.service.js';

const title = z.string().trim().min(2).max(150);
const position = z.number().int().min(0).max(10000).optional();
const moduleSchema = z.object({ title, position, description: z.string().trim().max(2000).optional() });
// Lessons are saved as a whole: omitted optional fields return to their defaults.
const lessonSchema = z.object({
    title, position,
    lessonType: z.enum(['TEXT', 'VIDEO', 'DOCUMENT']).default('TEXT'),
    content: z.string().trim().max(100000).default(''),
    fileId: z.string().uuid().nullish(),
    durationSec: z.number().int().min(0).max(86400).nullish(),
    allowDownload: z.boolean().default(false),
    published: z.boolean().default(true),
    prerequisiteLessonId: z.string().uuid().nullish(),
}).superRefine((lesson, context) => {
    if (lesson.lessonType === 'TEXT' && lesson.content.length < 10)
        context.addIssue({ code: 'custom', path: ['content'], message: 'Text lessons need at least 10 characters' });
    if (lesson.lessonType !== 'TEXT' && !lesson.fileId)
        context.addIssue({ code: 'custom', path: ['fileId'], message: 'Upload a file for this lesson' });
});
// Syllabus details; empty code/level/duration clear the value.
const syllabusFields = {
    code: z.string().trim().toUpperCase().refine(value => value === '' || /^[A-Z0-9-]{2,20}$/.test(value), 'Use 2-20 letters, digits or hyphens').transform(value => value || null).optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).nullable().optional(),
    durationHours: z.number().int().min(1).max(2000).nullable().optional(),
    objectives: z.string().trim().max(5000).optional(),
    outcomes: z.string().trim().max(5000).optional(),
    // An uploaded PDF (POST /api/files?purpose=DOCUMENT) linked as the course's syllabus / notes; null unlinks it.
    syllabusFileId: z.string().uuid().nullable().optional(),
};
// Admin-only (checked in the model): share the course read-only with every college.
const sharedField = { shared: z.boolean().transform(value => (value ? 1 : 0)).optional() };
const courseSchema = z.object({ title: z.string().trim().min(3).max(150).optional(), description: z.string().trim().min(5).max(2000).optional(), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(), ...syllabusFields, ...sharedField }).refine(data => Object.keys(data).length > 0, 'Supply at least one course field');
const newCourseSchema = z.object({ title: z.string().trim().min(3).max(150), description: z.string().trim().min(5).max(2000), moduleTitle: z.string().trim().min(2).max(100), lessonTitle: z.string().trim().min(2).max(150), content: z.string().trim().min(10).max(100000), ...syllabusFields });
const progressSchema = z.object({ positionSec: z.number().int().min(0).max(86400), spentSec: z.number().int().min(0).max(120) });
const instructorSchema = z.object({ userId: z.string().uuid() });

// Course content writes are audited with the saved values (learner activity such as progress is not).
async function audited(req, res, status, entityType, action, work, entityId) {
    const result = await work();
    await audit(req, { action, entityType, entityId: entityId ?? result.id, after: result.success ? req.body : result });
    res.status(status).json(result);
}

export async function listCourses(req, res) { res.json(await courseModel.list(req.identity, req.collegeId)); }
export async function lessonContent(req, res) { res.json(await courseModel.lessonContent(req.identity, req.collegeId, req.params.id)); }
// GET /api/courses/:id/syllabus/pdf: the course syllabus as a downloadable PDF.
export async function syllabusPdf(req, res) {
    const course = await courseModel.syllabus(req.identity, req.collegeId, req.params.id);
    const name = `${(course.code || course.title).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'course'}-syllabus.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Cache-Control', 'no-store');
    renderSyllabus(course).pipe(res);
}
export async function createCourse(req, res) { await audited(req, res, 201, 'course', 'create', () => courseModel.create(req.identity, req.collegeId, newCourseSchema.parse(req.body))); }
export async function updateCourse(req, res) { await audited(req, res, 200, 'course', 'update', () => courseModel.updateCourse(req.identity, req.collegeId, req.params.id, courseSchema.parse(req.body)), req.params.id); }
export async function createModule(req, res) { await audited(req, res, 201, 'course_module', 'create', () => courseModel.createModule(req.identity, req.collegeId, req.params.id, moduleSchema.parse(req.body))); }
export async function updateModule(req, res) { await audited(req, res, 200, 'course_module', 'update', () => courseModel.updateModule(req.identity, req.collegeId, req.params.id, req.params.moduleId, moduleSchema.parse(req.body)), req.params.moduleId); }
export async function deleteModule(req, res) { await audited(req, res, 200, 'course_module', 'delete', () => courseModel.deleteModule(req.identity, req.collegeId, req.params.id, req.params.moduleId), req.params.moduleId); }
export async function createLesson(req, res) { await audited(req, res, 201, 'lesson', 'create', () => courseModel.createLesson(req.identity, req.collegeId, req.params.id, req.params.moduleId, lessonSchema.parse(req.body))); }
export async function updateLesson(req, res) { await audited(req, res, 200, 'lesson', 'update', () => courseModel.updateLesson(req.identity, req.collegeId, req.params.id, req.params.moduleId, req.params.lessonId, lessonSchema.parse(req.body)), req.params.lessonId); }
export async function deleteLesson(req, res) { await audited(req, res, 200, 'lesson', 'delete', () => courseModel.deleteLesson(req.identity, req.collegeId, req.params.id, req.params.moduleId, req.params.lessonId), req.params.lessonId); }
export async function completeLesson(req, res) { res.json(await courseModel.completeLesson(req.identity, req.collegeId, req.params.id)); }
export async function saveProgress(req, res) { res.json(await courseModel.saveProgress(req.identity, req.collegeId, req.params.id, progressSchema.parse(req.body))); }
export async function addInstructor(req, res) { await audited(req, res, 201, 'course_instructor', 'add', () => courseModel.addInstructor(req.identity, req.collegeId, req.params.id, instructorSchema.parse(req.body).userId), req.params.id); }
export async function removeInstructor(req, res) {
    const result = await courseModel.removeInstructor(req.identity, req.collegeId, req.params.id, req.params.userId);
    await audit(req, { action: 'remove', entityType: 'course_instructor', entityId: req.params.id, before: { userId: req.params.userId } });
    res.json(result);
}
