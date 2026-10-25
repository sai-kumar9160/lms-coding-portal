import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../config/db.config.js';
process.env.NODE_ENV = 'test';
const { app } = await import('./index.js');

test('vendors: created only by the Super Admin, platform-level, limited to the coding library', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const sessions = new Map();
    const emails = [];
    async function request(path, token = '', method = 'GET', body) {
        const auth = sessions.get(token);
        const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'x-access-token': token, Cookie: auth?.cookie ?? '', 'x-csrf-token': auth?.csrf ?? '' }, ...(body ? { body: JSON.stringify(body) } : {}) });
        const data = await response.json();
        if (data.token) sessions.set(data.token, { cookie: response.headers.get('set-cookie')?.split(';')[0], csrf: data.csrfToken });
        return { status: response.status, data };
    }
    const login = async (email, college) => { const r = await request('/auth/login', '', 'POST', { email, college, password: 'DemoPass123!' }); assert.equal(r.status, 200, `login ${email}`); return r.data.token; };
    try {
        const superToken = await login('super@lms.local');
        const suffix = Date.now();
        const email = `vendor-${suffix}@test.local`;
        emails.push(email);
        const vendor = { name: 'Test Vendor', email, mobileNo: '+917000000001', password: 'DemoPass123!' };

        // Only the Super Admin gives out vendor logins; nobody can register as one.
        assert.equal((await request('/auth/register', '', 'POST', { ...vendor, role: 'VENDOR', college: 'alpha' })).status, 400);
        const created = await request('/vendors', superToken, 'POST', vendor);
        assert.equal(created.status, 201, JSON.stringify(created.data));
        assert.equal(created.data.password, undefined);
        assert.equal((await request('/vendors', superToken, 'POST', vendor)).status, 409, 'Duplicate email');
        assert.ok((await request('/vendors', superToken)).data.some(v => v.email === email));

        // The vendor signs in without a college code and sees only the coding problem library.
        const token = await login(email);
        assert.equal((await request('/me', token)).data.user.role, 'VENDOR');
        const menu = (await request('/menu', token)).data.menu;
        const codes = menu.flatMap(item => item.children.length ? item.children : [item]).filter(item => !item.header).map(item => item.code);
        assert.deepEqual(codes, ['coding-problems']);
        assert.equal((await request('/vendors', token)).status, 403, 'Vendors cannot list vendors');
        assert.equal((await request('/vendors', token, 'POST', vendor)).status, 403);
        for (const path of ['/courses', '/users', '/colleges', '/assessments/mine'])
            assert.ok([403].includes((await request(path, token)).status), `${path} is closed to vendors`);

        // They publish shared problems (no college) and manage only their own.
        const problem = await request('/coding/manage', token, 'POST', { title: `Vendor problem ${suffix}`, statement: 'Print the number you are given.', visibility: 'SHARED' });
        assert.equal(problem.status, 201, JSON.stringify(problem.data));
        assert.equal(problem.data.collegeId, null);
        assert.ok((await request('/coding/manage', token)).data.some(p => p.id === problem.data.id));
        const second = await request('/vendors', superToken, 'POST', { ...vendor, email: `other-${email}` });
        emails.push(`other-${email}`);
        const otherToken = await login(`other-${email}`);
        assert.ok(!(await request('/coding/manage', otherToken)).data.some(p => p.id === problem.data.id), 'Vendors do not see each other\'s drafts');
        assert.equal((await request(`/coding/manage/${problem.data.id}`, otherToken)).status, 404);

        // Removing a vendor signs them out and blocks the login.
        assert.equal((await request(`/vendors/${created.data.id}`, superToken, 'DELETE')).status, 200);
        assert.equal((await request('/me', token)).status, 401);
        assert.equal((await request('/auth/login', '', 'POST', { email, password: 'DemoPass123!' })).status, 400);
        assert.equal(second.status, 201);
    }
    finally {
        await db.run(`DELETE FROM "Session" WHERE "userId" IN (SELECT id FROM "User" WHERE email = ANY($1::text[]))`, [emails]);
        await db.run('DELETE FROM cdng_prblm_lst_t WHERE crte_usr_id IN (SELECT id FROM "User" WHERE email = ANY($1::text[]))', [emails]);
        await db.run(`DELETE FROM adt_log_dtl_t WHERE entity_type_cd = 'vendor' AND after_json->>'email' = ANY($1::text[]) OR before_json->>'email' = ANY($1::text[])`, [emails]);
        await db.run('DELETE FROM "User" WHERE email = ANY($1::text[])', [emails]);
        server.close();
        await db.end();
    }
});
