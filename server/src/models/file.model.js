import { randomUUID } from 'node:crypto';
import { db } from '../../config/db.config.js';
import { detectType, sha256, moveInto, resolveKey, removeFile } from '../services/file-storage.service.js';
import { assertPrerequisite, instructs, readableCourse } from './course.model.js';
import { fail, notFound } from '../utils/http-error.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('file.model');
const active = { activeIndicator: 1 };
// Keep printable characters only; path parts are already removed by multer.
const cleanName = (name) => name.replace(/[\u0000-\u001f\u007f"\\/<>]/g, '').trim().slice(0, 200) || 'file';

export const fileModel = {
    // Validates a temporary upload, moves it to colleges/<collegeId>/<yyyy>/<mm>/<id>.<ext> and records it.
    // options.lessonId marks an image that belongs to a lesson's formatted content.
    async store(identity, collegeId, purpose, upload, { lessonId = null } = {}) {
        let finalPath = null;
        try {
            const type = await detectType(upload.path);
            if (!type || type.purpose !== purpose)
                fail(415, purpose === 'VIDEO' ? 'Upload an MP4 or WebM video' : purpose === 'IMAGE' ? 'Upload a PNG or JPEG image' : 'Upload a PDF document');
            const checksum = await sha256(upload.path);
            const id = randomUUID();
            const now = new Date();
            const storageKey = `colleges/${collegeId}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${id}.${type.ext}`;
            await moveInto(upload.path, storageKey);
            finalPath = resolveKey(storageKey);
            const file = await db.fileUpload.create({ data: { id, collegeId, storageKey, originalName: cleanName(upload.originalname), mimeType: type.mimeType, sizeBytes: upload.size, checksum, purpose, lessonId, createdBy: identity.id } });
            finalPath = null;
            log.info('File uploaded', { fileId: id, collegeId, purpose, sizeBytes: upload.size, userId: identity.id });
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
        const file = await db.fileUpload.findFirst({ where: { id: fileId, ...active } });
        if (!file)
            notFound('File');
        const ownCollege = file.collegeId === collegeId;
        // Admins (including a Super Admin working in this college) can open any file of the college.
        if (ownCollege && (identity.role === 'COLLEGE_ADMIN' || identity.role === 'SUPER_ADMIN'))
            return file;
        // A file belongs to a lesson as its main file, or as an image inside its formatted content.
        const ofLesson = file.lessonId ? { OR: [{ fileId }, { id: file.lessonId }] } : { fileId };
        if (ownCollege && identity.role === 'TEACHER') {
            const ownCourse = await db.lesson.findFirst({ where: { ...ofLesson, ...active, module: { ...active, course: { collegeId, ...active, ...instructs(identity) } } } })
                || await db.course.findFirst({ where: { syllabusFileId: fileId, collegeId, ...active, ...instructs(identity) } });
            if (file.createdBy === identity.id || ownCourse)
                return file;
        }
        // Read-only access (students, teachers of other courses, other colleges for shared courses): the file must
        // belong to a published course this college can read — its own, or one shared with every college.
        if (await db.course.findFirst({ where: { syllabusFileId: fileId, ...readableCourse(collegeId) } }))
            return file;
        const lesson = await db.lesson.findFirst({ where: { ...ofLesson, ...active, published: 1, module: { ...active, course: readableCourse(collegeId) } } });
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
