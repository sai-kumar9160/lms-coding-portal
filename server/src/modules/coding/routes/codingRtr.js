import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireCollege } from '../../../middleware/auth.middleware.js';
import { requirePermission as can } from '../../../middleware/permission.middleware.js';
import { isPlatformRole } from '../../../utils/enums.js';
import * as coding from '../controllers/codingCtrl.js';
import { numericIds } from '../../../utils/ids.js';

export const codingRoutes = numericIds(Router());
// Platform accounts (Super Admin, Vendor) can manage the shared library without a college context.
codingRoutes.use('/coding', (req, res, next) => isPlatformRole(req.identity.role) ? next() : requireCollege(req, res, next));
// Coding practice. Running code is expensive, so run/submit have their own per-user limit.
const codeLimit = rateLimit({ windowMs: 60000, limit: 30, keyGenerator: req => req.identity.id, message: { message: 'Too many runs. Wait a minute and try again.' } });
codingRoutes.get('/coding/problems', can('coding'), coding.listProblemsCtrl);
codingRoutes.get('/coding/problems/:id', can('coding'), coding.problemCtrl);
codingRoutes.post('/coding/problems/:id/run', requireCollege, can('coding', 'create'), codeLimit, coding.runCtrl);
codingRoutes.post('/coding/problems/:id/submit', requireCollege, can('coding', 'create'), codeLimit, coding.submitCtrl);
codingRoutes.get('/coding/submissions', requireCollege, can('coding'), coding.submissionsCtrl);
// ?wait=1 holds the request until the judge has finished (up to 15 s), so clients need not poll rapidly.
codingRoutes.get('/coding/submissions/:id', requireCollege, can('coding'), coding.submissionCtrl);
// Problem authoring: teachers manage their own problems, College Admins every problem of the college.
const canAuthor = action => (req, res, next) => can(isPlatformRole(req.identity.role) ? 'coding-problems' : 'coding', action)(req, res, next);
codingRoutes.get('/coding/manage/options', canAuthor('view'), coding.editorOptionsCtrl);
codingRoutes.get('/coding/queue', canAuthor('update'), coding.queueCtrl);
codingRoutes.get('/coding/manage', canAuthor('update'), coding.manageListCtrl);
codingRoutes.post('/coding/preview', canAuthor('update'), codeLimit, coding.previewCodeCtrl);
codingRoutes.post('/coding/manage', canAuthor('create'), coding.createProblemCtrl);
codingRoutes.get('/coding/manage/:id', canAuthor('update'), coding.editorDetailCtrl);
codingRoutes.patch('/coding/manage/:id', canAuthor('update'), coding.updateProblemCtrl);
codingRoutes.delete('/coding/manage/:id', canAuthor('delete'), coding.deleteProblemCtrl);
codingRoutes.put('/coding/manage/:id/test-cases', canAuthor('update'), coding.saveTestCasesCtrl);
codingRoutes.post('/coding/manage/:id/publish', canAuthor('update'), codeLimit, coding.publishCtrl);
codingRoutes.post('/coding/manage/:id/unpublish', canAuthor('update'), coding.unpublishCtrl);
