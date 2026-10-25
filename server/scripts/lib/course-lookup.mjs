import { db } from '../../config/db.config.js';

export const findCollege = slug => db.one(`SELECT c.id, c.name, c.slug, c.active, c.i_ts AS "createdAt", c.u_ts AS "updatedAt", c.crte_usr_id AS "createdBy",
            c.updte_usr_id AS "updatedBy", c.a_in AS "activeIndicator", c.d_ts AS "deletedAt" FROM "College" c WHERE c.slug = $1 AND c.a_in = 1`, [slug]);

// An active course of a college by its code, with its active units and their active lessons.
export async function findCourseWithLessons(collegeId, code) {
    const course = await db.one(`SELECT c.id, c."collegeId", c.title, c.description, c.status, c.course_cd AS "code", c.level_cd AS "level",
            c.duration_hrs_ct AS "durationHours", c.objectives_tx AS "objectives", c.outcomes_tx AS
            "outcomes", c.shared_in AS "shared", c.syllabus_file_id AS "syllabusFileId", c."teacherId", c.i_ts
            AS "createdAt", c.u_ts AS "updatedAt", c.crte_usr_id AS "createdBy", c.updte_usr_id AS
            "updatedBy", c.a_in AS "activeIndicator", c.d_ts AS "deletedAt" FROM "Course" c WHERE c."collegeId" = $1 AND c.course_cd = $2 AND c.a_in = 1`, [collegeId, code]);
    if (!course) return null;
    const modules = await db.many(`SELECT m.id, m."collegeId", m.title, m.module_dscn_tx AS "description", m.position, m."courseId", m.i_ts AS
            "createdAt", m.u_ts AS "updatedAt", m.crte_usr_id AS "createdBy", m.updte_usr_id AS "updatedBy",
            m.a_in AS "activeIndicator", m.d_ts AS "deletedAt" FROM "CourseModule" m WHERE m."courseId" = $1 AND m.a_in = 1 ORDER BY m.position`, [course.id]);
    const lessons = await db.many(`SELECT l.id, l."collegeId", l.title, l.lesson_type AS "lessonType", l.content, l.content_fmt_cd AS "contentFormat",
            l.file_id AS "fileId", l.duration_sec AS "durationSec", l.allow_download_in AS "allowDownload",
            l.published_in AS "published", l.prerequisite_lesson_id AS "prerequisiteLessonId", l.position,
            l."moduleId", l.i_ts AS "createdAt", l.u_ts AS "updatedAt", l.crte_usr_id AS "createdBy",
            l.updte_usr_id AS "updatedBy", l.a_in AS "activeIndicator", l.d_ts AS "deletedAt" FROM "Lesson" l WHERE l."moduleId" = ANY($1::int[]) AND l.a_in = 1 ORDER BY l.position`, [modules.map(m => m.id)]);
    return { ...course, modules: modules.map(m => ({ ...m, lessons: lessons.filter(l => l.moduleId === m.id) })) };
}
