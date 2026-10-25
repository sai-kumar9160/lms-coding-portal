import session from 'express-session';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '../../config/db.config.js';
import { Role } from '../utils/enums.js';
import { fail } from '../utils/http-error.js';
import { idSchema } from '../utils/ids.js';
export const jwtSecret = process.env.JWT_SECRET || '';
const sessionSecret = process.env.SESSION_SECRET || jwtSecret;
if (jwtSecret.length < 32 || sessionSecret.length < 32)
    throw new Error('JWT_SECRET and SESSION_SECRET must contain at least 32 characters');
const production = process.env.NODE_ENV === 'production';
if (production && (!process.env.SESSION_SECRET || sessionSecret === jwtSecret))
    throw new Error('Production requires a separate SESSION_SECRET');
const idleMs = 30 * 60 * 1000;
const absoluteMs = 8 * 60 * 60 * 1000;
export const cookieName = production ? '__Host-campus.sid' : 'campus.sid';
export const cookieOptions = { httpOnly: true, secure: production, sameSite: 'lax', path: '/' };
export const jwtOptions = { algorithm: 'HS256', issuer: 'campus-lms', audience: 'campus-web', subject: 'user', expiresIn: '15m' };
export const identitySchema = z.object({ id: idSchema, role: z.nativeEnum(Role), collegeId: z.number().int().positive().nullable(), sid: z.string(), exp: z.number(), iat: z.number() });
function expiry(data) {
    return new Date(Math.min(data.cookie.expires ? new Date(data.cookie.expires).getTime() : Date.now() + idleMs, data.absoluteExpiresAt || Date.now() + idleMs));
}
// Express sessions kept in the "Session" table, so every server process sees the same sessions.
export class PgSessionStore extends session.Store {
    get(sid, callback) {
        db.one('SELECT data, "expiresAt", a_in FROM "Session" WHERE sid = $1', [sid]).then(async (row) => {
            if (!row || row.a_in !== 1)
                return callback(null, null);
            if (row.expiresAt.getTime() <= Date.now()) {
                await db.run('DELETE FROM "Session" WHERE sid = $1', [sid]);
                return callback(null, null);
            }
            const data = JSON.parse(row.data);
            data.cookie.expires = row.expiresAt;
            callback(null, data);
        }).catch(callback);
    }
    set(sid, data, callback = () => { }) {
        const initializing = data.initializing;
        delete data.initializing;
        const values = [sid, JSON.stringify(data), data.userId || null, expiry(data), data.userId || null];
        // Only login creates a session. A delayed request cannot recreate a logged-out session.
        const operation = initializing
            ? db.run('INSERT INTO "Session" (sid, data, "userId", "expiresAt", crte_usr_id) VALUES ($1, $2, $3, $4, $5)', values)
            : db.run('UPDATE "Session" SET data = $2, "userId" = $3, "expiresAt" = $4, updte_usr_id = $5 WHERE sid = $1 AND a_in = 1 AND "expiresAt" > $6', [...values, new Date()])
                .then(changed => { if (!changed) fail(401, 'Session no longer active'); });
        operation.then(() => callback()).catch(callback);
    }
    destroy(sid, callback = () => { }) { db.run('DELETE FROM "Session" WHERE sid = $1', [sid]).then(() => callback()).catch(callback); }
    touch(sid, data, callback = () => { }) {
        db.run('UPDATE "Session" SET "expiresAt" = $2, updte_usr_id = $3 WHERE sid = $1 AND a_in = 1 AND "expiresAt" > $4', [sid, expiry(data), data.userId || null, new Date()]).then(() => callback()).catch(callback);
    }
}
export const sessionMiddleware = session({ name: cookieName, secret: sessionSecret, store: new PgSessionStore(), resave: false, saveUninitialized: false, rolling: true, cookie: { ...cookieOptions, maxAge: idleMs } });
export function checkCsrf(req) { if (!req.session.csrfToken || req.get('x-csrf-token') !== req.session.csrfToken)
    fail(403, 'CSRF validation failed'); }
export async function sessionUser(req) {
    if (!req.session.userId || !req.session.absoluteExpiresAt || req.session.absoluteExpiresAt <= Date.now())
        fail(401, 'Session expired. Please sign in again');
    const user = await db.one(
        `SELECT u.id, u.name, u.email, u.mobile_no AS "mobileNo", u.password, u.role, u.role_id AS "roleId", u.status,
            u."collegeId", u.i_ts AS "createdAt", u.u_ts AS "updatedAt", u.crte_usr_id AS "createdBy",
            u.updte_usr_id AS "updatedBy", u.a_in AS "activeIndicator", u.d_ts AS "deletedAt" FROM "User" u JOIN role_t r ON r.role_id = u.role_id WHERE u.id = $1 AND r.a_in = 1`, [req.session.userId]);
    if (!user || user.activeIndicator !== 1 || user.status !== 'ACTIVE' || user.collegeId !== req.session.collegeId)
        fail(401, 'Session invalid');
    if (user.collegeId) {
        const college = await db.one(`SELECT c.id, c.name, c.slug, c.active, c.i_ts AS "createdAt", c.u_ts AS "updatedAt", c.crte_usr_id AS "createdBy",
            c.updte_usr_id AS "updatedBy", c.a_in AS "activeIndicator", c.d_ts AS "deletedAt" FROM "College" c WHERE c.id = $1`, [user.collegeId]);
        if (!college?.active || college.activeIndicator !== 1)
            fail(403, 'College suspended');
        if (req.hostname.endsWith('.localhost') && req.hostname.split('.')[0] !== college.slug)
            fail(401, 'College does not match session');
    }
    else if (req.hostname.endsWith('.localhost'))
        fail(401, 'Platform session cannot access a college hostname');
    req.session.cookie.maxAge = Math.min(idleMs, req.session.absoluteExpiresAt - Date.now());
    return user;
}
export const publicUser = async (u) => {
    const branches = u.role === Role.STUDENT
        ? await db.many(
            `SELECT c.chrt_id AS id, c.chrt_nm AS name FROM chrt_mbr_rel_t m JOIN chrt_lst_t c ON c.chrt_id = m.chrt_id
             WHERE m.user_id = $1 AND m.college_id = $2 AND m.a_in = 1 AND c.a_in = 1 AND c.archived_in = 0`, [u.id, u.collegeId])
        : [];
    return { id: u.id, name: u.name, email: u.email, role: u.role, roleId: u.roleId, status: u.status, collegeId: u.collegeId, branches, branchGroupIds: branches.map(branch => branch.id) };
};
export function sign(req, user) {
    return jwt.sign({ id: user.id, role: user.role, collegeId: user.collegeId, sid: req.sessionID }, jwtSecret, { ...jwtOptions, jwtid: randomBytes(16).toString('hex') });
}
export const save = (req) => new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
export async function establishSession(req, res, user) {
    await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    req.session.userId = user.id;
    req.session.collegeId = user.collegeId;
    req.session.absoluteExpiresAt = Date.now() + absoluteMs;
    req.session.csrfToken = randomBytes(32).toString('hex');
    req.session.jwtToken = sign(req, user);
    req.session.initializing = true;
    await save(req);
    res.setHeader('x-access-token', req.session.jwtToken);
    res.json({ token: req.session.jwtToken, csrfToken: req.session.csrfToken, user: await publicUser(user) });
}



