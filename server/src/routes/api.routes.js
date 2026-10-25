import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate, requireCollege, originGuard, sessionMiddleware } from '../middleware/auth.middleware.js';
import { authRoutes } from '../modules/auth/routes/authRtr.js';
import { healthRoutes, platformRoutes } from '../modules/platform/routes/platformRtr.js';
import { fileMediaRoutes, fileRoutes } from '../modules/file/routes/fileRtr.js';
import { accessRoutes } from '../modules/access/routes/accessRtr.js';
import { auditRoutes } from '../modules/audit/routes/auditRtr.js';
import { proxyRoutes } from '../modules/proxy/routes/proxyRtr.js';
import { codingRoutes } from '../modules/coding/routes/codingRtr.js';
import { userRoutes } from '../modules/user/routes/userRtr.js';
import { academicRoutes } from '../modules/academic/routes/academicRtr.js';
import { courseRoutes } from '../modules/course/routes/courseRtr.js';
import { assessmentRoutes } from '../modules/assessment/routes/assessmentRtr.js';
import { performanceRoutes } from '../modules/performance/routes/performanceRtr.js';

// Every feature lives in src/modules/<feature>/{controllers,models,routes}. The order below matters:
// public routes first, then the JWT + session check, then (for college-owned data) the college check.
export const apiRoutes = Router();
apiRoutes.use(rateLimit({ windowMs: 60000, limit: 150 }));
apiRoutes.use(originGuard, sessionMiddleware);

// Public endpoints.
apiRoutes.use(healthRoutes, authRoutes, fileMediaRoutes);

// JWT + session authentication applies to every endpoint below.
// can(menuItemCode, action) checks app_rle_mnu_itm_rel_t; the same rows build the sidebar menu.
apiRoutes.use(authenticate);
apiRoutes.use(platformRoutes, accessRoutes, auditRoutes, proxyRoutes, codingRoutes);

// College context is mandatory for all college-owned resources.
apiRoutes.use(requireCollege);
apiRoutes.use(userRoutes, academicRoutes, courseRoutes, fileRoutes, assessmentRoutes, performanceRoutes);
