// Re-converts a course's linked PDF with the current converter and replaces its units and lessons.
// Usage (from E:\LMS\server): node scripts/rebuild-course.mjs --course <course id>
// The same action is available in the app as Manage course → "Rebuild lessons from the course PDF".
import 'dotenv/config';
import { parseArgs } from 'node:util';
import { db } from '../config/db.config.js';
import { writeAuditLog } from './lib/audit-log.mjs';
import { rebuildCourseFromPdf } from '../src/services/pdf-course.service.js';
import { resolveKey } from '../src/services/file-storage.service.js';

const { values: args } = parseArgs({ options: { course: { type: 'string' } } });
try {
    if (!args.course) throw new Error('Usage: node scripts/rebuild-course.mjs --course <course id>');
    const course = await db.one(`SELECT c.id, c."collegeId", c.title, c.description, c.status, c.course_cd AS "code", c.level_cd AS "level",
            c.duration_hrs_ct AS "durationHours", c.objectives_tx AS "objectives", c.outcomes_tx AS
            "outcomes", c.shared_in AS "shared", c.syllabus_file_id AS "syllabusFileId", c."teacherId", c.i_ts
            AS "createdAt", c.u_ts AS "updatedAt", c.crte_usr_id AS "createdBy", c.updte_usr_id AS
            "updatedBy", c.a_in AS "activeIndicator", c.d_ts AS "deletedAt" FROM "Course" c WHERE c.id = $1 AND c.a_in = 1`, [args.course]);
    if (course) course.syllabusFile = course.syllabusFileId && await db.one(`SELECT f.file_id AS "id", f.college_id AS "collegeId", f.storage_key_tx AS "storageKey", f.orgnl_file_nm AS
            "originalName", f.mime_type_tx AS "mimeType", f.size_bytes_ct AS "sizeBytes", f.checksum_tx AS
            "checksum", f.purpose_cd AS "purpose", f.lesson_id AS "lessonId", f.i_ts AS "createdAt", f.u_ts AS
            "updatedAt", f.crte_usr_id AS "createdBy", f.updte_usr_id AS "updatedBy", f.a_in AS
            "activeIndicator", f.d_ts AS "deletedAt" FROM file_upld_dtl_t f WHERE f.file_id = $1`, [course.syllabusFileId]);
    if (!course?.syllabusFile) throw new Error('Course not found or it has no linked PDF');
    const result = await rebuildCourseFromPdf({ id: course.teacherId }, course.collegeId, course, resolveKey(course.syllabusFile.storageKey));
    await writeAuditLog({ collegeId: course.collegeId, actorId: course.teacherId, action: 'rebuild_from_pdf', entityType: 'course', entityId: course.id, after: result });
    console.log(`Rebuilt "${course.title}": ${result.units} units, ${result.lessons} lessons, ${result.images} figures.`);
}
catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
finally {
    await db.end();
}
