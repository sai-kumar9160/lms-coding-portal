import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { createDatabaseClient } from '../config/db.config.js';
process.env.NODE_ENV = 'test';
// Uploads go to a throwaway folder; a 1 MB document limit lets the test hit the size check cheaply.
const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lms-uploads-'));
process.env.UPLOAD_DIR = uploadDir;
process.env.UPLOAD_MAX_DOCUMENT_MB = '1';
const { app, db: appDb } = await import('./index.js');
const db = createDatabaseClient();

const pdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(200, 7)]);

test('lesson uploads, protected media, prerequisites, progress, instructors and course status', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const sessions = new Map();
    const created = [];
    async function request(path, token = '', method = 'GET', body) {
        const auth = sessions.get(token);
        const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'x-access-token': token, Cookie: auth?.cookie ?? '', 'x-csrf-token': auth?.csrf ?? '' }, ...(body ? { body: JSON.stringify(body) } : {}) });
        const data = await response.json();
        if (data.token)
            sessions.set(data.token, { cookie: response.headers.get('set-cookie')?.split(';')[0], csrf: data.csrfToken });
        return { status: response.status, data };
    }
    async function upload(token, purpose, buffer, name, type) {
        const auth = sessions.get(token);
        const form = new FormData();
        form.append('file', new Blob([buffer], { type }), name);
        const response = await fetch(`${base}/files?purpose=${purpose}`, { method: 'POST', headers: { 'x-access-token': token, Cookie: auth.cookie, 'x-csrf-token': auth.csrf }, body: form });
        return { status: response.status, data: await response.json() };
    }
    // Media elements send only the cookie, so content requests use no access token.
    const media = (token, fileId, extra = {}, query = '') => fetch(`${base}/files/${fileId}/content${query}`, { headers: { Cookie: token ? sessions.get(token).cookie : '', ...extra } });
    // Only this test's college courses: courses shared by other colleges (for example PY101) also appear in /courses.
    const ownCourses = async (token, college) => (await request('/courses', token)).data.filter(c => c.collegeId === created[college]);
    async function login(email, college) { const r = await request('/auth/login', '', 'POST', { email, college, password: 'DemoPass123!' }); assert.equal(r.status, 200, `login ${email}`); return r.data.token; }
    try {
        const superToken = await login('super@lms.local');
        const suffix = Date.now();
        const slugs = [`media-a-${suffix}`, `media-b-${suffix}`];
        for (const slug of slugs) {
            const college = await request('/colleges', superToken, 'POST', { name: slug, slug, adminName: 'Media Admin', adminEmail: 'admin@media.local', adminPassword: 'DemoPass123!' });
            assert.equal(college.status, 201);
            created.push(college.data.id);
        }
        const adminA = await login('admin@media.local', slugs[0]);
        const adminB = await login('admin@media.local', slugs[1]);
        const people = [['teacher', 'TEACHER', 0], ['teacher2', 'TEACHER', 0], ['student', 'STUDENT', 0], ['student2', 'STUDENT', 0], ['student', 'STUDENT', 1]];
        for (const [n, [name, role, college]] of people.entries())
            assert.equal((await request('/users', college ? adminB : adminA, 'POST', { name, email: `${name}@media.local`, mobileNo: `+9160000000${n}`, password: 'DemoPass123!', role })).status, 201);
        const teacher = await login('teacher@media.local', slugs[0]);
        const teacher2 = await login('teacher2@media.local', slugs[0]);
        const student = await login('student@media.local', slugs[0]);
        const student2 = await login('student2@media.local', slugs[0]);
        const studentB = await login('student@media.local', slugs[1]);
        const users = (await request('/users', adminA)).data;
        const teacher2Id = users.find(u => u.email === 'teacher2@media.local').id;
        const studentId = users.find(u => u.email === 'student@media.local').id;

        // Uploads: type comes from file bytes; purpose, size and permission are enforced.
        const doc = await upload(teacher, 'DOCUMENT', pdf, 'Week 1 notes.pdf', 'application/pdf');
        assert.equal(doc.status, 201);
        assert.equal(doc.data.mimeType, 'application/pdf');
        assert.equal(doc.data.storageKey, undefined, 'Storage paths are never returned');
        const video = await upload(teacher, 'VIDEO', mp4, 'intro.mp4', 'video/mp4');
        assert.equal(video.status, 201);
        assert.equal((await upload(teacher, 'DOCUMENT', Buffer.from('not really a pdf'), 'fake.pdf', 'application/pdf')).status, 415);
        assert.equal((await upload(teacher, 'VIDEO', pdf, 'notes.mp4', 'video/mp4')).status, 415, 'A PDF cannot be uploaded as a video');
        assert.equal((await upload(teacher, 'DOCUMENT', Buffer.concat([pdf, Buffer.alloc(1100000)]), 'big.pdf', 'application/pdf')).status, 413);
        assert.equal((await upload(student, 'DOCUMENT', pdf, 'x.pdf', 'application/pdf')).status, 403);
        const stored = await db.fileUpload.findUniqueOrThrow({ where: { id: doc.data.id } });
        assert.ok(stored.storageKey.startsWith(`colleges/${created[0]}/`));
        assert.ok(fs.existsSync(path.join(uploadDir, stored.storageKey)));
        assert.equal(stored.checksum.length, 64);
        assert.deepEqual(fs.readdirSync(path.join(uploadDir, 'tmp')), [], 'Temporary uploads are removed');
        const fileB = await upload(adminB, 'DOCUMENT', pdf, 'other.pdf', 'application/pdf');
        assert.equal(fileB.status, 201);

        // Course with a PDF lesson, a video that requires it, and an unpublished text lesson.
        const course = await request('/courses', teacher, 'POST', { title: 'Media course', description: 'Videos and documents', moduleTitle: 'Week 1', lessonTitle: 'Welcome', content: 'Welcome to the media course.' });
        assert.equal(course.status, 201);
        const coursePath = `/courses/${course.data.id}`;
        const moduleId = (await db.courseModule.findFirstOrThrow({ where: { courseId: course.data.id } })).id;
        const lessonsPath = `${coursePath}/modules/${moduleId}/lessons`;
        assert.equal((await request(lessonsPath, teacher, 'POST', { title: 'Wrong file', lessonType: 'VIDEO', fileId: doc.data.id })).status, 400, 'Video lessons need a video file');
        assert.equal((await request(lessonsPath, teacher, 'POST', { title: 'Other college', lessonType: 'DOCUMENT', fileId: fileB.data.id })).status, 400, 'Files from another college cannot be attached');
        assert.equal((await request(lessonsPath, teacher, 'POST', { title: 'No file', lessonType: 'DOCUMENT' })).status, 400);
        const docLesson = await request(lessonsPath, teacher, 'POST', { title: 'Reading', lessonType: 'DOCUMENT', fileId: doc.data.id, allowDownload: false });
        assert.equal(docLesson.status, 201);
        const videoLesson = await request(lessonsPath, teacher, 'POST', { title: 'Lecture', lessonType: 'VIDEO', fileId: video.data.id, durationSec: 60, prerequisiteLessonId: docLesson.data.id });
        assert.equal(videoLesson.status, 201);
        const hidden = await request(lessonsPath, teacher, 'POST', { title: 'Draft notes', content: 'Not ready for students yet.', published: false });
        assert.equal(hidden.status, 201);
        assert.equal((await request(`${lessonsPath}/${docLesson.data.id}`, teacher, 'PATCH', { title: 'Reading', lessonType: 'DOCUMENT', fileId: doc.data.id, prerequisiteLessonId: videoLesson.data.id })).status, 400, 'Prerequisite loops are rejected');
        assert.equal((await request(`${lessonsPath}/${docLesson.data.id}`, teacher, 'PATCH', { title: 'Reading', lessonType: 'DOCUMENT', fileId: doc.data.id, prerequisiteLessonId: docLesson.data.id })).status, 400);

        // Co-instructors: only the owner (or a College Admin) manages them; only active teachers qualify.
        assert.equal((await request(coursePath, teacher2, 'PATCH', { title: 'Hijacked title' })).status, 404);
        assert.equal((await request(`${coursePath}/instructors`, teacher, 'POST', { userId: studentId })).status, 400);
        assert.equal((await request(`${coursePath}/instructors`, teacher, 'POST', { userId: teacher2Id })).status, 201);
        assert.equal((await request(coursePath, teacher2, 'PATCH', { title: 'Media course, updated' })).status, 200);
        assert.equal((await media(teacher2, doc.data.id)).status, 200, 'Co-instructors can open course files');
        assert.equal((await request(`${coursePath}/instructors`, teacher2, 'POST', { userId: teacher2Id })).status, 403, 'Co-instructors cannot manage instructors');
        const ownerId = (await request('/me', teacher)).data.user.id;
        assert.equal((await request(`${coursePath}/instructors/${ownerId}`, adminA, 'DELETE')).status, 400, 'The owner cannot be removed');
        assert.equal((await request(`${coursePath}/instructors/${teacher2Id}`, teacher, 'DELETE')).status, 200);
        assert.equal((await request(coursePath, teacher2, 'PATCH', { title: 'Removed teacher edit' })).status, 404);
        assert.equal((await media(teacher2, doc.data.id)).status, 404, 'Removed instructors lose file access');

        // Course status: drafts and archived courses are hidden from students.
        assert.equal((await ownCourses(student, 0)).length, 0);
        assert.equal((await media(student, doc.data.id)).status, 404, 'Files of draft courses are hidden');
        assert.equal((await request(coursePath, teacher, 'PATCH', { status: 'PUBLISHED' })).status, 200);
        assert.equal((await request(coursePath, teacher, 'PATCH', { status: 'LIVE' })).status, 400);
        const visible = (await ownCourses(student, 0))[0];
        assert.deepEqual(visible.modules[0].lessons.map(l => l.title), ['Welcome', 'Reading', 'Lecture'], 'Unpublished lessons are hidden from students');
        assert.equal(visible.modules[0].lessons[1].file.mimeType, 'application/pdf');

        // No enrollment step: any student of the college opens published lessons. Media still needs the same college,
        // the prerequisite, and download permission.
        const pdfResponse = await media(student, doc.data.id);
        assert.equal(pdfResponse.status, 200);
        assert.equal(pdfResponse.headers.get('content-type'), 'application/pdf');
        assert.match(pdfResponse.headers.get('content-disposition'), /^inline; filename="Week 1 notes.pdf"/);
        assert.equal(pdfResponse.headers.get('x-content-type-options'), 'nosniff');
        assert.deepEqual(Buffer.from(await pdfResponse.arrayBuffer()), pdf);
        assert.equal((await media('', doc.data.id)).status, 401, 'No session cookie, no file');
        assert.equal((await media(student, doc.data.id, {}, '?download=1')).status, 403, 'Download not allowed for this lesson');
        assert.equal((await media(student2, doc.data.id)).status, 200, 'Every student of the college can open it');
        assert.equal(await db.enrollment.count({ where: { courseId: course.data.id } }), 0, 'Opening content creates no progress record');
        assert.equal((await media(studentB, doc.data.id)).status, 404, 'Other colleges cannot open the file');
        assert.equal((await media(adminB, doc.data.id)).status, 404);
        assert.equal((await media(adminA, video.data.id)).status, 200);
        assert.equal((await media(student, video.data.id)).status, 409, 'Video is locked until the reading is complete');
        assert.equal((await request(`/lessons/${videoLesson.data.id}/complete`, student, 'POST')).status, 409);
        assert.equal((await request(`/lessons/${videoLesson.data.id}/progress`, student, 'POST', { positionSec: 5, spentSec: 5 })).status, 409);
        assert.equal((await request(`/lessons/${hidden.data.id}/complete`, student, 'POST')).status, 404, 'Unpublished lessons cannot be completed');

        // Progress percentage follows completions of published lessons.
        const welcomeId = visible.modules[0].lessons[0].id;
        assert.equal((await request(`/lessons/${welcomeId}/complete`, student, 'POST')).status, 200);
        assert.equal((await request(`/lessons/${docLesson.data.id}/complete`, student, 'POST')).status, 200);
        const enrollment = () => db.enrollment.findFirstOrThrow({ where: { courseId: course.data.id, userId: studentId } });
        assert.equal((await enrollment()).progressPct, 66);
        const range = await media(student, video.data.id, { Range: 'bytes=0-9' });
        assert.equal(range.status, 206, 'Videos support range requests for seeking');
        assert.equal(range.headers.get('content-range'), `bytes 0-9/${mp4.length}`);
        assert.equal((await range.arrayBuffer()).byteLength, 10);
        const saved = await request(`/lessons/${videoLesson.data.id}/progress`, student, 'POST', { positionSec: 20, spentSec: 30 });
        assert.equal(saved.status, 200);
        assert.equal((await request(`/lessons/${videoLesson.data.id}/progress`, student, 'POST', { positionSec: 500, spentSec: 30 })).data.lastPositionSec, 60, 'Position is capped at the video duration');
        assert.equal((await request(`/lessons/${videoLesson.data.id}/progress`, student, 'POST', { positionSec: 5, spentSec: 500 })).status, 400, 'Watch time per save is limited');
        const watched = await db.lessonProgress.findFirstOrThrow({ where: { lessonId: videoLesson.data.id, userId: studentId } });
        assert.equal(watched.timeSpentSec, 60);
        assert.equal(watched.completedAt, null, 'Watching does not complete the lesson');
        assert.equal((await request(`/lessons/${videoLesson.data.id}/complete`, student, 'POST')).status, 200);
        assert.equal((await enrollment()).progressPct, 100);
        assert.ok((await enrollment()).completedAt);
        const listed = (await ownCourses(student, 0))[0];
        assert.equal(listed.enrollments[0].progressPct, 100);
        assert.equal(listed.modules[0].lessons[2].progress[0].lastPositionSec, 60);

        // Publishing another lesson lowers the percentage and reopens the course.
        assert.equal((await request(`${lessonsPath}/${hidden.data.id}`, teacher, 'PATCH', { title: 'Draft notes', content: 'Now ready for students.', published: true })).status, 200);
        assert.equal((await enrollment()).progressPct, 75);
        assert.equal((await enrollment()).completedAt, null);
        assert.equal((await request(`${coursePath}/modules/${moduleId}/lessons/${hidden.data.id}`, teacher, 'DELETE')).status, 200);
        assert.equal((await enrollment()).progressPct, 100, 'Deleting a lesson recalculates progress');

        // Syllabus details, the linked syllabus PDF, and the generated syllabus PDF.
        const syllabusPdf = await upload(teacher, 'DOCUMENT', pdf, 'Media syllabus.pdf', 'application/pdf');
        assert.equal((await request(coursePath, teacher, 'PATCH', { code: 'med-101', level: 'BEGINNER', durationHours: 20, objectives: 'Watch videos\nRead PDFs', outcomes: 'Use media lessons', syllabusFileId: syllabusPdf.data.id })).status, 200);
        assert.equal((await db.course.findUniqueOrThrow({ where: { id: course.data.id } })).code, 'MED-101', 'Codes are upper-cased');
        assert.equal((await request(coursePath, teacher, 'PATCH', { syllabusFileId: video.data.id })).status, 400, 'The syllabus must be a PDF');
        assert.equal((await request(coursePath, teacher, 'PATCH', { syllabusFileId: fileB.data.id })).status, 400, 'The syllabus must belong to this college');
        assert.equal((await request('/courses', teacher, 'POST', { title: 'Second course', description: 'Same code again', moduleTitle: 'M1', lessonTitle: 'L1', content: 'Duplicate code test.', code: 'MED-101' })).status, 409, 'Course codes are unique in a college');
        const listedSyllabus = (await ownCourses(student2, 0))[0];
        assert.equal(listedSyllabus.syllabusFile.originalName, 'Media syllabus.pdf');
        assert.equal(listedSyllabus.level, 'BEGINNER');
        assert.equal((await media(student2, syllabusPdf.data.id)).status, 200, 'Students can open the syllabus PDF of a published course');
        assert.equal((await media(student2, syllabusPdf.data.id, {}, '?download=1')).status, 200, 'and download it');
        assert.equal((await media(studentB, syllabusPdf.data.id)).status, 404);
        const generated = await fetch(`${base}${coursePath}/syllabus/pdf`, { headers: { 'x-access-token': student2, Cookie: sessions.get(student2).cookie } });
        assert.equal(generated.status, 200);
        assert.equal(generated.headers.get('content-type'), 'application/pdf');
        assert.match(generated.headers.get('content-disposition'), /attachment; filename="MED-101-syllabus\.pdf"/);
        assert.equal(Buffer.from(await generated.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
        assert.equal((await fetch(`${base}${coursePath}/syllabus/pdf`, { headers: { 'x-access-token': studentB, Cookie: sessions.get(studentB).cookie } })).status, 404, 'Other colleges cannot download it');

        // Archived courses disappear for students, including their files.
        assert.equal((await request(coursePath, teacher, 'PATCH', { status: 'ARCHIVED' })).status, 200);
        assert.equal((await ownCourses(student, 0)).length, 0);
        assert.equal((await media(student, doc.data.id)).status, 404);
    }
    finally {
        const sids = [...sessions.keys()].map(token => jwt.decode(token)?.sid).filter(sid => typeof sid === 'string');
        await db.session.deleteMany({ where: { sid: { in: sids } } });
        await db.lessonProgress.deleteMany({ where: { collegeId: { in: created } } });
        await db.enrollment.deleteMany({ where: { collegeId: { in: created } } });
        await db.course.deleteMany({ where: { collegeId: { in: created } } });
        await db.fileUpload.deleteMany({ where: { collegeId: { in: created } } });
        await db.user.deleteMany({ where: { collegeId: { in: created } } });
        await db.auditLog.deleteMany({ where: { collegeId: { in: created } } });
        await db.college.deleteMany({ where: { id: { in: created } } });
        fs.rmSync(uploadDir, { recursive: true, force: true });
        await new Promise(resolve => server.close(() => resolve()));
        await db.$disconnect();
        await appDb.$disconnect();
    }
});
