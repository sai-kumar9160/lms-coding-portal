import { randomUUID } from 'node:crypto';
import { db, params } from '../../../../config/db.config.js';
import { detectType, sha256, moveInto, resolveKey, removeFile } from '../../../services/file-storage.service.js';
import { assertPrerequisite, instructsSql, readableCourseSql } from '../../course/models/courseMdl.js';
import { fail, notFound } from '../../../utils/http-error.js';
import { createLogger } from '../../../utils/logger.js';

const log = createLogger('file.model');
// Keep printable characters only; path parts are already removed by multer.
const cleanName = (name) => name.replace(/[\u0000-\u001f\u007f"\\/<>]/g, '').trim().slice(0, 200) || 'file';

export const fileMdl = {
    // Validates a temporary upload, moves it to colleges/<collegeId>/<yyyy>/<mm>/<id>.<ext> and records it.
    // options.lessonId marks an image that belongs to a lesson's formatted content.
    async store(identity, collegeId, purpose, upload, { lessonId = null } = {}) {
        let finalPath = null;
        try {
            const type = await detectType(upload.path);
            if (!type || type.purpose !== purpose)
                fail(415, purpose === 'VIDEO' ? 'Upload an MP4 or WebM video' : purpose === 'IMAGE' ? 'Upload a PNG or JPEG image' : 'Upload a PDF document');
            const checksum = await sha256(upload.path);
            const name = randomUUID(); // the stored file's name; the row's own id is a number the database counts up
            const now = new Date();
            const storageKey = `colleges/${collegeId}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${name}.${type.ext}`;
            await moveInto(upload.path, storageKey);
            finalPath = resolveKey(storageKey);
            const file = await db.one(
                `INSERT INTO file_upld_dtl_t (file_id, college_id, storage_key_tx, orgnl_file_nm, mime_type_tx, size_bytes_ct, checksum_tx, purpose_cd, lesson_id, crte_usr_id)
                 VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING file_id AS "id", orgnl_file_nm AS "originalName", mime_type_tx AS "mimeType", size_bytes_ct AS "sizeBytes", purpose_cd AS "purpose"`,
                [collegeId, storageKey, cleanName(upload.originalname), type.mimeType, upload.size, checksum, purpose, lessonId, identity.id]);
            finalPath = null;
            log.info('File uploaded', { fileId: file.id, collegeId, purpose, sizeBytes: upload.size, userId: identity.id });
            return { id: file.id, originalName: file.originalName, mimeType: file.mimeType, sizeBytes: file.sizeBytes, purpose: file.purpose };
        }
        finally {
            await removeFile(upload.path);
            // Database insert failed after the move: do not leave an untracked file behind.
            if (finalPath)
                await removeFile(finalPath);
        }
    },
    // Returns the file when this user may open it. Unrelated files are reported as not found.
    async accessible(identity, collegeId, fileId, { download }) {
        const file = await db.one(`SELECT f.file_id AS "id", f.college_id AS "collegeId", f.storage_key_tx AS "storageKey", f.orgnl_file_nm AS
            "originalName", f.mime_type_tx AS "mimeType", f.size_bytes_ct AS "sizeBytes", f.checksum_tx AS
            "checksum", f.purpose_cd AS "purpose", f.lesson_id AS "lessonId", f.i_ts AS "createdAt", f.u_ts AS
            "updatedAt", f.crte_usr_id AS "createdBy", f.updte_usr_id AS "updatedBy", f.a_in AS
            "activeIndicator", f.d_ts AS "deletedAt" FROM file_upld_dtl_t f WHERE f.file_id = $1 AND f.a_in = 1`, [fileId]);
        if (!file)
            notFound('File');
        const ownCollege = file.collegeId === collegeId;
        // Admins (including a Super Admin working in this college) can open any file of the college.
        if (ownCollege && (identity.role === 'COLLEGE_ADMIN' || identity.role === 'SUPER_ADMIN'))
            return file;
        // A file belongs to a lesson as its main file, or as an image inside its formatted content.
        const ofLesson = q => file.lessonId ? `(l.file_id = ${q.add(fileId)} OR l.id = ${q.add(file.lessonId)})` : `l.file_id = ${q.add(fileId)}`;
        if (ownCollege && identity.role === 'TEACHER') {
            const q = params();
            const ownLesson = await db.one(
                `SELECT 1 FROM "Lesson" l JOIN "CourseModule" m ON m.id = l."moduleId" JOIN "Course" c ON c.id = m."courseId"
                 WHERE ${ofLesson(q)} AND l.a_in = 1 AND m.a_in = 1 AND c."collegeId" = ${q.add(collegeId)} AND c.a_in = 1 AND ${instructsSql(q, identity)}`, q.values);
            const p = params();
            const ownCourse = ownLesson || await db.one(
                `SELECT 1 FROM "Course" c WHERE c.syllabus_file_id = ${p.add(fileId)} AND c."collegeId" = ${p.add(collegeId)} AND c.a_in = 1 AND ${instructsSql(p, identity)}`, p.values);
            if (file.createdBy === identity.id || ownCourse)
                return file;
        }
        // Read-only access (students, teachers of other courses, other colleges for shared courses): the file must
        // belong to a published course this college can read — its own, or one shared with every college.
        const s = params();
        if (await db.one(`SELECT 1 FROM "Course" c WHERE c.syllabus_file_id = ${s.add(fileId)} AND ${readableCourseSql(s, collegeId)}`, s.values))
            return file;
        const r = params();
        const lesson = await db.one(
            `SELECT l.id, l."collegeId", l.title, l.lesson_type AS "lessonType", l.content, l.content_fmt_cd AS "contentFormat",
            l.file_id AS "fileId", l.duration_sec AS "durationSec", l.allow_download_in AS "allowDownload",
            l.published_in AS "published", l.prerequisite_lesson_id AS "prerequisiteLessonId", l.position,
            l."moduleId", l.i_ts AS "createdAt", l.u_ts AS "updatedAt", l.crte_usr_id AS "createdBy",
            l.updte_usr_id AS "updatedBy", l.a_in AS "activeIndicator", l.d_ts AS "deletedAt" FROM "Lesson" l JOIN "CourseModule" m ON m.id = l."moduleId" JOIN "Course" c ON c.id = m."courseId"
             WHERE ${ofLesson(r)} AND l.a_in = 1 AND l.published_in = 1 AND m.a_in = 1 AND ${readableCourseSql(r, collegeId)} LIMIT 1`, r.values);
        if (!lesson)
            notFound('File');
        if (identity.role === 'STUDENT')
            await assertPrerequisite(identity, lesson);
        // Content images are part of the page, not downloads.
        if (download && file.purpose !== 'IMAGE' && lesson.allowDownload !== 1)
            fail(403, 'Downloading is not allowed for this document');
        return file;
    },
};
