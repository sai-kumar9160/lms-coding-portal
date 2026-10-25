import { db, params } from '../../../../config/db.config.js';
import { fail, notFound } from '../../../utils/http-error.js';

const flag = value => value ? 1 : 0;

// Column lists for the rows these queries return (RETURNING needs no table alias).
const COURSE_RETURNING = `id, "collegeId", title, description, status, course_cd AS "code", level_cd AS "level", duration_hrs_ct AS "durationHours",
    objectives_tx AS "objectives", outcomes_tx AS "outcomes", shared_in AS "shared", syllabus_file_id AS "syllabusFileId", "teacherId", i_ts AS "createdAt", u_ts AS "updatedAt", crte_usr_id AS "createdBy", updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`;
const MODULE_RETURNING = `id, "collegeId", title, module_dscn_tx AS "description", position, "courseId", i_ts AS "createdAt", u_ts AS "updatedAt", crte_usr_id AS "createdBy", updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`;
const LESSON_RETURNING = `id, "collegeId", title, lesson_type AS "lessonType", content, content_fmt_cd AS "contentFormat", file_id AS "fileId", duration_sec AS "durationSec",
    allow_download_in AS "allowDownload", published_in AS "published", prerequisite_lesson_id AS "prerequisiteLessonId", position, "moduleId", i_ts AS "createdAt", u_ts AS "updatedAt", crte_usr_id AS "createdBy", updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`;
// Course and unit fields an edit may change: property sent by the client -> column. Only the fields that were sent are updated.
const COURSE_FIELDS = { title: 'title', description: 'description', status: 'status', code: 'course_cd', level: 'level_cd', durationHours: 'duration_hrs_ct',
    objectives: 'objectives_tx', outcomes: 'outcomes_tx', shared: 'shared_in', syllabusFileId: 'syllabus_file_id' };
const MODULE_FIELDS = { title: 'title', description: 'module_dscn_tx', position: 'position' };
// "title = $3, course_cd = $4" for the fields present in data; q numbers the parameters.
function setClause(fields, data, q) {
    return Object.entries(fields).filter(([property]) => data[property] !== undefined).map(([property, column]) => `${column} = ${q.add(data[property])}`);
}

// ---- Reusable SQL conditions. Each takes the parameter binder `q` and the alias of the table it filters. ----

// Teachers work only on courses they instruct (owner or co-instructor); College Admins on every course in their college.
export const instructsSql = (q, identity, course = 'c') =>
    `EXISTS (SELECT 1 FROM crse_instrctr_rel_t i WHERE i.course_id = ${course}.id AND i.user_id = ${q.add(identity.id)} AND i.a_in = 1)`;
const courseScope = (q, identity, collegeId, id, c = 'c') =>
    `${c}.id = ${q.add(id)} AND ${c}."collegeId" = ${q.add(collegeId)} AND ${c}.a_in = 1${identity.role === 'TEACHER' ? ` AND ${instructsSql(q, identity, c)}` : ''}`;
const moduleScope = (q, identity, collegeId, courseId, id, m = 'm') =>
    `${m}.id = ${q.add(id)} AND ${m}."courseId" = ${q.add(courseId)} AND ${m}."collegeId" = ${q.add(collegeId)} AND ${m}.a_in = 1
     AND EXISTS (SELECT 1 FROM "Course" sc WHERE sc.id = ${m}."courseId" AND ${courseScope(q, identity, collegeId, courseId, 'sc')})`;
const lessonScope = (q, identity, collegeId, courseId, moduleId, id, l = 'l') =>
    `${l}.id = ${q.add(id)} AND ${l}."moduleId" = ${q.add(moduleId)} AND ${l}."collegeId" = ${q.add(collegeId)} AND ${l}.a_in = 1
     AND EXISTS (SELECT 1 FROM "CourseModule" sm WHERE sm.id = ${l}."moduleId" AND ${moduleScope(q, identity, collegeId, courseId, moduleId, 'sm')})`;

// Published courses a college's users can read: their own college's, plus courses shared with every college.
export const readableCourseSql = (q, collegeId, c = 'c') =>
    `${c}.a_in = 1 AND ${c}.status = 'PUBLISHED' AND (${c}."collegeId" = ${q.add(collegeId)} OR ${c}.shared_in = 1)`;

// Which courses a user sees:
// - students: published courses of their college and shared published courses;
// - teachers: courses they instruct (any status) plus the same published ones, read-only;
// - College Admins (and a Super Admin in a college): every course of the college plus shared published ones.
function visibleCoursesSql(q, identity, collegeId, c = 'c') {
    if (identity.role === 'STUDENT')
        return readableCourseSql(q, collegeId, c);
    const own = identity.role === 'TEACHER' ? `${c}."collegeId" = ${q.add(collegeId)} AND ${instructsSql(q, identity, c)}` : `${c}."collegeId" = ${q.add(collegeId)}`;
    return `${c}.a_in = 1 AND ((${own}) OR (${c}.status = 'PUBLISHED' AND ${c}."collegeId" = ${q.add(collegeId)}) OR (${c}.status = 'PUBLISHED' AND ${c}.shared_in = 1))`;
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
export async function learnerLesson(collegeId, lessonId) {
    const q = params();
    const row = await db.one(
        `SELECT l.id, l."collegeId", l.title, l.lesson_type AS "lessonType", l.content, l.content_fmt_cd AS "contentFormat",
            l.file_id AS "fileId", l.duration_sec AS "durationSec", l.allow_download_in AS "allowDownload",
            l.published_in AS "published", l.prerequisite_lesson_id AS "prerequisiteLessonId", l.position,
            l."moduleId", l.i_ts AS "createdAt", l.u_ts AS "updatedAt", l.crte_usr_id AS "createdBy",
            l.updte_usr_id AS "updatedBy", l.a_in AS "activeIndicator", l.d_ts AS "deletedAt", m."courseId" AS "moduleCourseId"
         FROM "Lesson" l JOIN "CourseModule" m ON m.id = l."moduleId" JOIN "Course" c ON c.id = m."courseId"
         WHERE l.id = ${q.add(lessonId)} AND l.a_in = 1 AND l.published_in = 1 AND m.a_in = 1 AND ${readableCourseSql(q, collegeId)}`, q.values);
    if (!row) return null;
    const { moduleCourseId, ...lesson } = row;
    return { ...lesson, module: { courseId: moduleCourseId } };
}

// The Enrollment row only stores course progress; it is created the first time a student records progress.
function ensureEnrollment(identity, collegeId, courseId) {
    return db.run(
        `INSERT INTO "Enrollment" (id, "collegeId", "userId", "courseId", crte_usr_id) VALUES (DEFAULT, $1, $2, $3, $2)
         ON CONFLICT ("userId", "courseId") DO NOTHING`, [collegeId, identity.id, courseId]);
}

// Students must complete an active, published prerequisite lesson first.
export async function assertPrerequisite(identity, lesson) {
    if (!lesson.prerequisiteLessonId)
        return;
    const prerequisite = await db.one(
        `SELECT l.id, l.title FROM "Lesson" l JOIN "CourseModule" m ON m.id = l."moduleId"
         WHERE l.id = $1 AND l.a_in = 1 AND l.published_in = 1 AND m.a_in = 1`, [lesson.prerequisiteLessonId]);
    if (!prerequisite)
        return;
    const done = await db.one('SELECT 1 FROM "LessonProgress" WHERE "userId" = $1 AND "lessonId" = $2 AND a_in = 1 AND "completedAt" IS NOT NULL', [identity.id, prerequisite.id]);
    if (!done)
        fail(409, `Complete "${prerequisite.title}" first`);
}

// progress_pct = completed published lessons / published lessons, for one student or every enrollment of a course.
function recalculateProgress(client, courseId, userId = null) {
    return client.run(`
        WITH lessons AS (
            SELECT l."id" FROM "Lesson" l JOIN "CourseModule" m ON m."id" = l."moduleId"
            WHERE m."courseId" = $1 AND l."a_in" = 1 AND l."published_in" = 1 AND m."a_in" = 1
        ), total AS (SELECT COUNT(*) AS value FROM lessons),
        pct AS (
            SELECT en."id", CASE WHEN t.value = 0 THEN 0 ELSE (100 * COUNT(lp."id") / t.value)::int END AS value
            FROM "Enrollment" en CROSS JOIN total t
            LEFT JOIN "LessonProgress" lp ON lp."userId" = en."userId" AND lp."a_in" = 1 AND lp."completedAt" IS NOT NULL AND lp."lessonId" IN (SELECT "id" FROM lessons)
            WHERE en."courseId" = $1 AND ($2::int IS NULL OR en."userId" = $2::int)
            GROUP BY en."id", t.value
        )
        UPDATE "Enrollment" e SET "progress_pct" = pct.value,
            "completed_at" = CASE WHEN pct.value = 100 THEN COALESCE(e."completed_at", CURRENT_TIMESTAMP) ELSE NULL END
        FROM pct WHERE e."id" = pct."id" AND (e."progress_pct" <> pct.value OR (pct.value = 100) <> (e."completed_at" IS NOT NULL))`, [courseId, userId]);
}

// Validates lesson media and prerequisites, returning the columns to save.
async function lessonData(client, collegeId, courseId, data, lessonId = null) {
    let fileId = null;
    if (data.lessonType !== 'TEXT') {
        const file = await client.one('SELECT file_id AS id, purpose_cd AS purpose FROM file_upld_dtl_t WHERE file_id = $1 AND college_id = $2 AND a_in = 1', [data.fileId, collegeId]);
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
            const lesson = await client.one(
                `SELECT l.prerequisite_lesson_id AS "prerequisiteLessonId" FROM "Lesson" l JOIN "CourseModule" m ON m.id = l."moduleId"
                 WHERE l.id = $1 AND l.a_in = 1 AND m."courseId" = $2 AND m.a_in = 1`, [current, courseId]);
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
    if (fileId && !await db.one(`SELECT 1 FROM file_upld_dtl_t WHERE file_id = $1 AND college_id = $2 AND purpose_cd = 'DOCUMENT' AND a_in = 1`, [fileId, collegeId]))
        fail(400, 'Upload a PDF from this college as the syllabus');
}

async function activeInstructors(courseId) {
    return db.many('SELECT i.crse_instrctr_id AS id, i.user_id AS "userId", i.instrctr_role_cd AS role FROM crse_instrctr_rel_t i WHERE i.course_id = $1 AND i.a_in = 1', [courseId]);
}
async function requireOwner(identity, collegeId, courseId) {
    const q = params();
    const course = await db.one(`SELECT c.id, c."collegeId", c.title, c.description, c.status, c.course_cd AS "code", c.level_cd AS "level",
            c.duration_hrs_ct AS "durationHours", c.objectives_tx AS "objectives", c.outcomes_tx AS
            "outcomes", c.shared_in AS "shared", c.syllabus_file_id AS "syllabusFileId", c."teacherId", c.i_ts
            AS "createdAt", c.u_ts AS "updatedAt", c.crte_usr_id AS "createdBy", c.updte_usr_id AS
            "updatedBy", c.a_in AS "activeIndicator", c.d_ts AS "deletedAt" FROM "Course" c WHERE ${courseScope(q, identity, collegeId, courseId)}`, q.values);
    if (!course)
        notFound('Course');
    course.instructors = await activeInstructors(course.id);
    if (identity.role === 'TEACHER' && !course.instructors.some(i => i.userId === identity.id && i.role === 'OWNER'))
        fail(403, 'Only the course owner can manage instructors');
    return course;
}

const fileOf = row => (row.fileRef ? { id: row.fileRef, originalName: row.fileName, mimeType: row.fileMime, sizeBytes: row.fileSize } : null);

// Courses with their instructors, units and lessons, assembled from one query per level.
// `viewer` adds the signed-in user's lesson progress and enrollment (list) or leaves them out (syllabus).
async function loadCourses(courseRows, viewer) {
    const ids = courseRows.map(course => course.id);
    const [instructors, modules, lessons, enrollments] = await Promise.all([
        db.many(
            `SELECT i.course_id AS "courseId", i.user_id AS "userId", i.instrctr_role_cd AS role, u.name AS "userName"
             FROM crse_instrctr_rel_t i JOIN "User" u ON u.id = i.user_id
             WHERE i.course_id = ANY($1::int[]) AND i.a_in = 1 ORDER BY i.i_ts ASC`, [ids]),
        db.many(`SELECT m.id, m."collegeId", m.title, m.module_dscn_tx AS "description", m.position, m."courseId", m.i_ts AS
            "createdAt", m.u_ts AS "updatedAt", m.crte_usr_id AS "createdBy", m.updte_usr_id AS "updatedBy",
            m.a_in AS "activeIndicator", m.d_ts AS "deletedAt" FROM "CourseModule" m WHERE m."courseId" = ANY($1::int[]) AND m.a_in = 1 ORDER BY m.position ASC`, [ids]),
        db.many(
            `SELECT l.id, l."collegeId", l.title, l.lesson_type AS "lessonType", l.content, l.content_fmt_cd AS "contentFormat",
            l.file_id AS "fileId", l.duration_sec AS "durationSec", l.allow_download_in AS "allowDownload",
            l.published_in AS "published", l.prerequisite_lesson_id AS "prerequisiteLessonId", l.position,
            l."moduleId", l.i_ts AS "createdAt", l.u_ts AS "updatedAt", l.crte_usr_id AS "createdBy",
            l.updte_usr_id AS "updatedBy", l.a_in AS "activeIndicator", l.d_ts AS "deletedAt",
                    f.file_id AS "fileRef", f.orgnl_file_nm AS "fileName", f.mime_type_tx AS "fileMime", f.size_bytes_ct AS "fileSize",
                    lp.id IS NOT NULL AS "hasProgress", lp."completedAt" AS "doneAt", lp.last_position_sec AS "positionSec", lp.time_spent_sec AS "spentSec"
             FROM "Lesson" l
             JOIN "CourseModule" m ON m.id = l."moduleId"
             LEFT JOIN file_upld_dtl_t f ON f.file_id = l.file_id
             LEFT JOIN "LessonProgress" lp ON lp."lessonId" = l.id AND lp."userId" = $2 AND lp.a_in = 1
             WHERE m."courseId" = ANY($1::int[]) AND m.a_in = 1 AND l.a_in = 1 ORDER BY l.position ASC`, [ids, viewer.id]),
        db.many(`SELECT "courseId", id, progress_pct AS "progressPct", completed_at AS "completedAt" FROM "Enrollment" WHERE "userId" = $2 AND a_in = 1 AND "courseId" = ANY($1::int[])`, [ids, viewer.id]),
    ]);
    const lessonsOf = new Map();
    for (const { fileRef, fileName, fileMime, fileSize, hasProgress, doneAt, positionSec, spentSec, ...lesson } of lessons) {
        const item = { ...lesson, file: fileOf({ fileRef, fileName, fileMime, fileSize }), progress: hasProgress ? [{ completedAt: doneAt, lastPositionSec: positionSec, timeSpentSec: spentSec }] : [] };
        lessonsOf.set(lesson.moduleId, [...(lessonsOf.get(lesson.moduleId) ?? []), item]);
    }
    return courseRows.map(({ collegeName, teacherName, fileRef, fileName, fileMime, fileSize, ...course }) => ({
        ...course,
        college: { id: course.collegeId, name: collegeName },
        teacher: { name: teacherName },
        instructors: instructors.filter(i => i.courseId === course.id).map(i => ({ userId: i.userId, role: i.role, user: { name: i.userName } })),
        syllabusFile: fileOf({ fileRef, fileName, fileMime, fileSize }),
        modules: modules.filter(m => m.courseId === course.id).map(m => ({ ...m, lessons: lessonsOf.get(m.id) ?? [] })),
        enrollments: enrollments.filter(e => e.courseId === course.id).map(({ courseId, ...e }) => e),
    }));
}

const courseSelect = `c.id, c."collegeId", c.title, c.description, c.status, c.course_cd AS "code", c.level_cd AS "level",
            c.duration_hrs_ct AS "durationHours", c.objectives_tx AS "objectives", c.outcomes_tx AS
            "outcomes", c.shared_in AS "shared", c.syllabus_file_id AS "syllabusFileId", c."teacherId", c.i_ts
            AS "createdAt", c.u_ts AS "updatedAt", c.crte_usr_id AS "createdBy", c.updte_usr_id AS
            "updatedBy", c.a_in AS "activeIndicator", c.d_ts AS "deletedAt", k.name AS "collegeName", t.name AS "teacherName",
    f.file_id AS "fileRef", f.orgnl_file_nm AS "fileName", f.mime_type_tx AS "fileMime", f.size_bytes_ct AS "fileSize"
    FROM "Course" c JOIN "College" k ON k.id = c."collegeId" JOIN "User" t ON t.id = c."teacherId"
    LEFT JOIN file_upld_dtl_t f ON f.file_id = c.syllabus_file_id`;

export const courseMdl = {
    // Own-college courses first, then courses shared by other colleges; each carries canEdit.
    async list(identity, collegeId) {
        const q = params();
        const rows = await db.many(`SELECT ${courseSelect} WHERE ${visibleCoursesSql(q, identity, collegeId)} ORDER BY c.i_ts DESC`, q.values);
        const courses = await loadCourses(rows, identity);
        return courses.map(course => withAccess(identity, collegeId, course)).sort((a, b) => (a.collegeId === collegeId ? 0 : 1) - (b.collegeId === collegeId ? 0 : 1));
    },
    // One lesson's full content (formatted chapters included), for anyone who may see the lesson:
    // the course's editors always; others only for published lessons of readable courses (students also need the prerequisite).
    async lessonContent(identity, collegeId, lessonId) {
        const q = params();
        const lesson = await db.one(
            `SELECT l.id, l.title, l.content, l.content_fmt_cd AS "contentFormat", l.published_in AS published, l.prerequisite_lesson_id AS "prerequisiteLessonId",
                    c.id AS "courseId", c."collegeId" AS "courseCollegeId"
             FROM "Lesson" l JOIN "CourseModule" m ON m.id = l."moduleId" JOIN "Course" c ON c.id = m."courseId"
             WHERE l.id = ${q.add(lessonId)} AND l.a_in = 1 AND m.a_in = 1 AND ${visibleCoursesSql(q, identity, collegeId)}`, q.values);
        if (!lesson) notFound('Lesson');
        const course = { collegeId: lesson.courseCollegeId, instructors: await activeInstructors(lesson.courseId) };
        if (!canEditCourse(identity, collegeId, course)) {
            if (lesson.published !== 1) notFound('Lesson');
            if (identity.role === 'STUDENT') await assertPrerequisite(identity, lesson);
        }
        return { id: lesson.id, title: lesson.title, content: lesson.content, contentFormat: lesson.contentFormat };
    },
    // One course with its full syllabus under the same visibility rules as list().
    async syllabus(identity, collegeId, courseId) {
        const q = params();
        const row = await db.one(`SELECT ${courseSelect} WHERE c.id = ${q.add(courseId)} AND ${visibleCoursesSql(q, identity, collegeId)}`, q.values);
        if (!row) notFound('Course');
        const [course] = await loadCourses([row], identity);
        return withAccess(identity, collegeId, {
            ...course, college: { name: course.college.name },
            modules: course.modules.map(m => ({ ...m, lessons: m.lessons.map(({ title, lessonType, durationSec, content, published }) => ({ title, lessonType, durationSec, content, published })) })),
        });
    },
    async create(identity, collegeId, data) {
        const { code, level, durationHours, objectives, outcomes, syllabusFileId } = data;
        await checkSyllabusFile(collegeId, syllabusFileId);
        return db.transaction(async tx => {
            const course = await tx.one(
                `INSERT INTO "Course" (id, "collegeId", title, description, course_cd, level_cd, duration_hrs_ct, objectives_tx, outcomes_tx, syllabus_file_id, "teacherId", crte_usr_id)
                 VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, COALESCE($7, ''), COALESCE($8, ''), $9, $10, $10)
                 RETURNING ${COURSE_RETURNING}`,
                [collegeId, data.title, data.description, code ?? null, level ?? null, durationHours ?? null, objectives ?? null, outcomes ?? null, syllabusFileId ?? null, identity.id]);
            await tx.run(
                `INSERT INTO crse_instrctr_rel_t (crse_instrctr_id, college_id, course_id, user_id, instrctr_role_cd, crte_usr_id) VALUES (DEFAULT, $1, $2, $3, 'OWNER', $3)`,
                [collegeId, course.id, identity.id]);
            const module = await tx.one(
                `INSERT INTO "CourseModule" (id, "collegeId", "courseId", title, crte_usr_id) VALUES (DEFAULT, $1, $2, $3, $4) RETURNING id`,
                [collegeId, course.id, data.moduleTitle, identity.id]);
            await tx.run(
                `INSERT INTO "Lesson" (id, "collegeId", "moduleId", title, content, crte_usr_id) VALUES (DEFAULT, $1, $2, $3, $4, $5)`,
                [collegeId, module.id, data.lessonTitle, data.content, identity.id]);
            return course;
        });
    },
    async updateCourse(identity, collegeId, id, data) {
        // Sharing with every college is an administrative decision.
        if (data.shared !== undefined && identity.role === 'TEACHER')
            fail(403, 'Only admins can share a course with all colleges');
        await checkSyllabusFile(collegeId, data.syllabusFileId);
        const q = params();
        const set = setClause(COURSE_FIELDS, data, q);
        set.push(`updte_usr_id = ${q.add(identity.id)}`);
        const changed = await db.run(`UPDATE "Course" c SET ${set.join(', ')} WHERE ${courseScope(q, identity, collegeId, id)}`, q.values);
        if (!changed) notFound('Course');
        return { success: true };
    },
    async createModule(identity, collegeId, courseId, data) {
        return db.transaction(async tx => {
            const q = params();
            if (!await tx.one(`SELECT 1 FROM "Course" c WHERE ${courseScope(q, identity, collegeId, courseId)}`, q.values)) notFound('Course');
            const last = await tx.one('SELECT COALESCE(MAX(position), -1) AS last FROM "CourseModule" WHERE "courseId" = $1 AND "collegeId" = $2 AND a_in = 1', [courseId, collegeId]);
            return tx.one(
                `INSERT INTO "CourseModule" (id, "collegeId", "courseId", title, module_dscn_tx, position, crte_usr_id)
                 VALUES (DEFAULT, $1, $2, $3, COALESCE($4, ''), $5, $6) RETURNING ${MODULE_RETURNING}`,
                [collegeId, courseId, data.title, data.description ?? null, data.position ?? last.last + 1, identity.id]);
        });
    },
    async updateModule(identity, collegeId, courseId, id, data) {
        const q = params();
        const set = setClause(MODULE_FIELDS, data, q);
        set.push(`updte_usr_id = ${q.add(identity.id)}`);
        const changed = await db.run(`UPDATE "CourseModule" m SET ${set.join(', ')} WHERE ${moduleScope(q, identity, collegeId, courseId, id)}`, q.values);
        if (!changed) notFound('Module');
        return { success: true };
    },
    // Soft delete: lessons of an inactive module are hidden and locked through the module filter.
    async deleteModule(identity, collegeId, courseId, id) {
        const q = params();
        const changed = await db.run(`UPDATE "CourseModule" m SET a_in = 0, updte_usr_id = ${q.add(identity.id)} WHERE ${moduleScope(q, identity, collegeId, courseId, id)}`, q.values);
        if (!changed) notFound('Module');
        await recalculateProgress(db, courseId);
        return { success: true };
    },
    async createLesson(identity, collegeId, courseId, moduleId, data) {
        const lesson = await db.transaction(async tx => {
            const q = params();
            if (!await tx.one(`SELECT 1 FROM "CourseModule" m WHERE ${moduleScope(q, identity, collegeId, courseId, moduleId)}`, q.values)) notFound('Module');
            const values = await lessonData(tx, collegeId, courseId, data);
            const last = await tx.one('SELECT COALESCE(MAX(position), -1) AS last FROM "Lesson" WHERE "moduleId" = $1 AND "collegeId" = $2 AND a_in = 1', [moduleId, collegeId]);
            return tx.one(
                `INSERT INTO "Lesson" (id, "collegeId", "moduleId", title, lesson_type, content, file_id, prerequisite_lesson_id, duration_sec, allow_download_in, published_in, position, crte_usr_id)
                 VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING ${LESSON_RETURNING}`,
                [collegeId, moduleId, values.title, values.lessonType, values.content, values.fileId, values.prerequisiteLessonId, values.durationSec, values.allowDownload, values.published,
                    data.position ?? last.last + 1, identity.id]);
        });
        await recalculateProgress(db, courseId);
        return lesson;
    },
    async updateLesson(identity, collegeId, courseId, moduleId, id, data) {
        await db.transaction(async tx => {
            const q = params();
            if (!await tx.one(`SELECT 1 FROM "Lesson" l WHERE ${lessonScope(q, identity, collegeId, courseId, moduleId, id)}`, q.values)) notFound('Lesson');
            const values = await lessonData(tx, collegeId, courseId, data, id);
            await tx.run(
                `UPDATE "Lesson" SET title = $2, lesson_type = $3, content = $4, file_id = $5, prerequisite_lesson_id = $6, duration_sec = $7, allow_download_in = $8, published_in = $9,
                        position = COALESCE($10, position), updte_usr_id = $11 WHERE id = $1`,
                [id, values.title, values.lessonType, values.content, values.fileId, values.prerequisiteLessonId, values.durationSec, values.allowDownload, values.published, values.position ?? null, identity.id]);
        });
        await recalculateProgress(db, courseId);
        return { success: true };
    },
    async deleteLesson(identity, collegeId, courseId, moduleId, id) {
        const q = params();
        const changed = await db.run(`UPDATE "Lesson" l SET a_in = 0, updte_usr_id = ${q.add(identity.id)} WHERE ${lessonScope(q, identity, collegeId, courseId, moduleId, id)}`, q.values);
        if (!changed) notFound('Lesson');
        await recalculateProgress(db, courseId);
        return { success: true };
    },
    async completeLesson(identity, collegeId, lessonId) {
        const lesson = await learnerLesson(collegeId, lessonId);
        if (!lesson) notFound('Lesson');
        await assertPrerequisite(identity, lesson);
        await ensureEnrollment(identity, collegeId, lesson.module.courseId);
        // Completing twice keeps the first completion time.
        const progress = await db.one(
            `INSERT INTO "LessonProgress" (id, "collegeId", "userId", "lessonId", "completedAt", crte_usr_id)
             VALUES (DEFAULT, $1, $2, $3, $4, $2)
             ON CONFLICT ("userId", "lessonId") DO UPDATE
             SET a_in = 1, "completedAt" = COALESCE("LessonProgress"."completedAt", $4), updte_usr_id = $2
             RETURNING "LessonProgress".id, "LessonProgress"."collegeId", "LessonProgress"."userId", "LessonProgress"."lessonId",
            "LessonProgress"."completedAt", "LessonProgress".last_position_sec AS "lastPositionSec",
            "LessonProgress".time_spent_sec AS "timeSpentSec", "LessonProgress".i_ts AS "createdAt",
            "LessonProgress".u_ts AS "updatedAt", "LessonProgress".crte_usr_id AS "createdBy",
            "LessonProgress".updte_usr_id AS "updatedBy", "LessonProgress".a_in AS "activeIndicator",
            "LessonProgress".d_ts AS "deletedAt"`, [collegeId, identity.id, lesson.id, new Date()]);
        await recalculateProgress(db, lesson.module.courseId, identity.id);
        return progress;
    },
    // Saves the video position and adds watch time (the client sends the seconds since its last save).
    async saveProgress(identity, collegeId, lessonId, { positionSec, spentSec }) {
        const lesson = await learnerLesson(collegeId, lessonId);
        if (!lesson) notFound('Lesson');
        await assertPrerequisite(identity, lesson);
        if (!await db.one('SELECT 1 FROM "Enrollment" WHERE "userId" = $1 AND "courseId" = $2', [identity.id, lesson.module.courseId])) {
            await ensureEnrollment(identity, collegeId, lesson.module.courseId);
            await recalculateProgress(db, lesson.module.courseId, identity.id);
        }
        const position = lesson.durationSec ? Math.min(positionSec, lesson.durationSec) : positionSec;
        return db.one(
            `INSERT INTO "LessonProgress" (id, "collegeId", "userId", "lessonId", last_position_sec, time_spent_sec, crte_usr_id)
             VALUES (DEFAULT, $1, $2, $3, $4, $5, $2)
             ON CONFLICT ("userId", "lessonId") DO UPDATE
             SET a_in = 1, last_position_sec = $4, time_spent_sec = "LessonProgress".time_spent_sec + $5, updte_usr_id = $2
             RETURNING last_position_sec AS "lastPositionSec", time_spent_sec AS "timeSpentSec", "completedAt"`, [collegeId, identity.id, lesson.id, position, spentSec]);
    },
    async addInstructor(identity, collegeId, courseId, userId) {
        const course = await requireOwner(identity, collegeId, courseId);
        const teacher = await db.one(`SELECT 1 FROM "User" WHERE id = $1 AND "collegeId" = $2 AND role = 'TEACHER' AND status = 'ACTIVE' AND a_in = 1`, [userId, collegeId]);
        if (!teacher)
            fail(400, 'Choose an active teacher from this college');
        await db.run(
            `INSERT INTO crse_instrctr_rel_t (crse_instrctr_id, college_id, course_id, user_id, instrctr_role_cd, crte_usr_id)
             VALUES (DEFAULT, $1, $2, $3, 'CO_INSTRUCTOR', $4)
             ON CONFLICT (course_id, user_id) DO UPDATE SET a_in = 1, updte_usr_id = $4`, [collegeId, course.id, userId, identity.id]);
        return { success: true };
    },
    async removeInstructor(identity, collegeId, courseId, userId) {
        const course = await requireOwner(identity, collegeId, courseId);
        const instructor = course.instructors.find(i => i.userId === userId);
        if (!instructor)
            notFound('Instructor');
        if (instructor.role === 'OWNER')
            fail(400, 'The course owner cannot be removed');
        await db.run('UPDATE crse_instrctr_rel_t SET a_in = 0, updte_usr_id = $2 WHERE crse_instrctr_id = $1', [instructor.id, identity.id]);
        return { success: true };
    },
};
