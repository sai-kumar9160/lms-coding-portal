import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { noStore } from '../../../middleware/auth.middleware.js';
import { notFound } from '../../../middleware/error.middleware.js';
import * as auth from '../controllers/authCtrl.js';
import { numericIds } from '../../../utils/ids.js';

// Public endpoints (mounted before the JWT check). Login/registration have a tighter rate limit.
export const authRoutes = numericIds(Router());
const loginLimit = rateLimit({ windowMs: 900000, limit: 30 });
authRoutes.use('/auth', noStore);
authRoutes.post('/auth/register', loginLimit, auth.registerCtrl);
authRoutes.post('/auth/login', loginLimit, auth.loginCtrl);
authRoutes.post('/auth/forgot-password', loginLimit, auth.forgotPasswordCtrl);
authRoutes.post('/auth/reset-password', loginLimit, auth.resetPasswordCtrl);
authRoutes.get('/auth/college', auth.collegeNameCtrl);
authRoutes.get('/auth/session', auth.restoreSessionCtrl);
authRoutes.post('/auth/refresh', auth.refreshSessionCtrl);
authRoutes.post('/auth/logout', auth.logoutCtrl);
// Unknown /auth URLs are public too: answer 404 rather than falling through to "Please sign in".
authRoutes.all('/auth/*path', notFound);
