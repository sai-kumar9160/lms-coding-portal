import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { createDatabaseClient } from '../config/db.config.js';
process.env.NODE_ENV = 'test';

// Local upstream for the proxy: echoes what it received, stalls on /stall before replying,
// and on /stream-stall sends headers then stalls mid-body, to trigger both timeout paths.
const upstream = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        if (req.url.startsWith('/base/stall'))
            return setTimeout(() => res.end('{}'), 1000);
        if (req.url.startsWith('/base/stream-stall')) {
            res.writeHead(200, { 'content-type': 'application/json' });
            res.write('{"partial":');
            return setTimeout(() => res.end('1}'), 1000);
        }
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ method: req.method, url: req.url, headers: req.headers, body }));
    });
});
await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
const upstreamUrl = `http://127.0.0.1:${upstream.address().port}/base`;
process.env.TEST_ECHO_KEY = 'echo-secret-key';
process.env.PROXY_TARGETS = JSON.stringify({
    echo: { url: upstreamUrl, roles: ['TEACHER'], apiKeyHeader: 'x-api-key', apiKeyEnv: 'TEST_ECHO_KEY' },
    slow: { url: upstreamUrl, roles: ['TEACHER'], timeoutMs: 200 },
});
const { app, db: appDb } = await import('./index.js');
const db = createDatabaseClient();
const origin = 'http://localhost:5173';

test('database menus, permissions, CORS, request IDs and proxy', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const sessions = new Map();
    async function request(path, token = '', method = 'GET', body, extraHeaders = {}) {
        const auth = sessions.get(token);
        const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'x-access-token': token, Cookie: auth?.cookie ?? '', 'x-csrf-token': auth?.csrf ?? '', ...extraHeaders }, ...(body ? { body: JSON.stringify(body) } : {}) });
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        if (data?.token)
            sessions.set(data.token, { cookie: response.headers.get('set-cookie')?.split(';')[0], csrf: data.csrfToken });
        return { status: response.status, data, headers: response.headers };
    }
    async function login(email, college) { const r = await request('/auth/login', '', 'POST', { email, college, password: 'DemoPass123!' }); assert.equal(r.status, 200); return r.data.token; }
    const teacherRoleId = 3;
    const original = await db.roleMenuPermission.findMany({ where: { roleId: teacherRoleId } });
    const started = new Date();
    let collegeId;
    try {
        // A temporary college keeps the test independent of the demo data.
        const superToken = await login('super@lms.local');
        const slug = `access-${Date.now()}`;
        const college = await request('/colleges', superToken, 'POST', { name: slug, slug, adminName: 'Access Admin', adminEmail: 'admin@access.local', adminPassword: 'DemoPass123!' });
        assert.equal(college.status, 201);
        collegeId = college.data.id;
        const admin = await login('admin@access.local', slug);
        for (const [role, mobileNo] of [['TEACHER', '+917000000001'], ['STUDENT', '+917000000002']])
            assert.equal((await request('/users', admin, 'POST', { name: `Access ${role}`, email: `${role.toLowerCase()}@access.local`, mobileNo, password: 'DemoPass123!', role })).status, 201);
        const teacher = await login('teacher@access.local', slug);
        const student = await login('student@access.local', slug);

        // Sidebar menus come from app_rle_mnu_itm_rel_t.
        const codes = items => items.map(item => item.code);
        assert.deepEqual(codes((await request('/menu', student)).data.menu), ['overview', 'courses', 'assessments', 'coding']);
        assert.deepEqual(codes((await request('/menu', teacher)).data.menu), ['overview', 'courses', 'assessments', 'coding', 'people']);
        assert.deepEqual(codes((await request('/menu', admin)).data.menu), ['overview', 'courses', 'assessments', 'coding', 'people', 'academics', 'audit-log']);
        const superMenu = (await request('/menu', superToken)).data;
        assert.deepEqual(codes(superMenu.menu), ['overview', 'courses', 'assessments', 'coding', 'people', 'academics', 'audit-log', 'platform']);
        assert.deepEqual(codes(superMenu.menu[7].children), ['colleges', 'access-control']);
        assert.equal(superMenu.menu[7].header, true);
        const studentAccess = (await request('/menu', student)).data.permissions;
        assert.deepEqual(studentAccess.enrollments, { view: true, create: false, update: true, delete: false, export: false }, 'Hidden permission objects are still returned');
        assert.equal(studentAccess.courses.update, false);
        assert.equal((await request('/menu')).status, 401);

        // Only roles with access-control can read or change permissions.
        assert.equal((await request('/access/roles', admin)).status, 403);
        assert.equal((await request(`/access/roles/${teacherRoleId}/permissions`, teacher)).status, 403);
        const roles = await request('/access/roles', superToken);
        assert.deepEqual(roles.data.map(role => role.code), ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER', 'STUDENT']);
        const matrix = (await request(`/access/roles/${teacherRoleId}/permissions`, superToken)).data;
        const people = matrix.find(row => row.code === 'people');
        assert.equal(people.view, true);
        assert.equal((await request('/access/roles/99/permissions', superToken)).status, 404);

        // Changing a permission changes both the API and the sidebar immediately.
        assert.equal((await request('/users', teacher)).status, 200);
        assert.equal((await request(`/access/roles/${teacherRoleId}/permissions`, superToken, 'PUT', { permissions: [{ menuItemId: people.menuItemId, view: false, create: false, update: false, delete: false, export: false }] })).status, 200);
        assert.equal((await request('/users', teacher)).status, 403);
        assert.ok(!codes((await request('/menu', teacher)).data.menu).includes('people'));
        const saved = await db.roleMenuPermission.findFirstOrThrow({ where: { roleId: teacherRoleId, menuItemId: people.menuItemId } });
        assert.equal(saved.canView, 0);
        assert.ok(saved.updatedBy, 'Permission changes record the updater');
        assert.equal((await request(`/access/roles/${teacherRoleId}/permissions`, superToken, 'PUT', { permissions: [{ menuItemId: people.menuItemId, view: true, create: false, update: false, delete: false, export: false }] })).status, 200);
        assert.equal((await request('/users', teacher)).status, 200);
        assert.equal((await request(`/access/roles/${teacherRoleId}/permissions`, superToken, 'PUT', { permissions: [{ menuItemId: 99999, view: true, create: false, update: false, delete: false, export: false }] })).status, 400);
        assert.equal((await request(`/access/roles/${teacherRoleId}/permissions`, superToken, 'PUT', { permissions: [{ menuItemId: people.menuItemId, view: 'yes' }] })).status, 400);
        // Super Admin cannot lock itself out of access control.
        const accessItem = matrix.find(row => row.code === 'access-control');
        assert.equal((await request('/access/roles/1/permissions', superToken, 'PUT', { permissions: [{ menuItemId: accessItem.menuItemId, view: false, create: false, update: false, delete: false, export: false }] })).status, 400);
        // Permission checks reject roles without the flag (students cannot edit courses).
        assert.equal((await request('/courses', student, 'POST', { title: 'Nope', description: 'Students cannot create', moduleTitle: 'M1', lessonTitle: 'L1', content: 'Not allowed here.' })).status, 403);

        // College Admins create courses; Super Admins work inside a college through the college switcher.
        const newCourse = { title: 'Admin course', description: 'Created by an admin', moduleTitle: 'Start', lessonTitle: 'Hello', content: 'Admins can create courses now.' };
        assert.equal((await request('/courses', admin, 'POST', newCourse)).status, 201);
        assert.equal((await request('/courses', superToken)).status, 403, 'Super Admin needs a college context');
        const asSuper = (path, method = 'GET', body) => request(path, superToken, method, body, { 'x-college-id': collegeId });
        const superCourse = await asSuper('/courses', 'POST', { ...newCourse, title: 'Platform course' });
        assert.equal(superCourse.status, 201);
        assert.equal((await db.course.findUniqueOrThrow({ where: { id: superCourse.data.id } })).collegeId, collegeId);
        assert.deepEqual((await asSuper('/courses')).data.filter(c => c.collegeId === collegeId).map(c => c.title).sort(), ['Admin course', 'Platform course']);
        assert.equal((await asSuper(`/courses/${superCourse.data.id}`, 'PATCH', { status: 'PUBLISHED' })).status, 200);
        assert.ok(Number.isInteger(collegeId) && collegeId > 0, 'College IDs are positive integers');
        for (const invalidId of ['not-a-number', '0', '-1', '1.5', '2147483648', '00000000-0000-4000-8000-000000000000'])
            assert.equal((await request('/courses', superToken, 'GET', undefined, { 'x-college-id': invalidId })).status, 400);
        assert.equal((await request('/courses', superToken, 'GET', undefined, { 'x-college-id': '2147483647' })).status, 404);
        // Super Admins manage people in the chosen college: list (including pending), add, approve, deactivate.
        assert.equal((await request('/users', superToken)).status, 403, 'People also need a college context');
        const pending = await request('/auth/register', '', 'POST', { college: slug, role: 'TEACHER', name: 'Pending Teacher', email: 'pending@access.local', mobileNo: '+917000000003', password: 'DemoPass123!' });
        assert.equal(pending.status, 201);
        assert.equal((await asSuper('/users')).data.find(u => u.id === pending.data.user.id)?.status, 'PENDING');
        assert.equal((await asSuper(`/users/${pending.data.user.id}/approve`, 'POST')).status, 200);
        const added = await asSuper('/users', 'POST', { name: 'Added By Super', email: 'super-added@access.local', mobileNo: '+917000000004', password: 'DemoPass123!', role: 'STUDENT' });
        assert.equal(added.status, 201);
        assert.equal(added.data.collegeId, collegeId);
        assert.equal((await asSuper(`/users/${added.data.id}`, 'DELETE')).status, 200);
        const adminId = (await request('/me', admin)).data.user.id;
        assert.equal((await asSuper(`/users/${adminId}`, 'DELETE')).status, 404, 'College Admin accounts are not deactivated from People');

        // Other roles cannot switch: their header is ignored and they stay in their own college.
        const otherCollege = await db.college.findFirst({ where: { id: { not: collegeId }, activeIndicator: 1 } });
        if (otherCollege) {
            const adminView = await request('/courses', admin, 'GET', undefined, { 'x-college-id': otherCollege.id });
            assert.equal(adminView.status, 200);
            // Shared courses of other colleges may appear, but never the other college's own private courses.
            assert.ok(adminView.data.every(c => c.collegeId === collegeId || c.shared === 1));
        }

        // CORS: allowed origins get credentialed CORS headers; others get none and are rejected.
        const preflight = await fetch(`${base}/courses`, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'DELETE', 'Access-Control-Request-Headers': 'x-access-token,x-csrf-token' } });
        assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
        assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');
        assert.match(preflight.headers.get('access-control-allow-methods'), /DELETE/);
        const blocked = await fetch(`${base}/health`, { headers: { Origin: 'https://evil.example' } });
        assert.equal(blocked.status, 403);
        assert.equal(blocked.headers.get('access-control-allow-origin'), null);
        assert.match((await fetch(`${base}/health`, { headers: { Origin: origin } })).headers.get('access-control-expose-headers'), /x-access-token/);

        // Request IDs: generated when missing, echoed when valid, replaced when malformed.
        assert.match((await request('/health')).headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
        assert.equal((await request('/health', '', 'GET', undefined, { 'x-request-id': 'trace-12345678' })).headers.get('x-request-id'), 'trace-12345678');
        assert.notEqual((await request('/health', '', 'GET', undefined, { 'x-request-id': 'bad id!' })).headers.get('x-request-id'), 'bad id!');

        // Proxy: allowlisted service, role check, identity headers, API key, no cookie/JWT forwarding.
        const echoed = await request('/proxy/echo/items/42?page=2', teacher);
        assert.equal(echoed.status, 200);
        assert.equal(echoed.data.url, '/base/items/42?page=2');
        assert.equal(echoed.data.headers['x-api-key'], 'echo-secret-key');
        assert.equal(echoed.data.headers['x-lms-role'], 'TEACHER');
        assert.ok(echoed.data.headers['x-lms-college-id']);
        assert.ok(echoed.data.headers['x-request-id']);
        assert.equal(echoed.data.headers.cookie, undefined);
        assert.equal(echoed.data.headers['x-access-token'], undefined);
        assert.equal(echoed.data.headers['x-csrf-token'], undefined);
        const posted = await request('/proxy/echo/submit', teacher, 'POST', { answer: 42 });
        assert.equal(posted.data.method, 'POST');
        assert.deepEqual(JSON.parse(posted.data.body), { answer: 42 });
        assert.equal((await request('/proxy/echo/submit', teacher, 'POST', { answer: 42 }, { 'x-csrf-token': 'wrong' })).status, 403, 'Proxy writes still need CSRF');
        assert.equal((await request('/proxy/echo/items', student)).status, 403, 'Roles are checked per service');
        assert.equal((await request('/proxy/echo/items')).status, 401);
        assert.equal((await request('/proxy/unknown/items', teacher)).status, 404);
        // fetch() normalizes "%2e%2e", so send the raw path to check traversal is rejected.
        const traversal = await new Promise((resolve, reject) => {
            const auth = sessions.get(teacher);
            http.get({ host: '127.0.0.1', port: server.address().port, path: '/api/proxy/echo/%2e%2e/secret', headers: { 'x-access-token': teacher, Cookie: auth.cookie } }, res => { res.resume(); resolve(res.statusCode); }).on('error', reject);
        });
        assert.equal(traversal, 400);
        assert.equal((await request('/proxy/slow/stall', teacher)).status, 504);
        assert.equal((await request('/proxy/slow/stream-stall', teacher)).status, 504, 'Timeout also covers the response body');
    }
    finally {
        // Restore the teacher permissions exactly as they were.
        for (const row of original)
            await db.roleMenuPermission.update({ where: { id: row.id }, data: { canView: row.canView, canCreate: row.canCreate, canUpdate: row.canUpdate, canDelete: row.canDelete, canExport: row.canExport, activeIndicator: row.activeIndicator } });
        // Remove only this test's sessions, not demo users' real browser sessions.
        const sids = [...sessions.keys()].map(token => jwt.decode(token)?.sid).filter(sid => typeof sid === 'string');
        await db.session.deleteMany({ where: { sid: { in: sids } } });
        if (collegeId) {
            await db.course.deleteMany({ where: { collegeId } });
            await db.user.deleteMany({ where: { collegeId } });
            await db.auditLog.deleteMany({ where: { collegeId } });
            await db.auditLog.deleteMany({ where: { entityType: 'role_permissions', occurredAt: { gte: started } } });
            await db.college.deleteMany({ where: { id: collegeId } });
        }
        await new Promise(resolve => server.close(() => resolve()));
        await new Promise(resolve => upstream.close(() => resolve()));
        await db.$disconnect();
        await appDb.$disconnect();
    }
});
