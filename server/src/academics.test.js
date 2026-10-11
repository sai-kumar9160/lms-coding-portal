import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createDatabaseClient } from '../config/db.config.js';
process.env.NODE_ENV = 'test';
const { app, db: appDb } = await import('./index.js');
const db = createDatabaseClient();

test('academic structure, profiles, cohorts and the audit log', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const sessions = new Map();
    const created = [];
    async function request(path, token = '', method = 'GET', body, headers = {}) {
        const auth = sessions.get(token);
        const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'x-access-token': token, Cookie: auth?.cookie ?? '', 'x-csrf-token': auth?.csrf ?? '', ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
        const data = await response.json();
        if (data.token)
            sessions.set(data.token, { cookie: response.headers.get('set-cookie')?.split(';')[0], csrf: data.csrfToken });
        return { status: response.status, data };
    }
    async function login(email, college) { const r = await request('/auth/login', '', 'POST', { email, college, password: 'DemoPass123!' }); assert.equal(r.status, 200, `login ${email}`); return r.data.token; }
    try {
        const superToken = await login('super@lms.local');
        const slugs = [`acad-a-${Date.now()}`, `acad-b-${Date.now()}`];
        for (const slug of slugs)
            created.push((await request('/colleges', superToken, 'POST', { name: slug, slug, adminName: 'Academic Admin', adminEmail: 'admin@acad.local', adminPassword: 'DemoPass123!' })).data.id);
        const admin = await login('admin@acad.local', slugs[0]);
        const adminB = await login('admin@acad.local', slugs[1]);
        for (const [n, [name, role]] of [['teacher', 'TEACHER'], ['student', 'STUDENT'], ['student2', 'STUDENT']].entries())
            assert.equal((await request('/users', admin, 'POST', { name, email: `${name}@acad.local`, mobileNo: `+9140000000${n}`, password: 'DemoPass123!', role })).status, 201);
        const teacher = await login('teacher@acad.local', slugs[0]);
        const people = (await request('/users', admin)).data;
        const id = email => people.find(u => u.email === email).id;
        const A = (path, method, body) => request(`/academics/${path}`, admin, method, body);

        // Academic years: dates validated, only one current year.
        assert.equal((await A('academic-years', 'POST', { name: '2026-27', startDate: '2027-06-01', endDate: '2026-06-01' })).status, 400);
        const year1 = (await A('academic-years', 'POST', { name: '2025-26', startDate: '2025-06-01', endDate: '2026-05-31', isCurrent: true })).data;
        const year2 = await A('academic-years', 'POST', { name: '2026-27', startDate: '2026-06-01', endDate: '2027-05-31', isCurrent: true });
        assert.equal(year2.status, 201);
        assert.deepEqual((await A('academic-years')).data.filter(y => y.isCurrent).map(y => y.name), ['2026-27'], 'Only one current year');
        assert.equal((await A('academic-years', 'POST', { name: '2026-27', startDate: '2026-06-01', endDate: '2027-05-31' })).status, 409);

        // Departments, programmes, batches: codes upper-cased and unique, references checked against the college.
        assert.equal((await A('departments', 'POST', { code: 'cse', name: 'Computer Science', hodUserId: id('student@acad.local') })).status, 400, 'Head of department must be a teacher');
        const dept = (await A('departments', 'POST', { code: 'cse', name: 'Computer Science', hodUserId: id('teacher@acad.local') })).data;
        assert.equal(dept.code, 'CSE');
        assert.equal((await A('departments', 'POST', { code: 'CSE', name: 'Duplicate' })).status, 409);
        const deptB = (await request('/academics/departments', adminB, 'POST', { code: 'ECE', name: 'Electronics' })).data;
        assert.equal((await A('programs', 'POST', { departmentId: deptB.id, code: 'BTECH', name: 'B.Tech', durationYears: 4 })).status, 400, 'Other college departments cannot be used');
        const program = (await A('programs', 'POST', { departmentId: dept.id, code: 'btech-cse', name: 'B.Tech CSE', durationYears: 4 })).data;
        assert.equal((await A('programs', 'POST', { departmentId: dept.id, code: 'X1', name: 'Too long', durationYears: 11 })).status, 400);
        const batch = (await A('batches', 'POST', { programId: program.id, academicYearId: year2.data.id, name: 'CSE 2026', section: 'A' })).data;
        assert.equal((await A('batches', 'POST', { programId: program.id, academicYearId: year2.data.id, name: 'CSE 2026', section: 'A' })).status, 409);
        assert.equal((await A('batches')).data[0].program.code, 'BTECH-CSE');
        assert.equal((await request('/academics/departments', adminB)).data.length, 1, 'Each college sees its own structure');
        assert.equal((await request('/academics/departments', teacher)).status, 403, 'Teachers do not manage academics');
        assert.equal((await A('unknown')).status, 400);

        // In-use items cannot be removed; unused ones can.
        assert.equal((await A(`departments/${dept.id}`, 'DELETE')).status, 409);
        assert.equal((await A(`academic-years/${year2.data.id}`, 'DELETE')).status, 409);
        assert.equal((await A(`academic-years/${year1.id}`, 'DELETE')).status, 200);
        assert.equal((await A(`academic-years/${year1.id}`, 'DELETE')).status, 404);
        const renamed = await A(`departments/${dept.id}`, 'PATCH', { code: 'CSE', name: 'Computer Science & Engineering', hodUserId: null });
        assert.equal(renamed.data.name, 'Computer Science & Engineering');

        // Profiles: student → roll number + batch, teacher → employee code + department; teachers see limited student data.
        assert.equal((await request(`/users/${id('student@acad.local')}/profile`, admin, 'PUT', { rollNumber: '26CSE001', batchId: batch.id, dateOfBirth: '2008-04-02', gender: 'FEMALE', guardianPhone: '+919876500001' })).status, 200);
        assert.equal((await request(`/users/${id('student2@acad.local')}/profile`, admin, 'PUT', { rollNumber: '26CSE001' })).status, 409, 'Roll numbers are unique in a college');
        assert.equal((await request(`/users/${id('student2@acad.local')}/profile`, admin, 'PUT', { rollNumber: '26CSE002', batchId: deptB.id })).status, 400);
        assert.equal((await request(`/users/${id('teacher@acad.local')}/profile`, admin, 'PUT', { employeeCode: 'EMP-7', departmentId: dept.id, designation: 'Assistant Professor' })).status, 200);
        assert.equal((await request(`/users/${id('teacher@acad.local')}/profile`, teacher, 'PUT', { employeeCode: 'X' })).status, 403);
        const adminView = (await request('/users', admin)).data.find(u => u.email === 'student@acad.local').studentProfile;
        assert.equal(adminView.guardianPhone, '+919876500001');
        assert.equal(adminView.batch.section, 'A');
        const teacherView = (await request('/users', teacher)).data.find(u => u.email === 'student@acad.local').studentProfile;
        assert.equal(teacherView.rollNumber, '26CSE001');
        assert.equal(teacherView.guardianPhone, undefined, 'Teachers cannot see guardian phone');
        assert.equal(teacherView.dateOfBirth, undefined);
        assert.equal((await A(`batches/${batch.id}`, 'DELETE')).status, 409, 'Batches with students cannot be removed');

        // Cohorts and members: students of this college only.
        const cohort = (await A('cohorts', 'POST', { name: 'Section A', batchId: batch.id, description: 'Morning section' })).data;
        assert.equal((await A(`cohorts/${cohort.id}/members`, 'POST', { userIds: [id('teacher@acad.local')] })).status, 400);
        assert.equal((await A(`cohorts/${cohort.id}/members`, 'POST', { userIds: [id('student@acad.local'), id('student2@acad.local')] })).data.added, 2);
        assert.equal((await A(`cohorts/${cohort.id}/members`, 'POST', { userIds: [id('student@acad.local')] })).status, 200, 'Adding again is harmless');
        assert.equal((await A(`cohorts/${cohort.id}/members`)).data.length, 2);
        assert.equal((await request(`/academics/cohorts/${cohort.id}/members`, adminB)).status, 404);
        assert.equal((await A(`cohorts/${cohort.id}/members/${id('student2@acad.local')}`, 'DELETE')).status, 200);
        assert.equal((await A('cohorts')).data[0]._count.members, 1);
        assert.equal((await A(`cohorts/${cohort.id}`, 'PATCH', { name: 'Section A', batchId: batch.id, archived: true })).status, 200);
        assert.equal((await A(`cohorts/${cohort.id}/members`, 'POST', { userIds: [id('student2@acad.local')] })).status, 409, 'Archived cohorts are frozen');

        // Audit log: before/after recorded, no secrets, scoped by college.
        const log = (await request('/audit-logs?entityType=department', admin)).data;
        const update = log.items.find(item => item.action === 'update');
        assert.equal(update.before.name, 'Computer Science');
        assert.equal(update.after.name, 'Computer Science & Engineering');
        assert.equal(update.actor.email, 'admin@acad.local');
        assert.ok(update.ipAddress && update.requestId);
        const userCreate = (await request('/audit-logs?entityType=user&action=create', admin)).data.items[0];
        assert.equal(userCreate.after.password, undefined, 'Passwords are never written to the audit log');
        assert.ok(userCreate.after.email);
        assert.ok((await request('/audit-logs', admin)).data.items.every(item => item.collegeId === created[0]), 'College Admins see their college only');
        assert.equal((await request('/audit-logs', teacher)).status, 403);
        const paged = await request('/audit-logs?limit=2', admin);
        assert.equal(paged.data.items.length, 2);
        const next = await request(`/audit-logs?limit=2&cursor=${paged.data.nextCursor}`, admin);
        assert.ok(next.data.items.every(item => !paged.data.items.some(p => p.id === item.id)), 'Cursor pages do not repeat');
        const superView = await request(`/audit-logs?entityType=department`, superToken, 'GET', undefined, { 'x-college-id': created[1] });
        assert.ok(superView.data.items.length && superView.data.items.every(item => item.collegeId === created[1]), 'Super Admin filters by the chosen college');
        assert.equal(superView.data.items[0].actingAsSuperAdmin, 0);
        await request('/academics/departments', superToken, 'POST', { code: 'MECH', name: 'Mechanical' }, { 'x-college-id': created[1] });
        assert.equal((await request('/audit-logs?entityType=department', superToken, 'GET', undefined, { 'x-college-id': created[1] })).data.items[0].actingAsSuperAdmin, 1, 'Super Admin actions in a college are flagged');
    }
    finally {
        const sids = [...sessions.keys()].map(token => jwt.decode(token)?.sid).filter(sid => typeof sid === 'string');
        await db.session.deleteMany({ where: { sid: { in: sids } } });
        await db.cohort.deleteMany({ where: { collegeId: { in: created } } });
        await db.studentProfile.deleteMany({ where: { collegeId: { in: created } } });
        await db.teacherProfile.deleteMany({ where: { collegeId: { in: created } } });
        await db.batch.deleteMany({ where: { collegeId: { in: created } } });
        await db.program.deleteMany({ where: { collegeId: { in: created } } });
        await db.department.deleteMany({ where: { collegeId: { in: created } } });
        await db.academicYear.deleteMany({ where: { collegeId: { in: created } } });
        await db.auditLog.deleteMany({ where: { collegeId: { in: created } } });
        await db.user.deleteMany({ where: { collegeId: { in: created } } });
        await db.college.deleteMany({ where: { id: { in: created } } });
        await new Promise(resolve => server.close(() => resolve()));
        await db.$disconnect();
        await appDb.$disconnect();
    }
});
