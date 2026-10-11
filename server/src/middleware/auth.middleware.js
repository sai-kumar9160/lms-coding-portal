import jwt from 'jsonwebtoken';
import { jwtSecret, jwtOptions, identitySchema, sessionUser, checkCsrf } from '../services/session.service.js';
import { isAllowedOrigin } from '../../config/cors.config.js';
import { platformModel } from '../models/platform.model.js';
import { fail, notFound } from '../utils/http-error.js';
export { sessionMiddleware } from '../services/session.service.js';

// College switcher: a Super Admin works inside one college by sending its ID (x-college-id header, or
// ?college= for media URLs). Other roles' requests are always bound to their own college; their header is ignored.
// Every request made this way is logged with actingAsSuperAdmin by the request logger.
async function actInCollege(req, role, requested) {
    if (role !== 'SUPER_ADMIN' || !requested)
        return;
    if (typeof requested !== 'string' || !/^[1-9][0-9]*$/.test(requested) || !Number.isSafeInteger(Number(requested)) || Number(requested) > 2147483647)
        fail(400, 'Invalid college');
    if (!await platformModel.switchableCollege(Number(requested)))
        notFound('College');
    req.collegeId = Number(requested);
    req.actingAsSuperAdmin = true;
}
export function originGuard(req, _res, next) {
    if (req.headers.origin && !isAllowedOrigin(req.headers.origin))
        fail(403, 'Origin not allowed');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers['sec-fetch-site'] === 'cross-site')
        fail(403, 'Cross-site request blocked');
    next();
}

export async function authenticate(req, res, next) {
    const token = req.get('x-access-token') || req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token)
        fail(401, 'Please sign in');
    let identity;
    try {
        identity = identitySchema.parse(jwt.verify(token, jwtSecret, { algorithms: ['HS256'], issuer: jwtOptions.issuer, audience: jwtOptions.audience, subject: jwtOptions.subject }));
    }
    catch (error) {
        fail(401, error instanceof jwt.TokenExpiredError ? 'Access token expired' : 'Invalid access token');
    }
    if (req.session.jwtToken !== token || identity.sid !== req.sessionID || identity.id !== req.session.userId)
        fail(401, 'Session does not match token');
    const user = await sessionUser(req);
    if (user.role !== identity.role || user.collegeId !== identity.collegeId)
        fail(401, 'Session invalid');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method))
        checkCsrf(req);
    req.identity = identity;
    if (user.collegeId)
        req.collegeId = user.collegeId;
    await actInCollege(req, user.role, req.get('x-college-id'));
    res.setHeader('Cache-Control', 'no-store');
    next();
}

// For <video> and <iframe> requests, which cannot send x-access-token: the HttpOnly, SameSite=Lax
// session cookie alone authenticates. Read-only (GET/HEAD) routes only; it does not check CSRF.
export async function authenticateSessionCookie(req, _res, next) {
    if (!['GET', 'HEAD'].includes(req.method))
        fail(405, 'Method not allowed');
    const user = await sessionUser(req);
    req.identity = { id: user.id, role: user.role, collegeId: user.collegeId };
    if (user.collegeId)
        req.collegeId = user.collegeId;
    await actInCollege(req, user.role, req.query.college);
    next();
}

export function requireCollege(req, _res, next) {
 if (!req.collegeId) fail(403, 'Sign in to a college account to use college features');
 next();
}
export function noStore(_req, res, next) { res.setHeader('Cache-Control', 'no-store'); next(); }
