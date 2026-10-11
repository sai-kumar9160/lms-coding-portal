import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { createDatabaseClient } from '../config/db.config.js';
process.env.NODE_ENV = 'test';
const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lms-share-'));
process.env.UPLOAD_DIR = uploadDir;
const { app, db: appDb } = await import('./index.js');
const db = createDatabaseClient();
const pdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

test('courses shared with all colleges and read-only access for teachers', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const sessions = new Map();
    const created = [];
    async function request(path, token = '', method = 'GET', body) {
        const auth = sessions.get(token);
        const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'x-access-token': token, Cookie: auth?.cookie ?? '', 'x-csrf-token': auth?.csrf ?? '' }, ...(body ? { body: JSON.stringify(body) } : {}) });
        const data = await response.json().catch(() => null);
        if (data?.token)
            sessions.set(data.token, { cookie: response.headers.get('set-cookie')?.split(';')[0], csrf: data.csrfToken });
        return { status: response.status, data };
    }
    async function upload(token, buffer, name) {
        const auth = sessions.get(token);
        const form = new FormData();
        form.append('file', new Blob([buffer], { type: 'application/pdf' }), name);
        return (await fetch(`${base}/files?purpose=DOCUMENT`, { method: 'POST', headers: { 'x-access-token': token, Cookie: auth.cookie, 'x-csrf-token': auth.csrf }, body: form })).json();
    }
    const media = (token, fileId, query = '') => fetch(`${base}/files/${fileId}/content${query}`, { headers: { Cookie: sessions.get(token).cookie } });
    async function login(email, college) { const r = await request('/auth/login', '', 'POST', { email, college, password: 'DemoPass123!' }); assert.equal(r.status, 200, `login ${email}`); return r.data.token; }
    try {
        const superToken = await login('super@lms.local');
        const slugs = [`share-a-${Date.now()}`, `share-b-${Date.now()}`];
        for (const slug of slugs)
            created.push((await request('/colleges', superToken, 'POST', { name: slug, slug, adminName: 'Share Admin', adminEmail: 'admin@share.local', adminPassword: 'DemoPass123!' })).data.id);
        const adminA = await login('admin@share.local', slugs[0]);
        const adminB = await login('admin@share.local', slugs[1]);
        for (const [n, [token, name, role]] of [[adminA, 'teacher', 'TEACHER'], [adminA, 'teacher2', 'TEACHER'], [adminB, 'teacher', 'TEACHER'], [adminB, 'student', 'STUDENT']].entries())
            assert.equal((await request('/users', token, 'POST', { name, email: `${name}@share.local`, mobileNo: `+9130000000${n}`, password: 'DemoPass123!', role })).status, 201);
        const teacherA = await login('teacher@share.local', slugs[0]);
        const teacher2A = await login('teacher2@share.local', slugs[0]);
        const teacherB = await login('teacher@share.local', slugs[1]);
        const studentB = await login('student@share.local', slugs[1]);
        const inCollege = (list, index) => list.filter(c => c.collegeId === created[index]);

        // College A: a course with a visible lesson, a hidden lesson, a PDF lesson and a syllabus PDF.
        const course = (await request('/courses', teacherA, 'POST', { title: 'Shared Python', description: 'Visible to every college', moduleTitle: 'Unit 1', lessonTitle: 'Hello', content: 'Print hello world.', code: 'SPY1' })).data;
        const moduleId = (await db.courseModule.findFirstOrThrow({ where: { courseId: course.id } })).id;
        const lessonsPath = `/courses/${course.id}/modules/${moduleId}/lessons`;
        const notes = await upload(teacherA, pdf, 'notes.pdf');
        const pdfLesson = (await request(lessonsPath, teacherA, 'POST', { title: 'Reading', lessonType: 'DOCUMENT', fileId: notes.id, allowDownload: false })).data;
        await request(lessonsPath, teacherA, 'POST', { title: 'Hidden draft', content: 'Not for students yet.', published: false });
        const syllabus = await upload(teacherA, pdf, 'syllabus.pdf');
        assert.equal((await request(`/courses/${course.id}`, teacherA, 'PATCH', { status: 'PUBLISHED', syllabusFileId: syllabus.id })).status, 200);

        // Teachers of the same college see published courses read-only; only admins share.
        const readOnly = inCollege((await request('/courses', teacher2A)).data, 0).find(c => c.id === course.id);
        assert.equal(readOnly.canEdit, false);
        assert.deepEqual(readOnly.modules[0].lessons.map(l => l.title), ['Hello', 'Reading'], 'Read-only viewers do not see hidden lessons');
        assert.equal((await request(`/courses/${course.id}`, teacher2A, 'PATCH', { title: 'Changed by another teacher' })).status, 404);
        assert.equal(inCollege((await request('/courses', teacherA)).data, 0).find(c => c.id === course.id).canEdit, true);
        assert.equal((await request(`/courses/${course.id}`, teacherA, 'PATCH', { shared: true })).status, 403, 'Teachers cannot share with all colleges');

        // Not shared yet: college B sees nothing.
        assert.ok(!(await request('/courses', studentB)).data.some(c => c.id === course.id));
        assert.equal((await media(studentB, syllabus.id)).status, 404);

        assert.equal((await request(`/courses/${course.id}`, adminA, 'PATCH', { shared: true })).status, 200);
        const seenByB = (await request('/courses', studentB)).data.find(c => c.id === course.id);
        assert.ok(seenByB, 'Students of other colleges see shared published courses');
        assert.equal(seenByB.canEdit, false);
        assert.equal(seenByB.college.id, created[0]);
        assert.deepEqual(seenByB.modules[0].lessons.map(l => l.title), ['Hello', 'Reading']);
        assert.equal((await request('/courses', teacherB)).data.find(c => c.id === course.id).canEdit, false, 'Teachers of other colleges read it');
        assert.equal((await request(`/courses/${course.id}`, adminB, 'PATCH', { title: 'Hijack' })).status, 404, 'Other colleges cannot edit');
        assert.equal((await request(`${lessonsPath}`, adminB, 'POST', { title: 'Intruder', content: 'Should not be added.' })).status, 404);

        // Files and the syllabus PDF open across colleges; download rules still apply.
        assert.equal((await media(studentB, syllabus.id)).status, 200);
        assert.equal((await media(studentB, notes.id)).status, 200);
        assert.equal((await media(studentB, notes.id, '?download=1')).status, 403);
        assert.equal((await media(teacherB, notes.id)).status, 200);
        const generated = await fetch(`${base}/courses/${course.id}/syllabus/pdf`, { headers: { 'x-access-token': studentB, Cookie: sessions.get(studentB).cookie } });
        assert.equal(generated.status, 200);
        assert.equal(Buffer.from(await generated.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');

        // Formatted chapter content: kept out of lists, served per lesson, with its images readable wherever the lesson is.
        const { fileModel } = await import('./models/file.model.js');
        const { tmpDir } = await import('./services/file-storage.service.js');
        const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
        const pngPath = path.join(tmpDir, `test-${Date.now()}.png`);
        fs.writeFileSync(pngPath, png);
        const firstLesson = seenByB.modules[0].lessons[0];
        const image = await fileModel.store({ id: 'test' }, created[0], 'IMAGE', { path: pngPath, originalname: 'figure.png', size: png.length }, { lessonId: firstLesson.id });
        const markdown = `## Heading\n\n![Figure](file:${image.id})\n\n\`\`\`python\nprint("hi")\n\`\`\``;
        await db.lesson.update({ where: { id: firstLesson.id }, data: { content: markdown, contentFormat: 'MARKDOWN' } });
        const listed = (await request('/courses', studentB)).data.find(c => c.id === course.id).modules[0].lessons[0];
        assert.equal(listed.content, '', 'Lists leave formatted chapters out');
        assert.equal(listed.hasArticle, true);
        const article = await request(`/lessons/${firstLesson.id}/content`, studentB);
        assert.equal(article.status, 200);
        assert.equal(article.data.contentFormat, 'MARKDOWN');
        assert.equal(article.data.content, markdown);
        assert.equal((await media(studentB, image.id)).status, 200, 'Lesson images open across colleges for shared courses');
        assert.equal((await media(studentB, image.id, '?download=1')).status, 200);
        const hiddenLesson = await db.lesson.findFirstOrThrow({ where: { title: 'Hidden draft', module: { courseId: course.id } } });
        assert.equal((await request(`/lessons/${hiddenLesson.id}/content`, studentB)).status, 404, 'Hidden lessons stay hidden');
        assert.equal((await request(`/lessons/${hiddenLesson.id}/content`, teacherA)).status, 200, 'Editors can read hidden lessons');

        // Progress of a college B student is recorded under college B.
        assert.equal((await request(`/lessons/${seenByB.modules[0].lessons[0].id}/complete`, studentB, 'POST')).status, 200);
        assert.equal((await request(`/lessons/${pdfLesson.id}/complete`, studentB, 'POST')).status, 200);
        const enrollment = await db.enrollment.findFirstOrThrow({ where: { courseId: course.id, user: { email: 'student@share.local', collegeId: created[1] } } });
        assert.equal(enrollment.collegeId, created[1]);
        assert.equal(enrollment.progressPct, 100, 'Hidden lessons do not count');

        // Unsharing or unpublishing hides it from other colleges again.
        assert.equal((await request(`/courses/${course.id}`, adminA, 'PATCH', { shared: false })).status, 200);
        assert.ok(!(await request('/courses', studentB)).data.some(c => c.id === course.id));
        assert.equal((await media(studentB, notes.id)).status, 404);
        await request(`/courses/${course.id}`, adminA, 'PATCH', { shared: true, status: 'DRAFT' });
        assert.ok(!(await request('/courses', teacherB)).data.some(c => c.id === course.id), 'Shared drafts stay private');
    }
    finally {
        const sids = [...sessions.keys()].map(token => jwt.decode(token)?.sid).filter(sid => typeof sid === 'string');
        await db.session.deleteMany({ where: { sid: { in: sids } } });
        await db.lessonProgress.deleteMany({ where: { collegeId: { in: created } } });
        await db.enrollment.deleteMany({ where: { collegeId: { in: created } } });
        await db.course.deleteMany({ where: { collegeId: { in: created } } });
        await db.fileUpload.deleteMany({ where: { collegeId: { in: created } } });
        await db.auditLog.deleteMany({ where: { collegeId: { in: created } } });
        await db.user.deleteMany({ where: { collegeId: { in: created } } });
        await db.college.deleteMany({ where: { id: { in: created } } });
        fs.rmSync(uploadDir, { recursive: true, force: true });
        await new Promise(resolve => server.close(() => resolve()));
        await db.$disconnect();
        await appDb.$disconnect();
    }
});
