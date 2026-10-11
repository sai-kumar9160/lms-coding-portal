import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import { createDatabaseClient } from '../config/db.config.js';
process.env.NODE_ENV = 'test';
const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lms-pdfimport-'));
process.env.UPLOAD_DIR = uploadDir;
const { app, db: appDb } = await import('./index.js');
const db = createDatabaseClient();

// A small two-chapter PDF: cover, chapter headings (20pt), sub-headings (14pt), body text and Courier code.
function samplePdf() {
    return new Promise(resolve => {
        const doc = new PDFDocument({ size: 'A4', margin: 60 });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk)).on('end', () => resolve(Buffer.concat(chunks)));
        doc.font('Helvetica-Bold').fontSize(28).text('Java Basics Notes');
        const chapter = (title, sub, code) => {
            doc.addPage().font('Helvetica-Bold').fontSize(20).text(title);
            doc.moveDown().font('Helvetica').fontSize(11).text('Java is a class-based language. Every program starts in a main method and runs on the JVM, so the same bytecode works everywhere.');
            doc.moveDown().font('Helvetica-Bold').fontSize(14).text(sub);
            doc.moveDown(0.5).font('Helvetica').fontSize(11).text('The example below prints a message to the console.');
            doc.moveDown(0.5).font('Courier').fontSize(10).text(code);
            doc.moveDown().font('Helvetica-Bold').fontSize(14).text('Summary');
            doc.font('Helvetica').fontSize(11).text('Compile with javac and run with java.');
        };
        chapter('1. Hello Java', 'Your first program', 'public class Hello {\n    public static void main(String[] args) {\n        System.out.println("Hi");\n    }\n}');
        chapter('2. Variables', 'Declaring variables', 'int count = 10;\nString name = "Ravi";');
        doc.end();
    });
}

test('create a course from an uploaded PDF', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const sessions = new Map();
    let collegeId;
    async function request(pathname, token = '', method = 'GET', body) {
        const auth = sessions.get(token);
        const response = await fetch(base + pathname, { method, headers: { 'Content-Type': 'application/json', 'x-access-token': token, Cookie: auth?.cookie ?? '', 'x-csrf-token': auth?.csrf ?? '' }, ...(body ? { body: JSON.stringify(body) } : {}) });
        const data = await response.json();
        if (data.token)
            sessions.set(data.token, { cookie: response.headers.get('set-cookie')?.split(';')[0], csrf: data.csrfToken });
        return { status: response.status, data };
    }
    async function fromPdf(token, buffer, fields, type = 'application/pdf') {
        const auth = sessions.get(token);
        const form = new FormData();
        for (const [key, value] of Object.entries(fields))
            form.append(key, value);
        form.append('file', new Blob([buffer], { type }), 'java-notes.pdf');
        const response = await fetch(`${base}/courses/from-pdf`, { method: 'POST', headers: { 'x-access-token': token, Cookie: auth.cookie, 'x-csrf-token': auth.csrf }, body: form });
        return { status: response.status, data: await response.json() };
    }
    async function login(email, college) { const r = await request('/auth/login', '', 'POST', { email, college, password: 'DemoPass123!' }); assert.equal(r.status, 200, `login ${email}`); return r.data.token; }
    try {
        const superToken = await login('super@lms.local');
        const slug = `pdfimp-${Date.now()}`;
        collegeId = (await request('/colleges', superToken, 'POST', { name: slug, slug, adminName: 'Import Admin', adminEmail: 'admin@pdfimp.local', adminPassword: 'DemoPass123!' })).data.id;
        const admin = await login('admin@pdfimp.local', slug);
        for (const [n, [name, role]] of [['teacher', 'TEACHER'], ['student', 'STUDENT']].entries())
            assert.equal((await request('/users', admin, 'POST', { name, email: `${name}@pdfimp.local`, mobileNo: `+9120000000${n}`, password: 'DemoPass123!', role })).status, 201);
        const teacher = await login('teacher@pdfimp.local', slug);
        const student = await login('student@pdfimp.local', slug);
        const pdf = await samplePdf();

        assert.equal((await fromPdf(student, pdf, { title: 'Not allowed' })).status, 403);
        assert.equal((await fromPdf(teacher, pdf, { title: 'X' })).status, 400, 'Title is validated');
        assert.equal((await fromPdf(teacher, Buffer.from('plain text, not a pdf'), { title: 'Fake PDF' }, 'application/pdf')).status, 415);

        const created = await fromPdf(teacher, pdf, { title: 'Java Basics', code: 'jv101', level: 'BEGINNER' });
        assert.equal(created.status, 201, JSON.stringify(created.data));
        assert.ok(created.data.lessons >= 2);
        const course = await db.course.findUniqueOrThrow({ where: { id: created.data.id }, include: { modules: { include: { lessons: { orderBy: { position: 'asc' } } } } } });
        assert.equal(course.status, 'DRAFT', 'Imported courses start as drafts');
        assert.equal(course.code, 'JV101');
        assert.ok(course.syllabusFileId, 'The whole PDF is linked to the course');
        const lessons = course.modules.flatMap(m => m.lessons);
        const hello = lessons.find(l => l.title === '1. Hello Java');
        assert.ok(hello, `Chapters become lessons: ${lessons.map(l => l.title).join(' | ')}`);
        assert.ok(lessons.some(l => l.title === '2. Variables'));
        assert.equal(hello.contentFormat, 'MARKDOWN');
        assert.match(hello.content, /## Your first program/, 'Sub-headings become headings');
        assert.match(hello.content, /```\npublic class Hello \{\n {4}public static void main/, `Code keeps its indentation:\n${hello.content}`);
        assert.match(hello.content, /class-based language/);
        assert.equal(hello.lessonType, 'DOCUMENT');
        assert.ok(hello.fileId, 'Each lesson has its chapter PDF');
        const teacherView = (await request('/courses', teacher)).data.find(c => c.id === course.id);
        assert.equal(teacherView.canEdit, true, 'The uploader owns the course');
        assert.ok(!(await request('/courses', student)).data.some(c => c.id === course.id), 'Drafts are hidden from students');
        assert.equal((await request(`/lessons/${hello.id}/content`, teacher)).data.content, hello.content);
        assert.equal((await fromPdf(teacher, pdf, { title: 'Java Again', code: 'JV101' })).status, 409, 'Course codes stay unique');

        // Rebuilding replaces the units and lessons from the linked PDF; only editors may do it.
        assert.equal((await request(`/courses/${course.id}/rebuild-from-pdf`, student, 'POST')).status, 403);
        const rebuilt = await request(`/courses/${course.id}/rebuild-from-pdf`, teacher, 'POST');
        assert.equal(rebuilt.status, 200, JSON.stringify(rebuilt.data));
        assert.equal(rebuilt.data.lessons, created.data.lessons);
        const modules = await db.courseModule.findMany({ where: { courseId: course.id }, include: { lessons: true } });
        assert.ok(modules.some(m => m.activeIndicator === 0) && modules.some(m => m.activeIndicator === 1), 'Old units are retired, new ones active');
        const activeTitles = modules.filter(m => m.activeIndicator === 1).flatMap(m => m.lessons.map(l => l.title));
        assert.ok(activeTitles.includes('1. Hello Java'));
        const logEntry = await db.auditLog.findFirst({ where: { collegeId, action: 'create_from_pdf' } });
        assert.equal(logEntry.entityId, course.id);
    }
    finally {
        const sids = [...sessions.keys()].map(token => jwt.decode(token)?.sid).filter(sid => typeof sid === 'string');
        await db.session.deleteMany({ where: { sid: { in: sids } } });
        if (collegeId) {
            await db.course.deleteMany({ where: { collegeId } });
            await db.fileUpload.deleteMany({ where: { collegeId } });
            await db.auditLog.deleteMany({ where: { collegeId } });
            await db.user.deleteMany({ where: { collegeId } });
            await db.college.deleteMany({ where: { id: collegeId } });
        }
        fs.rmSync(uploadDir, { recursive: true, force: true });
        await new Promise(resolve => server.close(() => resolve()));
        await db.$disconnect();
        await appDb.$disconnect();
    }
});
