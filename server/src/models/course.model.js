import { db } from '../../config/db.config.js';
import { fail, notFound } from '../utils/http-error.js';

const active = { activeIndicator: 1 };
// Teachers work only on courses they instruct (owner or co-instructor); College Admins on every course in their college.
export const instructs = (identity) => ({ instructors: { some: { userId: identity.id, ...active } } });
const courseScope = (identity, collegeId, id) => ({ id, collegeId, ...active, ...(identity.role === 'TEACHER' ? instructs(identity) : {}) });
const moduleScope = (identity, collegeId, courseId, id) => ({ id, courseId, collegeId, ...active, course: courseScope(identity, collegeId, courseId) });
const lessonScope = (identity, collegeId, courseId, moduleId, id) => ({ id, moduleId, collegeId, ...active, module: moduleScope(identity, collegeId, courseId, moduleId) });
const fileFields = { id: true, originalName: true, mimeType: true, sizeBytes: true };
const flag = value => value ? 1 : 0;

// Published courses a college's users can read: their own college's, plus courses shared with every college.
export const readableCourse = (collegeId) => ({ ...active, status: 'PUBLISHED', OR: [{ collegeId }, { shared: 1 }] });

// Which courses a user sees:
// - students: published courses of their college and shared published courses;
// - teachers: courses they instruct (any status) plus the same published ones, read-only;
// - College Admins (and a Super Admin in a college): every course of the college plus shared published ones.
function visibleCourses(identity, collegeId) {
    const published = { status: 'PUBLISHED', OR: [{ collegeId }, { shared: 1 }] };
    if (identity.role === 'STUDENT')
        return { ...active, ...published };
    const own = identity.role === 'TEACHER' ? { collegeId, ...instructs(identity) } : { collegeId };
    return { ...active, OR: [own, { status: 'PUBLISHED', collegeId }, { status: 'PUBLISHED', shared: 1 }] };
}

// Editors are the owning college's admins and the course's instructors; everyone else gets a read-only view
// that hides unpublished lessons.
function canEditCourse(identity, collegeId, course) {
    if (course.collegeId !== collegeId || identity.role === 'STUDENT')
        return false;
    return identity.role !== 'TEACHER' || course.instructors.some(i => i.userId === identity.id);
}
// Formatted (Markdown) chapters can be long, so lists leave their text out; GET /lessons/:id/content loads one.
function withAccess(identity, collegeId, course) {
    const canEdit = canEditCourse(identity, collegeId, course);
    const lessonsFor = lessons => (canEdit ? lessons : lessons.filter(l => l.published === 1))
        .map(l => (l.contentFormat === 'MARKDOWN' ? { ...l, content: '', hasArticle: true } : l));
    return { ...course, canEdit, modules: course.modules.map(m => ({ ...m, lessons: lessonsFor(m.lessons) })) };
}

// There is no enrollment step: every student may open any published lesson of a readable course.
export function learnerLesson(collegeId, lessonId) {
    return db.lesson.findFirst({ where: { id: lessonId, ...active, published: 1, module: { ...active, course: readableCourse(collegeId) } }, include: { module: { select: { courseId: true } } } });
}

// The Enrollment row only stores course progress; it is created the first time a student records progress.
function ensureEnrollment(identity, collegeId, courseId) {
    return db.enrollment.upsert({ where: { userId_courseId: { userId: identity.id, courseId } }, create: { userId: identity.id, courseId, collegeId, createdBy: identity.id }, update: {} });
}

// Students must complete an active, published prerequisite lesson first.
export async function assertPrerequisite(identity, lesson) {
    if (!lesson.prerequisiteLessonId)
        return;
    const prerequisite = await db.lesson.findFirst({ where: { id: lesson.prerequisiteLessonId, ...active, published: 1, module: active } });
    if (!prerequisite)
        return;
    const done = await db.lessonProgress.findFirst({ where: { userId: identity.id, lessonId: prerequisite.id, ...active, completedAt: { not: null } } });
    if (!done)
        fail(409, `Complete "${prerequisite.title}" first`);
}

// progress_pct = completed published lessons / published lessons, for one student or every enrollment of a course.
function recalculateProgress(client, courseId, userId = null) {
    return client.$executeRaw`
        WITH lessons AS (
            SELECT l."id" FROM "Lesson" l JOIN "CourseModule" m ON m."id" = l."moduleId"
            WHERE m."courseId" = ${courseId} AND l."a_in" = 1 AND l."published_in" = 1 AND m."a_in" = 1
        ), total AS (SELECT COUNT(*) AS value FROM lessons),
        pct AS (
            SELECT en."id", CASE WHEN t.value = 0 THEN 0 ELSE (100 * COUNT(lp."id") / t.value)::int END AS value
            FROM "Enrollment" en CROSS JOIN total t
            LEFT JOIN "LessonProgress" lp ON lp."userId" = en."userId" AND lp."a_in" = 1 AND lp."completedAt" IS NOT NULL AND lp."lessonId" IN (SELECT "id" FROM lessons)
            WHERE en."courseId" = ${courseId} AND (${userId}::text IS NULL OR en."userId" = ${userId}::text)
            GROUP BY en."id", t.value
        )
        UPDATE "Enrollment" e SET "progress_pct" = pct.value,
            "completed_at" = CASE WHEN pct.value = 100 THEN COALESCE(e."completed_at", CURRENT_TIMESTAMP) ELSE NULL END
        FROM pct WHERE e."id" = pct."id" AND (e."progress_pct" <> pct.value OR (pct.value = 100) <> (e."completed_at" IS NOT NULL))`;
}

// Validates lesson media and prerequisites, returning the columns to save.
async function lessonData(client, collegeId, courseId, data, lessonId = null) {
    let fileId = null;
    if (data.lessonType !== 'TEXT') {
        const file = await client.fileUpload.findFirst({ where: { id: data.fileId, collegeId, ...active } });
        if (!file || file.purpose !== data.lessonType)
            fail(400, data.lessonType === 'VIDEO' ? 'Upload a video file for a video lesson' : 'Upload a PDF file for a document lesson');
        fileId = file.id;
    }
    const prerequisiteLessonId = data.prerequisiteLessonId || null;
    if (prerequisiteLessonId) {
        if (prerequisiteLessonId === lessonId)
            fail(400, 'A lesson cannot be its own prerequisite');
        // Follow the chain to reject cycles (A requires B requires A).
        let current = prerequisiteLessonId;
        for (let depth = 0; current; depth++) {
            const lesson = await client.lesson.findFirst({ where: { id: current, ...active, module: { courseId, ...active } }, select: { prerequisiteLessonId: true } });
            if (!lesson)
                fail(400, depth === 0 ? 'Prerequisite must be a lesson in this course' : 'Prerequisite chain is broken');
            if (depth > 200 || lesson.prerequisiteLessonId === lessonId && lessonId)
                fail(400, 'Prerequisites cannot form a loop');
            current = lesson.prerequisiteLessonId;
        }
    }
    return {
        title: data.title, lessonType: data.lessonType, content: data.content, fileId, prerequisiteLessonId,
        durationSec: data.durationSec ?? null, allowDownload: flag(data.allowDownload && data.lessonType === 'DOCUMENT'), published: flag(data.published),
        ...(data.position !== undefined ? { position: data.position } : {}),
    };
}

// A linked syllabus must be an active PDF upload of the same college.
async function checkSyllabusFile(collegeId, fileId) {
    if (fileId && !await db.fileUpload.findFirst({ where: { id: fileId, collegeId, purpose: 'DOCUMENT', ...active } }))
        fail(400, 'Upload a PDF from this college as the syllabus');
}

async function requireOwner(identity, collegeId, courseId) {
    const course = await db.course.findFirst({ where: courseScope(identity, collegeId, courseId), include: { instructors: { where: active } } });
    if (!course)
        notFound('Course');
    if (identity.role === 'TEACHER' && !course.instructors.some(i => i.userId === identity.id && i.role === 'OWNER'))
        fail(403, 'Only the course owner can manage instructors');
    return course;
}

export const courseModel = {
    // Own-college courses first, then courses shared by other colleges; each carries canEdit.
    async list(identity, collegeId) {
        const courses = await db.course.findMany({
            where: visibleCourses(identity, collegeId),
            include: {
                college: { select: { id: true, name: true } },
                teacher: { select: { name: true } },
                instructors: { where: active, select: { userId: true, role: true, user: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
                syllabusFile: { select: fileFields },
                modules: { where: active, orderBy: { position: 'asc' }, include: { lessons: { where: active, orderBy: { position: 'asc' }, include: { file: { select: fileFields }, progress: { where: { userId: identity.id, ...active }, select: { completedAt: true, lastPositionSec: true, timeSpentSec: true } } } } } },
                enrollments: { where: { userId: identity.id, ...active }, select: { id: true, progressPct: true, completedAt: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return courses.map(course => withAccess(identity, collegeId, course)).sort((a, b) => (a.collegeId === collegeId ? 0 : 1) - (b.collegeId === collegeId ? 0 : 1));
    },
    // One lesson's full content (formatted chapters included), for anyone who may see the lesson:
    // the course's editors always; others only for published lessons of readable courses (students also need the prerequisite).
    async lessonContent(identity, collegeId, lessonId) {
        const lesson = await db.lesson.findFirst({
            where: { id: lessonId, ...active, module: { ...active, course: visibleCourses(identity, collegeId) } },
            select: { id: true, title: true, content: true, contentFormat: true, published: true, prerequisiteLessonId: true, module: { select: { course: { select: { collegeId: true, instructors: { where: active, select: { userId: true } } } } } } },
        });
        if (!lesson) notFound('Lesson');
        if (!canEditCourse(identity, collegeId, lesson.module.course)) {
            if (lesson.published !== 1) notFound('Lesson');
            if (identity.role === 'STUDENT') await assertPrerequisite(identity, lesson);
        }
        return { id: lesson.id, title: lesson.title, content: lesson.content, contentFormat: lesson.contentFormat };
    },
    // One course with its full syllabus under the same visibility rules as list().
    async syllabus(identity, collegeId, courseId) {
        const course = await db.course.findFirst({
            where: { id: courseId, ...visibleCourses(identity, collegeId) },
            include: {
                college: { select: { name: true } },
                instructors: { where: active, select: { userId: true, role: true, user: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
                modules: { where: active, orderBy: { position: 'asc' }, include: { lessons: { where: active, orderBy: { position: 'asc' }, select: { title: true, lessonType: true, durationSec: true, content: true, published: true } } } },
            },
        });
        if (!course) notFound('Course');
        return withAccess(identity, collegeId, course);
    },
    async create(identity, collegeId, data) {
        const audit = { collegeId, createdBy: identity.id };
        const { code, level, durationHours, objectives, outcomes, syllabusFileId } = data;
        await checkSyllabusFile(collegeId, syllabusFileId);
        return db.course.create({ data: { title: data.title, description: data.description, code, level, durationHours, objectives, outcomes, syllabusFileId, teacherId: identity.id, ...audit,
            instructors: { create: { userId: identity.id, role: 'OWNER', ...audit } },
            modules: { create: { title: data.moduleTitle, ...audit, lessons: { create: { title: data.lessonTitle, content: data.content, ...audit } } } } } });
    },
    async updateCourse(identity, collegeId, id, data) {
        // Sharing with every college is an administrative decision.
        if (data.shared !== undefined && identity.role === 'TEACHER')
            fail(403, 'Only admins can share a course with all colleges');
        await checkSyllabusFile(collegeId, data.syllabusFileId);
        const result = await db.course.updateMany({ where: courseScope(identity, collegeId, id), data: { ...data, updatedBy: identity.id } });
        if (!result.count) notFound('Course');
        return { success: true };
    },
    async createModule(identity, collegeId, courseId, data) {
        return db.$transaction(async transaction => {
            if (!await transaction.course.findFirst({ where: courseScope(identity, collegeId, courseId) })) notFound('Course');
            const last = await transaction.courseModule.aggregate({ where: { courseId, collegeId, ...active }, _max: { position: true } });
            return transaction.courseModule.create({ data: { ...data, position: data.position ?? (last._max.position ?? -1) + 1, courseId, collegeId, createdBy: identity.id } });
        });
    },
    async updateModule(identity, collegeId, courseId, id, data) {
        const result = await db.courseModule.updateMany({ where: moduleScope(identity, collegeId, courseId, id), data: { ...data, updatedBy: identity.id } });
        if (!result.count) notFound('Module');
        return { success: true };
    },
    // Soft delete: lessons of an inactive module are hidden and locked through the module filter.
    async deleteModule(identity, collegeId, courseId, id) {
        const result = await db.courseModule.updateMany({ where: moduleScope(identity, collegeId, courseId, id), data: { activeIndicator: 0, updatedBy: identity.id } });
        if (!result.count) notFound('Module');
        await recalculateProgress(db, courseId);
        return { success: true };
    },
    async createLesson(identity, collegeId, courseId, moduleId, data) {
        const lesson = await db.$transaction(async transaction => {
            if (!await transaction.courseModule.findFirst({ where: moduleScope(identity, collegeId, courseId, moduleId) })) notFound('Module');
            const values = await lessonData(transaction, collegeId, courseId, data);
            const last = await transaction.lesson.aggregate({ where: { moduleId, collegeId, ...active }, _max: { position: true } });
            return transaction.lesson.create({ data: { ...values, position: data.position ?? (last._max.position ?? -1) + 1, moduleId, collegeId, createdBy: identity.id } });
        });
        await recalculateProgress(db, courseId);
        return lesson;
    },
    async updateLesson(identity, collegeId, courseId, moduleId, id, data) {
        await db.$transaction(async transaction => {
            if (!await transaction.lesson.findFirst({ where: lessonScope(identity, collegeId, courseId, moduleId, id) })) notFound('Lesson');
            await transaction.lesson.update({ where: { id }, data: { ...await lessonData(transaction, collegeId, courseId, data, id), updatedBy: identity.id } });
        });
        await recalculateProgress(db, courseId);
        return { success: true };
    },
    async deleteLesson(identity, collegeId, courseId, moduleId, id) {
        const result = await db.lesson.updateMany({ where: lessonScope(identity, collegeId, courseId, moduleId, id), data: { activeIndicator: 0, updatedBy: identity.id } });
        if (!result.count) notFound('Lesson');
        await recalculateProgress(db, courseId);
        return { success: true };
    },
    async completeLesson(identity, collegeId, lessonId) {
        const lesson = await learnerLesson(collegeId, lessonId);
        if (!lesson) notFound('Lesson');
        await assertPrerequisite(identity, lesson);
        await ensureEnrollment(identity, collegeId, lesson.module.courseId);
        const key = { userId_lessonId: { userId: identity.id, lessonId: lesson.id } };
        const existing = await db.lessonProgress.findUnique({ where: key });
        // Completing twice keeps the first completion time.
        const progress = await db.lessonProgress.upsert({ where: key, create: { userId: identity.id, lessonId: lesson.id, collegeId, completedAt: new Date(), createdBy: identity.id }, update: { activeIndicator: 1, completedAt: existing?.completedAt ?? new Date(), updatedBy: identity.id } });
        await recalculateProgress(db, lesson.module.courseId, identity.id);
        return progress;
    },
    // Saves the video position and adds watch time (the client sends the seconds since its last save).
    async saveProgress(identity, collegeId, lessonId, { positionSec, spentSec }) {
        const lesson = await learnerLesson(collegeId, lessonId);
        if (!lesson) notFound('Lesson');
        await assertPrerequisite(identity, lesson);
        if (!await db.enrollment.findUnique({ where: { userId_courseId: { userId: identity.id, courseId: lesson.module.courseId } } })) {
            await ensureEnrollment(identity, collegeId, lesson.module.courseId);
            await recalculateProgress(db, lesson.module.courseId, identity.id);
        }
        const position =lesson.durationSec ? Math.min(positionSec, lesson.durationSec) : positionSec;
        return db.lessonProgress.upsert({
            where: { userId_lessonId: { userId: identity.id, lessonId: lesson.id } },
            create: { userId: identity.id, lessonId: lesson.id, collegeId, lastPositionSec: position, timeSpentSec: spentSec, createdBy: identity.id },
            update: { activeIndicator: 1, lastPositionSec: position, timeSpentSec: { increment: spentSec }, updatedBy: identity.id },
            select: { lastPositionSec: true, timeSpentSec: true, completedAt: true },
        });
    },
    async addInstructor(identity, collegeId, courseId, userId) {
        const course = await requireOwner(identity, collegeId, courseId);
        const teacher = await db.user.findFirst({ where: { id: userId, collegeId, role: 'TEACHER', status: 'ACTIVE', ...active } });
        if (!teacher)
            fail(400, 'Choose an active teacher from this college');
        await db.courseInstructor.upsert({ where: { courseId_userId: { courseId: course.id, userId } }, create: { courseId: course.id, userId, collegeId, role: 'CO_INSTRUCTOR', createdBy: identity.id }, update: { activeIndicator: 1, updatedBy: identity.id } });
        return { success: true };
    },
    async removeInstructor(identity, collegeId, courseId, userId) {
        const course = await requireOwner(identity, collegeId, courseId);
        const instructor = course.instructors.find(i => i.userId === userId);
        if (!instructor)
            notFound('Instructor');
        if (instructor.role === 'OWNER')
            fail(400, 'The course owner cannot be removed');
        await db.courseInstructor.update({ where: { id: instructor.id }, data: { activeIndicator: 0, updatedBy: identity.id } });
        return { success: true };
    },
};
