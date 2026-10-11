import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authModel, RESET_LINK_MINUTES } from '../models/auth.model.js';
import { sendMail } from '../services/mail.service.js';
import { audit } from '../services/audit.service.js';
import { allowedOrigins, isAllowedOrigin } from '../../config/cors.config.js';
import { createLogger } from '../utils/logger.js';
import { fail } from '../utils/http-error.js';

const log = createLogger('auth.controller');
import { establishSession, sessionUser, checkCsrf, sign, save, cookieName, cookieOptions, publicUser } from '../services/session.service.js';
export const mobileSchema = z.string().trim().transform(value => value.replace(/[\s()-]/g, '')).pipe(z.string().regex(/^\+?[0-9]{8,15}$/, 'Enter a valid mobile number (8-15 digits, optional + country code)'));
const email = z.string().trim().email().transform(value => value.toLowerCase());
const registerSchema = z.object({ name: z.string().trim().min(2).max(100), email, mobileNo: mobileSchema, password: z.string().min(10).max(100), role: z.enum(['STUDENT', 'TEACHER']), college: z.string().trim().min(2).max(50), branchGroupId: z.coerce.number().int().positive().max(2147483647).optional() }).superRefine((data, ctx) => {
    if (data.role === 'STUDENT' && !data.branchGroupId) ctx.addIssue({ code: 'custom', path: ['branchGroupId'], message: 'Choose your branch' });
});
function resolveCollege(req, input) {
    const host = req.hostname.endsWith('.localhost') ? req.hostname.split('.')[0] : null;
    if (host && input && input !== host)
        fail(401, 'College does not match hostname');
    return host || input;
}
export async function collegeName(req, res) {
    const code = z.string().trim().min(2).max(50).parse(req.query.code);
    const college = await authModel.college(resolveCollege(req, code));
    if (!college)
        fail(404, 'College code not found or unavailable');
    res.json({ code: college.slug, name: college.name, branches: await authModel.branches(college.id) });
}
export async function register(req, res) {
    const input = registerSchema.parse(req.body);
    const college = await authModel.college(resolveCollege(req, input.college));
    if (!college)
        fail(400, 'College unavailable. Enter an active college code');
    const { college: _code, ...data } = input;
    const user = await authModel.register({ ...data, collegeId: college.id });
    const message = user.status === 'PENDING' ? 'Registration submitted. Your college admin must approve your teacher account before you can sign in.' : 'Registration successful. Please sign in.';
    res.status(201).json({ message, user: { id: user.id, name: user.name, email: user.email, mobileNo: user.mobileNo, role: user.role, roleId: user.roleId, status: user.status } });
}
export async function login(req, res) {
    const input = z.object({ email, password: z.string().min(1).max(100), college: z.string().trim().optional() }).parse(req.body);
    const slug = resolveCollege(req, input.college);
    const college = slug ? await authModel.college(slug) : null;
    if (slug && !college)
        fail(401, 'College unavailable');
    const user = await authModel.loginUser(input.email, college?.id ?? null);
    // Without a college, only platform admins can sign in.
    if (!slug && !user)
        fail(400, 'Please enter college code');
    if (!user || !await bcrypt.compare(input.password, user.password))
        fail(401, 'Invalid email or password');
    // Checked after the password so account status is not revealed to guessers.
    if (user.status !== 'ACTIVE')
        fail(403, 'Your account is awaiting approval from your college admin');
    await establishSession(req, res, user);
}

// Reset links open the same frontend the request came from (for example alpha.localhost), else APP_URL.
const appOrigin = (req) => isAllowedOrigin(req.get('origin')) ? req.get('origin') : (process.env.APP_URL || allowedOrigins[0]);

// Always answers the same way, so it cannot be used to find out which emails have accounts.
export async function forgotPassword(req, res) {
    const input = z.object({ email, college: z.string().trim().max(50).optional() }).parse(req.body);
    const slug = resolveCollege(req, input.college || undefined);
    const college = slug ? await authModel.college(slug) : null;
    const user = !slug || college ? await authModel.loginUser(input.email, college?.id ?? null) : null;
    const token = user ? await authModel.createPasswordReset(user, req.ip) : null;
    if (token) {
        const link = `${appOrigin(req)}/reset-password?token=${encodeURIComponent(token)}`;
        log.info('Password reset requested', { userId: user.id, requestId: req.id });
        // Not awaited: a slow mail server must not make existing accounts answer more slowly.
        sendMail({
            to: user.email,
            subject: 'Reset your Campus password',
            text: `Hello ${user.name},\n\nUse this link to choose a new password. It expires in ${RESET_LINK_MINUTES} minutes and works once:\n\n${link}\n\nIf you did not ask for this, ignore this email; your password stays the same.`,
        }).catch(error => log.error('Password reset email failed', { userId: user.id, error: error.message }));
    }
    res.json({ message: `If an account matches, a reset link has been sent to its email. The link expires in ${RESET_LINK_MINUTES} minutes.` });
}

export async function resetPassword(req, res) {
    const input = z.object({ token: z.string().min(20).max(200), password: z.string().min(10).max(100) }).parse(req.body);
    const { userId, collegeId } = await authModel.resetPassword(input.token, input.password);
    log.info('Password reset completed', { userId, requestId: req.id });
    await audit(req, { action: 'password_reset', entityType: 'user', entityId: userId, actorId: userId, collegeId });
    res.json({ message: 'Password updated. Sign in with your new password.' });
}

export async function restoreSession(req, res) {
    const user = await sessionUser(req);
    res.json({ token: req.session.jwtToken, csrfToken: req.session.csrfToken, user: await publicUser(user) });
}

export async function refreshSession(req, res) {
    const user = await sessionUser(req);
    checkCsrf(req);
    req.session.jwtToken = sign(req, user);
    await save(req);
    res.setHeader('x-access-token', req.session.jwtToken);
    res.json({ token: req.session.jwtToken, csrfToken: req.session.csrfToken });
}

export async function logout(req, res) {
    if (req.session.userId)
        checkCsrf(req);
    await new Promise((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
    res.clearCookie(cookieName, cookieOptions);
    res.json({ success: true });
}
