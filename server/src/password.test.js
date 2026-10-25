import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.config.js';
import { change, countRows, findFirst, findOne, remove } from './test-helpers.js';
process.env.NODE_ENV = 'test';
const { app } = await import('./index.js');
const { testOutbox } = await import('./services/mail.service.js');
const origin = 'http://localhost:5173';

test('forgot password: neutral answers, one-time expiring links, sign-out everywhere', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const sessions = new Map();
    const started = new Date();
    let collegeId;
    async function request(path, token = '', method = 'GET', body) {
        const auth = sessions.get(token);
        const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', Origin: origin, 'x-access-token': token, Cookie: auth?.cookie ?? '', 'x-csrf-token': auth?.csrf ?? '' }, ...(body ? { body: JSON.stringify(body) } : {}) });
        const data = await response.json();
        if (data.token)
            sessions.set(data.token, { cookie: response.headers.get('set-cookie')?.split(';')[0], csrf: data.csrfToken });
        return { status: response.status, data };
    }
    const login = (email, college, password = 'DemoPass123!') => request('/auth/login', '', 'POST', { email, college, password });
    const linkToken = (mail) => new URL(mail.text.match(/https?:\/\/\S+/)[0]).searchParams.get('token');
    try {
        const superToken = (await login('super@lms.local')).data.token;
        const slug = `reset-${Date.now()}`;
        const college = await request('/colleges', superToken, 'POST', { name: slug, slug, adminName: 'Reset Admin', adminEmail: 'admin@reset.local', adminPassword: 'DemoPass123!' });
        collegeId = college.data.id;
        const admin = (await login('admin@reset.local', slug)).data.token;
        assert.equal((await request('/users', admin, 'POST', { name: 'Reset Student', email: 'student@reset.local', mobileNo: '+915000000001', password: 'DemoPass123!', role: 'STUDENT' })).status, 201);
        const oldSession = (await login('student@reset.local', slug)).data.token;

        // Unknown accounts and wrong colleges get the same answer and no email.
        const neutral = await request('/auth/forgot-password', '', 'POST', { email: 'nobody@reset.local', college: slug });
        assert.equal(neutral.status, 200);
        assert.equal((await request('/auth/forgot-password', '', 'POST', { email: 'student@reset.local', college: 'alpha' })).data.message, neutral.data.message);
        assert.equal(testOutbox.length, 0);

        const requested = await request('/auth/forgot-password', '', 'POST', { email: 'Student@Reset.local', college: slug });
        assert.equal(requested.data.message, neutral.data.message, 'Existing accounts get the same message');
        assert.equal(testOutbox.length, 1);
        assert.equal(testOutbox[0].to, 'student@reset.local');
        assert.ok(testOutbox[0].text.includes(`${origin}/reset-password?token=`), 'Link opens the frontend the request came from');
        const token = linkToken(testOutbox[0]);
        const stored = await db.one(`SELECT r.tkn_hash_tx AS "tokenHash", r.expires_ts AS "expiresAt" FROM pwd_rst_tkn_dtl_t r JOIN "User" u ON u.id = r.user_id WHERE u.email = 'student@reset.local' AND u."collegeId" = $1`, [collegeId]);
        assert.equal(stored.tokenHash, createHash('sha256').update(token).digest('hex'), 'Only the hash is stored');
        assert.notEqual(stored.tokenHash, token);
        assert.ok(stored.expiresAt.getTime() - Date.now() <= 30 * 60000);
        assert.equal((await request('/auth/forgot-password', '', 'POST', { email: 'student@reset.local', college: slug })).status, 200);
        assert.equal(testOutbox.length, 1, 'At most one email per minute per account');

        // Resetting: validation, one use only, old password and sessions stop working.
        assert.equal((await request('/auth/reset-password', '', 'POST', { token, password: 'short' })).status, 400);
        assert.equal((await request('/auth/reset-password', '', 'POST', { token: 'x'.repeat(43), password: 'NewPassword123!' })).status, 400);
        assert.equal((await request('/me', oldSession)).status, 200);
        assert.equal((await request('/auth/reset-password', '', 'POST', { token, password: 'NewPassword123!' })).status, 200);
        assert.equal((await request('/me', oldSession)).status, 401, 'Existing sessions are signed out');
        assert.equal((await login('student@reset.local', slug)).status, 401, 'Old password no longer works');
        assert.equal((await login('student@reset.local', slug, 'NewPassword123!')).status, 200);
        assert.equal((await request('/auth/reset-password', '', 'POST', { token, password: 'AnotherPass123!' })).status, 400, 'Links work once');

        // Expired links are rejected.
        const expiredToken = 'expired-token-for-test-0123456789abcdef';
        const student = await findOne('user', { email: 'student@reset.local', collegeId });
        await db.run('INSERT INTO pwd_rst_tkn_dtl_t (rst_tkn_id, user_id, tkn_hash_tx, expires_ts) VALUES (DEFAULT, $1, $2, $3)', [student.id, createHash('sha256').update(expiredToken).digest('hex'), new Date(Date.now() - 1000)]);
        assert.equal((await request('/auth/reset-password', '', 'POST', { token: expiredToken, password: 'AnotherPass123!' })).status, 400);

        // Platform accounts reset with the college left empty.
        await db.run(`DELETE FROM pwd_rst_tkn_dtl_t r USING "User" u WHERE u.id = r.user_id AND u.email = 'super@lms.local' AND u."collegeId" IS NULL AND r.i_ts >= $1`, [started]);
        assert.equal((await request('/auth/forgot-password', '', 'POST', { email: 'super@lms.local' })).status, 200);
        assert.equal(testOutbox.at(-1).to, 'super@lms.local');
    }
    finally {
        const sids = [...sessions.keys()].map(token => jwt.decode(token)?.sid).filter(sid => typeof sid === 'string');
        await remove('session', { sid: sids });
        // Remove the Super Admin's test link so it cannot be used.
        await db.run(`DELETE FROM pwd_rst_tkn_dtl_t r USING "User" u WHERE u.id = r.user_id AND u.email = 'super@lms.local' AND u."collegeId" IS NULL AND r.i_ts >= $1`, [started]);
        if (collegeId) {
            await remove('user', { collegeId });
            await remove('auditLog', { collegeId });
            await remove('college', { id: collegeId });
        }
        await new Promise(resolve => server.close(() => resolve()));
        await db.end();
    }
});
