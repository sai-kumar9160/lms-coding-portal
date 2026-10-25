import { Router } from 'express';
import { fail } from '../../../utils/http-error.js';
import * as performance from '../controllers/performanceCtrl.js';
import { numericIds } from '../../../utils/ids.js';

export const performanceRoutes = numericIds(Router());
// A student's own performance and rank in their college.
performanceRoutes.get('/me/performance', (req, _res, next) => (req.identity.role === 'STUDENT' ? next() : fail(403, 'Performance is for students')), performance.myPerformanceCtrl);
