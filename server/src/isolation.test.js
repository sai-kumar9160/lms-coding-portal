import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { createDatabaseClient } from '../config/db.config.js';
process.env.NODE_ENV = 'test';
const { app, db: appDb } = await import('./index.js');
const db = createDatabaseClient();
test('college isolation, permissions and complete learning workflow', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const address = server.address();
    const base = `http://127.0.0.1:${address.port}/api`;
    const created = [];
    const roleRows = await db.roleMaster.findMany({ orderBy: { id: 'asc' } });
    assert.deepEqual(roleRows.map(role => role.code), ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER', 'STUDENT']);
    assert.ok(roleRows.every(role => role.activeIndicator === 1));
    const credentials = new Map();
    async function request(path, token = '', method = 'GET', body, host, override = {}) {
        const auth = credentials.get(token);
        const headers = { 'Content-Type': 'application/json', 'x-access-token': token, Cookie: override.cookie ?? auth?.cookie ?? '', 'x-csrf-token': override.csrf ?? auth?.csrf ?? '', ...(override.origin ? { Origin: override.origin } : {}) };
        if (host)
            return await new Promise((resolve, reject) => {
                const req = http.request(base + path, { method, headers: { ...headers, Host: host } }, res => {
                    let text = '';
                    res.on('data', chunk => { text += chunk; });
                    res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(text) }));
                });
                req.on('error', reject);
                req.end();
            });
        const response = await fetch(base + path, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
        const data = await response.json();
        if (data.token) {
            const cookie = response.headers.get('set-cookie')?.split(';')[0] || auth?.cookie || '';
            credentials.set(data.token, { cookie, csrf: data.csrfToken });
        }
        return { status: response.status, data, cookie: response.headers.get('set-cookie') };
    }
    // Only this test's college courses: courses shared by other colleges (for example PY101) also appear in /courses.
    const ownCourses = async (token, college) => (await request('/courses', token)).data.filter(c => c.collegeId === created[college]);
    async function login(email, college) { const r = await request('/auth/login', '', 'POST', { email, college, password: 'DemoPass123!' }); assert.equal(r.status, 200); return r.data.token; }
    try {
        assert.equal((await request('/courses')).status, 401);
        const superToken = await login('super@lms.local');
        const suffix = Date.now();
        const slugs = [`test-a-${suffix}`, `test-b-${suffix}`];
        for (const slug of slugs) {
            const result = await request('/colleges', superToken, 'POST', { name: slug, slug, adminName: 'Test Admin', adminEmail: 'admin@test.local', adminPassword: 'DemoPass123!' });
            assert.equal(result.status, 201);
            created.push(result.data.id);
        }
        const adminA = await login('admin@test.local', slugs[0]);
        const adminB = await login('admin@test.local', slugs[1]);
        for (const token of [adminA, adminB])
            for (const role of ['TEACHER', 'STUDENT']) {
                assert.equal((await request('/users', token, 'POST', { name: `Test ${role}`, email: `${role.toLowerCase()}@test.local`, mobileNo: role === 'TEACHER' ? '+919000000001' : '+919000000002', password: 'DemoPass123!', role })).status, 201);
            }
        const teacher = await login('teacher@test.local', slugs[0]);
        const studentA = await login('student@test.local', slugs[0]);
        const studentB = await login('student@test.local', slugs[1]);
        let registeredStudentId;
        for (const role of ['STUDENT', 'TEACHER']) {
            const registration = { college: slugs[0], role, name: `Registered ${role}`, email: `registered-${role.toLowerCase()}@test.local`, mobileNo: role === 'TEACHER' ? '+918000000001' : '+918000000002', password: 'DemoPass123!' };
            const registered = await request('/auth/register', '', 'POST', registration);
            assert.equal(registered.status, 201);
            assert.equal(registered.data.token, undefined, 'Registration must not automatically log in');
            assert.equal(registered.data.user.mobileNo, registration.mobileNo);
            assert.equal(registered.data.user.password, undefined);
            const registeredUser = await db.user.findUniqueOrThrow({ where: { id: registered.data.user.id } });
            assert.notEqual(registeredUser.password, registration.password);
            assert.equal(registeredUser.createdBy, registeredUser.id);
            assert.equal(registeredUser.roleId, role === 'TEACHER' ? 3 : 4);
            assert.equal(registeredUser.status, role === 'TEACHER' ? 'PENDING' : 'ACTIVE');
            if (role === 'STUDENT')
                registeredStudentId = registeredUser.id;
            if (role === 'TEACHER') {
                const teacherLogin = { email: registration.email, college: slugs[0], password: 'DemoPass123!' };
                assert.equal((await request('/auth/login', '', 'POST', teacherLogin)).status, 403, 'Pending teachers cannot sign in');
                assert.equal((await request('/auth/login', '', 'POST', { ...teacherLogin, password: 'WrongPass123!' })).status, 401, 'Status is not revealed without the password');
                assert.ok(!(await request('/users', teacher)).data.some(u => u.id === registeredUser.id), 'Teachers do not see pending accounts');
                assert.equal((await request('/users', adminA)).data.find(u => u.id === registeredUser.id).status, 'PENDING');
                assert.equal((await request(`/users/${registeredUser.id}/approve`, teacher, 'POST')).status, 403);
                assert.equal((await request(`/users/${registeredUser.id}/approve`, adminB, 'POST')).status, 404, 'Other colleges cannot approve');
                assert.equal((await request(`/users/${registeredUser.id}/approve`, adminA, 'POST')).status, 200);
                assert.equal((await request(`/users/${registeredUser.id}/approve`, adminA, 'POST')).status, 404, 'Only pending users can be approved');
                const approved = await db.user.findUniqueOrThrow({ where: { id: registeredUser.id } });
                assert.equal(approved.status, 'ACTIVE');
                assert.ok(approved.updatedBy);
            }
            const registeredToken = await login(registration.email, slugs[0]);
            assert.equal((await request('/me', registeredToken)).data.user.role, role);
            assert.equal((await request('/auth/register', '', 'POST', registration)).status, 409);
            assert.equal((await request('/auth/register', '', 'POST', { ...registration, email: `duplicate-mobile-${role}@test.local` })).status, 409);
            assert.equal((await request('/auth/register', '', 'POST', { ...registration, mobileNo: 'bad' })).status, 400);
            assert.equal((await request('/auth/register', '', 'POST', { ...registration, role: 'SUPER_ADMIN' })).status, 400);
            assert.equal((await request('/auth/register', '', 'POST', { ...registration, role: 'COLLEGE_ADMIN' })).status, 400);
        }
        assert.equal((await request('/courses', studentA, 'GET', undefined, undefined, { cookie: '' })).status, 401, 'JWT alone must not authenticate');
        assert.equal((await request('/courses', studentA, 'GET', undefined, undefined, { cookie: credentials.get(studentB).cookie })).status, 401, 'Cookie and JWT must belong to the same session');
        assert.equal((await request('/auth/refresh', studentA, 'POST', {}, undefined, { csrf: '' })).status, 403);
        assert.equal((await request('/auth/refresh', studentA, 'POST', {}, undefined, { origin: 'https://untrusted.example' })).status, 403);
        assert.equal((await request('/auth/session', studentA)).data.token, studentA);
        const claims = jwt.decode(studentA);
        const tampered = studentA.slice(0, -8) + 'invalid!';
        credentials.set(tampered, credentials.get(studentA));
        assert.equal((await request('/courses', tampered)).status, 401);
        const expired = jwt.sign({ ...claims, exp: Math.floor(Date.now() / 1000) - 30 }, process.env.JWT_SECRET, { algorithm: 'HS256' });
        credentials.set(expired, credentials.get(studentA));
        assert.equal((await request('/courses', expired)).status, 401, 'Expired JWTs are rejected');
        assert.equal((await request('/users', studentA)).status, 403);
        assert.equal((await request('/users', adminA, 'POST', { name: 'Escalation', email: 'bad@test.local', password: 'DemoPass123!', role: 'SUPER_ADMIN' })).status, 400);
        const course = await request('/courses', teacher, 'POST', { title: 'Test JavaScript', description: 'Test course description', moduleTitle: 'Introduction', lessonTitle: 'Hello world', content: 'Run console.log("Hello world");' });
        assert.equal(course.status, 201);
        const teacherId = (await request('/me', teacher)).data.user.id;
        const insertedCourse = await db.course.findUniqueOrThrow({ where: { id: course.data.id } });
        assert.equal(insertedCourse.createdBy, teacherId);
        assert.equal(insertedCourse.activeIndicator, 1);
        assert.equal(insertedCourse.updatedAt, null, 'u_ts stays null until the first update');
        assert.equal((await ownCourses(studentA, 0)).length, 0);
        assert.equal((await request(`/courses/${course.data.id}`, teacher, 'PATCH', { status: 'PUBLISHED' })).status, 200);
        const publishedCourse = await db.course.findUniqueOrThrow({ where: { id: course.data.id } });
        assert.equal(publishedCourse.updatedBy, teacherId);
        assert.ok(publishedCourse.updatedAt);
        assert.equal(publishedCourse.createdAt.getTime(), insertedCourse.createdAt.getTime());
        assert.equal(publishedCourse.createdBy, teacherId);
        const coursePath = `/courses/${course.data.id}`;
        const newModule = await request(`${coursePath}/modules`, teacher, 'POST', { title: 'Functions' });
        assert.equal(newModule.status, 201);
        assert.equal(newModule.data.position, 1);
        assert.equal(newModule.data.createdBy, teacherId);
        const modulePath = `${coursePath}/modules/${newModule.data.id}`;
        const newLesson = await request(`${modulePath}/lessons`, teacher, 'POST', { title: 'Your first function', content: 'Define a function and call it with an argument.' });
        assert.equal(newLesson.status, 201);
        assert.equal(newLesson.data.createdBy, teacherId);
        const lessonPath = `${modulePath}/lessons/${newLesson.data.id}`;
        assert.equal((await request(coursePath, teacher, 'PATCH', { title: 'Updated JavaScript course', description: 'Updated course description' })).status, 200);
        assert.equal((await request(modulePath, teacher, 'PATCH', { title: 'Working with functions', position: 1 })).status, 200);
        assert.equal((await request(lessonPath, teacher, 'PATCH', { title: 'Function arguments', content: 'Pass arguments to a function and return a result.', position: 0 })).status, 200);
        const editedLesson = await db.lesson.findUniqueOrThrow({ where: { id: newLesson.data.id } });
        assert.equal(editedLesson.updatedBy, teacherId);
        assert.ok(editedLesson.updatedAt);
        assert.equal((await request(`${coursePath}/modules`, studentA, 'POST', { title: 'Unauthorized' })).status, 403);
        assert.equal((await request(`${coursePath}/modules`, adminB, 'POST', { title: 'Other college' })).status, 404);
        assert.equal((await request(lessonPath, adminB, 'PATCH', { title: 'Other college', content: 'Should never be saved' })).status, 404);
        assert.equal((await request(`${coursePath}/modules`, teacher, 'POST', { title: '' })).status, 400);
        assert.equal((await request(lessonPath, teacher, 'PATCH', { title: 'Invalid order', content: 'This is valid content', position: -1 })).status, 400);
        // Soft delete of modules and lessons.
        const tempModule = await request(`${coursePath}/modules`, teacher, 'POST', { title: 'Temporary module' });
        const tempModulePath = `${coursePath}/modules/${tempModule.data.id}`;
        const tempLesson = await request(`${tempModulePath}/lessons`, teacher, 'POST', { title: 'Temporary lesson', content: 'This lesson will be deleted.' });
        const tempLessonPath = `${tempModulePath}/lessons/${tempLesson.data.id}`;
        assert.equal((await request(tempLessonPath, studentA, 'DELETE')).status, 403);
        assert.equal((await request(tempLessonPath, adminB, 'DELETE')).status, 404, 'Other colleges cannot delete lessons');
        assert.equal((await request(tempModulePath, adminB, 'DELETE')).status, 404, 'Other colleges cannot delete modules');
        assert.equal((await request(tempLessonPath, teacher, 'DELETE')).status, 200);
        assert.equal((await request(tempLessonPath, teacher, 'DELETE')).status, 404, 'Deleted lessons stay deleted');
        const deletedLesson = await db.lesson.findUniqueOrThrow({ where: { id: tempLesson.data.id } });
        assert.equal(deletedLesson.activeIndicator, 0);
        assert.ok(deletedLesson.deletedAt, 'd_ts is set on soft delete');
        assert.equal(deletedLesson.updatedBy, teacherId);
        assert.equal((await request(tempLessonPath, teacher, 'PATCH', { title: 'Revived', content: 'Deleted lessons cannot be edited.' })).status, 404);
        assert.equal((await request(tempModulePath, adminA, 'DELETE')).status, 200, 'College Admins can delete modules');
        assert.equal((await request(`${tempModulePath}/lessons`, teacher, 'POST', { title: 'Orphan', content: 'Deleted modules cannot receive lessons.' })).status, 404);
        assert.ok(!(await ownCourses(teacher, 0))[0].modules.some(m => m.id === tempModule.data.id));
        const studentCourses = (await ownCourses(studentA, 0));
        assert.equal(studentCourses[0].title, 'Updated JavaScript course');
        assert.equal(studentCourses[0].modules[1].lessons[0].content, 'Pass arguments to a function and return a result.');
        const courses = await request('/courses', studentA);
        const lessonId = courses.data[0].modules[0].lessons[0].id;
        assert.equal((await db.lesson.findUniqueOrThrow({ where: { id: lessonId } })).createdBy, teacherId);
        assert.equal((await db.courseModule.findFirstOrThrow({ where: { courseId: course.data.id } })).createdBy, teacherId);
        assert.equal((await request(`/courses/${course.data.id}`, adminB, 'PATCH', { status: 'DRAFT' })).status, 404);
        assert.equal((await ownCourses(studentB, 1)).length, 0);
        assert.equal((await request('/courses', studentA, 'GET', undefined, `${slugs[1]}.localhost`)).status, 401);
        // No enrollment step: completing creates the progress record once, even when repeated.
        assert.equal(await db.enrollment.count({ where: { collegeId: created[0] } }), 0);
        for (let n = 0; n < 2; n++)
            assert.equal((await request(`/lessons/${lessonId}/complete`, studentA, 'POST')).status, 200);
        assert.equal(await db.enrollment.count({ where: { collegeId: created[0] } }), 1);
        assert.equal((await db.enrollment.findFirstOrThrow({ where: { collegeId: created[0] } })).progressPct, 50);
        assert.equal(await db.lessonProgress.count({ where: { collegeId: created[0] } }), 1);
        assert.equal((await request(`/lessons/${lessonId}/complete`, studentB, 'POST')).status, 404);
        assert.equal((await ownCourses(studentA, 0))[0].modules[0].lessons[0].progress.length, 1);
        const studentId = (await request('/me', studentA)).data.user.id;
        assert.equal((await db.enrollment.findFirstOrThrow({ where: { courseId: course.data.id } })).createdBy, studentId);
        assert.equal((await db.lessonProgress.findFirstOrThrow({ where: { lessonId } })).createdBy, studentId);
        await db.course.update({ where: { id: course.data.id }, data: { activeIndicator: 0, updatedBy: teacherId } });
        assert.ok((await db.course.findUniqueOrThrow({ where: { id: course.data.id } })).deletedAt, 'd_ts is set on deactivation');
        assert.equal((await ownCourses(studentA, 0)).length, 0);
        assert.equal((await request(`/lessons/${lessonId}/complete`, studentA, 'POST')).status, 404);
        await db.course.update({ where: { id: course.data.id }, data: { activeIndicator: 1, updatedBy: teacherId } });
        assert.equal((await db.course.findUniqueOrThrow({ where: { id: course.data.id } })).deletedAt, null);
        await db.user.update({ where: { id: studentId }, data: { activeIndicator: 0 } });
        assert.equal((await request('/courses', studentA)).status, 401);
        assert.equal((await request('/auth/refresh', studentA, 'POST')).status, 401);
        assert.equal((await request('/auth/login', '', 'POST', { email: 'student@test.local', college: slugs[0], password: 'DemoPass123!' })).status, 401);
        await db.user.update({ where: { id: studentId }, data: { activeIndicator: 1 } });
        // College Admins deactivate teachers and students; sessions are revoked immediately.
        const registeredStudent = await login('registered-student@test.local', slugs[0]);
        const adminAId = (await request('/me', adminA)).data.user.id;
        assert.equal((await request(`/users/${adminAId}`, adminA, 'DELETE')).status, 404, 'Admins cannot deactivate admins');
        assert.equal((await request(`/users/${registeredStudentId}`, teacher, 'DELETE')).status, 403);
        assert.equal((await request(`/users/${registeredStudentId}`, adminB, 'DELETE')).status, 404, 'Other colleges cannot deactivate users');
        assert.equal((await request(`/users/${registeredStudentId}`, adminA, 'DELETE')).status, 200);
        assert.equal(await db.session.count({ where: { userId: registeredStudentId } }), 0);
        assert.equal((await request('/courses', registeredStudent)).status, 401);
        assert.equal((await request('/auth/login', '', 'POST', { email: 'registered-student@test.local', college: slugs[0], password: 'DemoPass123!' })).status, 401);
        assert.ok(!(await request('/users', adminA)).data.some(u => u.id === registeredStudentId));
        // Platform accounts have no college, so their emails need the partial unique index.
        await assert.rejects(db.user.create({ data: { name: 'Duplicate', email: 'super@lms.local', password: 'not-a-login', role: 'SUPER_ADMIN' } }), { code: 'P2002' });
        assert.equal((await request(`/colleges/${created[0]}`, superToken, 'PATCH', { active: false })).status, 200);
        assert.equal((await request('/courses', studentA)).status, 403);
        assert.equal((await request('/auth/login', '', 'POST', { college: slugs[0], email: 'student@test.local', password: 'DemoPass123!' })).status, 401);
        assert.equal((await request('/courses', studentB)).status, 200);
        const renewed = await request('/auth/refresh', studentB, 'POST');
        assert.equal(renewed.status, 200);
        assert.notEqual(renewed.data.token, studentB);
        assert.equal((await request('/courses', studentB)).status, 401, 'Old JWT is invalid after refresh');
        assert.equal((await request('/courses', renewed.data.token)).status, 200);
        assert.equal((await request('/auth/logout', renewed.data.token, 'POST', {}, undefined, { csrf: '' })).status, 403);
        assert.equal((await request('/auth/logout', renewed.data.token, 'POST')).status, 200);
        assert.equal((await request('/courses', renewed.data.token)).status, 401, 'Logged-out JWT and cookie cannot be replayed');
        assert.equal((await request('/auth/refresh', renewed.data.token, 'POST')).status, 401, 'Logout cannot be reversed by refresh');
        const idleToken = await login('student@test.local', slugs[1]);
        const idleClaims = jwt.decode(idleToken);
        await db.session.update({ where: { sid: idleClaims.sid }, data: { expiresAt: new Date(Date.now() - 1000) } });
        assert.equal((await request('/courses', idleToken)).status, 401, 'Idle expiry blocks valid JWT');
        assert.equal((await request('/auth/refresh', idleToken, 'POST')).status, 401);
        const absoluteToken = await login('student@test.local', slugs[1]);
        const absoluteClaims = jwt.decode(absoluteToken);
        const absoluteSession = await db.session.findUniqueOrThrow({ where: { sid: absoluteClaims.sid } });
        const absoluteData = JSON.parse(absoluteSession.data);
        absoluteData.absoluteExpiresAt = Date.now() - 1000;
        await db.session.update({ where: { sid: absoluteClaims.sid }, data: { data: JSON.stringify(absoluteData) } });
        assert.equal((await request('/auth/refresh', absoluteToken, 'POST')).status, 401, 'Refresh cannot extend the absolute deadline');
    }
    finally {
        const testUsers = await db.user.findMany({ where: { collegeId: { in: created } }, select: { id: true } });
        const sessionIds = [...credentials.keys()].map(t => jwt.decode(t)?.sid).filter((sid) => typeof sid === 'string');
        await db.session.deleteMany({ where: { OR: [{ userId: { in: testUsers.map(u => u.id) } }, { sid: { in: sessionIds } }] } });
        await db.lessonProgress.deleteMany({ where: { collegeId: { in: created } } });
        await db.enrollment.deleteMany({ where: { collegeId: { in: created } } });
        await db.course.deleteMany({ where: { collegeId: { in: created } } });
        await db.fileUpload.deleteMany({ where: { collegeId: { in: created } } });
        await db.user.deleteMany({ where: { collegeId: { in: created } } });
        await db.auditLog.deleteMany({ where: { collegeId: { in: created } } });
        await db.college.deleteMany({ where: { id: { in: created } } });
        await db.user.deleteMany({ where: { collegeId: null, name: 'Duplicate', password: 'not-a-login' } });
        await new Promise(resolve => server.close(() => resolve()));
        await db.$disconnect();
        await appDb.$disconnect();
    }
    process.exitCode = 0;
});
