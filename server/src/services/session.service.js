import session from 'express-session';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { db } from '../../config/db.config.js';
import { fail } from '../utils/http-error.js';
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
export const identitySchema = z.object({ id: z.string().uuid(), role: z.nativeEnum(Role), collegeId: z.number().int().positive().nullable(), sid: z.string(), exp: z.number(), iat: z.number() });
function expiry(data) {
    return new Date(Math.min(data.cookie.expires ? new Date(data.cookie.expires).getTime() : Date.now() + idleMs, data.absoluteExpiresAt || Date.now() + idleMs));
}
export class PrismaSessionStore extends session.Store {
    get(sid, callback) {
        db.session.findUnique({ where: { sid } }).then(async (row) => {
            if (!row || row.activeIndicator !== 1)
                return callback(null, null);
            if (row.expiresAt.getTime() <= Date.now()) {
                await db.session.deleteMany({ where: { sid } });
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
        const value = { data: JSON.stringify(data), userId: data.userId || null, expiresAt: expiry(data) };
        // Only login creates a session. A delayed request cannot recreate a logged-out session.
        const operation = initializing ? db.session.create({ data: { sid, ...value, createdBy: data.userId } }) : db.session.updateMany({ where: { sid, activeIndicator: 1, expiresAt: { gt: new Date() } }, data: { ...value, updatedBy: data.userId } }).then(result => { if (!result.count)
            fail(401, 'Session no longer active'); });
        operation.then(() => callback()).catch(callback);
    }
    destroy(sid, callback = () => { }) { db.session.deleteMany({ where: { sid } }).then(() => callback()).catch(callback); }
    touch(sid, data, callback = () => { }) {
        db.session.updateMany({ where: { sid, activeIndicator: 1, expiresAt: { gt: new Date() } }, data: { expiresAt: expiry(data), updatedBy: data.userId } }).then(() => callback()).catch(callback);
    }
}
export const sessionMiddleware = session({ name: cookieName, secret: sessionSecret, store: new PrismaSessionStore(), resave: false, saveUninitialized: false, rolling: true, cookie: { ...cookieOptions, maxAge: idleMs } });
export function checkCsrf(req) { if (!req.session.csrfToken || req.get('x-csrf-token') !== req.session.csrfToken)
    fail(403, 'CSRF validation failed'); }
export async function sessionUser(req) {
    if (!req.session.userId || !req.session.absoluteExpiresAt || req.session.absoluteExpiresAt <= Date.now())
        fail(401, 'Session expired. Please sign in again');
    const user = await db.user.findUnique({ where: { id: req.session.userId, roleDefinition: { activeIndicator: 1 } } });
    if (!user || user.activeIndicator !== 1 || user.status !== 'ACTIVE' || user.collegeId !== req.session.collegeId)
        fail(401, 'Session invalid');
    if (user.collegeId) {
        const college = await db.college.findUnique({ where: { id: user.collegeId } });
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
    const branches = u.role === Role.STUDENT ? (await db.cohortMember.findMany({ where: { userId: u.id, collegeId: u.collegeId, activeIndicator: 1, cohort: { activeIndicator: 1, archived: 0 } }, select: { cohort: { select: { id: true, name: true } } } })).map(row => row.cohort) : [];
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



