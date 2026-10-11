import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate, authenticateSessionCookie, requireCollege, originGuard, sessionMiddleware, noStore } from '../middleware/auth.middleware.js';
import { requirePermission as can } from '../middleware/permission.middleware.js';
import { notFound } from '../middleware/error.middleware.js';
import * as auth from '../controllers/auth.controller.js';
import * as platform from '../controllers/platform.controller.js';
import * as users from '../controllers/user.controller.js';
import * as courses from '../controllers/course.controller.js';
import * as access from '../controllers/access.controller.js';
import * as proxy from '../controllers/proxy.controller.js';
import * as files from '../controllers/file.controller.js';
import * as academics from '../controllers/academic.controller.js';
import * as courseImport from '../controllers/course-import.controller.js';
import * as auditLogs from '../controllers/audit.controller.js';
import * as coding from '../controllers/coding.controller.js';
import * as assessments from '../controllers/assessment.controller.js';

export const apiRoutes = Router();
apiRoutes.use(rateLimit({ windowMs: 60000, limit: 150 }));
apiRoutes.use(originGuard, sessionMiddleware);

// Public endpoints. Login/registration have a tighter rate limit.
const loginLimit = rateLimit({ windowMs: 900000, limit: 30 });
apiRoutes.get('/health', platform.health);
apiRoutes.use('/auth', noStore);
apiRoutes.post('/auth/register', loginLimit, auth.register);
apiRoutes.post('/auth/login', loginLimit, auth.login);
apiRoutes.post('/auth/forgot-password', loginLimit, auth.forgotPassword);
apiRoutes.post('/auth/reset-password', loginLimit, auth.resetPassword);
apiRoutes.get('/auth/college', auth.collegeName);
apiRoutes.get('/auth/session', auth.restoreSession);
apiRoutes.post('/auth/refresh', auth.refreshSession);
apiRoutes.post('/auth/logout', auth.logout);
// Unknown /auth URLs are public too: answer 404 rather than falling through to "Please sign in".
apiRoutes.all('/auth/*path', notFound);
// Lesson media for <video>/<iframe>: authenticated by the session cookie because media elements cannot send headers.
apiRoutes.get('/files/:id/content', authenticateSessionCookie, requireCollege, can('courses'), files.content);

// JWT + session authentication applies to every endpoint below.
// can(menuItemCode, action) checks app_rle_mnu_itm_rel_t; the same rows build the sidebar menu.
apiRoutes.use(authenticate);
apiRoutes.get('/me', platform.me);
apiRoutes.get('/menu', access.menu);
apiRoutes.get('/access/roles', can('access-control'), access.listRoles);
apiRoutes.get('/access/roles/:roleId/permissions', can('access-control'), access.rolePermissions);
apiRoutes.put('/access/roles/:roleId/permissions', can('access-control', 'update'), access.saveRolePermissions);
apiRoutes.get('/colleges', can('colleges'), platform.listColleges);
apiRoutes.get('/colleges/:id/members', can('colleges'), platform.collegeMembers);
apiRoutes.patch('/colleges/:id/members/:userId', can('colleges', 'update'), platform.updateCollegeMember);
apiRoutes.post('/colleges', can('colleges', 'create'), platform.createCollege);
apiRoutes.patch('/colleges/:id', can('colleges', 'update'), platform.updateCollege);
// Audit trail: own college for College Admins; chosen college or all colleges for Super Admin.
apiRoutes.get('/audit-logs', can('audit-log'), auditLogs.list);
// Allowlisted upstream services (PROXY_TARGETS); roles are configured per service.
apiRoutes.all('/proxy/:service{/*path}', proxy.forward);

// Platform admins can manage the shared library without a college context.
apiRoutes.use('/coding', (req, res, next) => req.identity.role === 'SUPER_ADMIN' ? next() : requireCollege(req, res, next));
// Coding practice. Running code is expensive, so run/submit have their own per-user limit.
const codeLimit = rateLimit({ windowMs: 60000, limit: 30, keyGenerator: req => req.identity.id, message: { message: 'Too many runs. Wait a minute and try again.' } });
apiRoutes.get('/coding/problems', can('coding'), coding.listProblems);
apiRoutes.get('/coding/problems/:id', can('coding'), coding.problem);
apiRoutes.post('/coding/problems/:id/run', requireCollege, can('coding', 'create'), codeLimit, coding.run);
apiRoutes.post('/coding/problems/:id/submit', requireCollege, can('coding', 'create'), codeLimit, coding.submit);
apiRoutes.get('/coding/submissions', requireCollege, can('coding'), coding.submissions);
// ?wait=1 holds the request until the judge has finished (up to 15 s), so clients need not poll rapidly.
apiRoutes.get('/coding/submissions/:id', requireCollege, can('coding'), coding.submission);
// Problem authoring: teachers manage their own problems, College Admins every problem of the college.
const canAuthor = action => (req, res, next) => can(req.identity.role === 'SUPER_ADMIN' ? 'coding-problems' : 'coding', action)(req, res, next);
apiRoutes.get('/coding/manage/options', canAuthor('view'), coding.editorOptions);
apiRoutes.get('/coding/queue', canAuthor('update'), coding.queue);
apiRoutes.get('/coding/manage', canAuthor('update'), coding.manageList);
apiRoutes.post('/coding/preview', canAuthor('update'), codeLimit, coding.previewCode);
apiRoutes.post('/coding/manage', canAuthor('create'), coding.createProblem);
apiRoutes.get('/coding/manage/:id', canAuthor('update'), coding.editorDetail);
apiRoutes.patch('/coding/manage/:id', canAuthor('update'), coding.updateProblem);
apiRoutes.delete('/coding/manage/:id', canAuthor('delete'), coding.deleteProblem);
apiRoutes.put('/coding/manage/:id/test-cases', canAuthor('update'), coding.saveTestCases);
apiRoutes.post('/coding/manage/:id/publish', canAuthor('update'), codeLimit, coding.publish);
apiRoutes.post('/coding/manage/:id/unpublish', canAuthor('update'), coding.unpublish);

// College context is mandatory for all college-owned resources.
apiRoutes.use(requireCollege);
apiRoutes.get('/users', can('people'), users.listUsers);
apiRoutes.get('/users/branch-options', can('people', 'update'), users.branchOptions);
apiRoutes.put('/users/:id/branches', can('people', 'update'), users.saveBranches);
apiRoutes.post('/users', can('people', 'create'), users.createUser);
apiRoutes.post('/users/:id/approve', can('people', 'update'), users.approveUser);
apiRoutes.delete('/users/:id', can('people', 'delete'), users.deactivateUser);
apiRoutes.put('/users/:id/profile', can('people', 'update'), users.saveProfile);
// Academic structure: :resource is academic-years, departments, programs, batches or cohorts.
apiRoutes.get('/academics/cohorts/:id/members', can('academics'), academics.members);
apiRoutes.post('/academics/cohorts/:id/members', can('academics', 'update'), academics.addMembers);
apiRoutes.delete('/academics/cohorts/:id/members/:userId', can('academics', 'update'), academics.removeMember);
apiRoutes.get('/academics/:resource', can('academics'), academics.list);
apiRoutes.post('/academics/:resource', can('academics', 'create'), academics.create);
apiRoutes.patch('/academics/:resource/:id', can('academics', 'update'), academics.update);
apiRoutes.delete('/academics/:resource/:id', can('academics', 'delete'), academics.remove);
apiRoutes.get('/courses', can('courses'), courses.listCourses);
apiRoutes.get('/courses/:id/syllabus/pdf', can('courses'), courses.syllabusPdf);
apiRoutes.get('/lessons/:id/content', can('courses'), courses.lessonContent);
apiRoutes.post('/courses', can('courses', 'create'), courses.createCourse);
apiRoutes.post('/courses/from-pdf', can('courses', 'create'), courseImport.createFromPdf);
apiRoutes.post('/courses/:id/rebuild-from-pdf', can('courses', 'update'), courseImport.rebuildFromPdf);
apiRoutes.patch('/courses/:id', can('courses', 'update'), courses.updateCourse);
apiRoutes.post('/courses/:id/modules', can('courses', 'update'), courses.createModule);
apiRoutes.patch('/courses/:id/modules/:moduleId', can('courses', 'update'), courses.updateModule);
apiRoutes.delete('/courses/:id/modules/:moduleId', can('courses', 'delete'), courses.deleteModule);
apiRoutes.post('/courses/:id/modules/:moduleId/lessons', can('courses', 'update'), courses.createLesson);
apiRoutes.patch('/courses/:id/modules/:moduleId/lessons/:lessonId', can('courses', 'update'), courses.updateLesson);
apiRoutes.delete('/courses/:id/modules/:moduleId/lessons/:lessonId', can('courses', 'delete'), courses.deleteLesson);
apiRoutes.post('/courses/:id/instructors', can('courses', 'update'), courses.addInstructor);
apiRoutes.delete('/courses/:id/instructors/:userId', can('courses', 'update'), courses.removeInstructor);
apiRoutes.post('/files', can('courses', 'update'), files.upload);
apiRoutes.post('/lessons/:id/complete', can('enrollments', 'update'), courses.completeLesson);
apiRoutes.post('/lessons/:id/progress', can('enrollments', 'update'), courses.saveProgress);
// Assessments. Editors (update permission) manage the question bank, assessments, windows and grading; students
// (view permission) take attempts. The models also check ownership: teachers only reach their own or their courses'.
apiRoutes.get('/assessments/options', can('assessments', 'update'), assessments.options);
apiRoutes.get('/assessments/questions', can('assessments', 'update'), assessments.listQuestions);
apiRoutes.post('/assessments/questions', can('assessments', 'create'), assessments.createQuestion);
apiRoutes.patch('/assessments/questions/:questionId', can('assessments', 'update'), assessments.updateQuestion);
apiRoutes.delete('/assessments/questions/:questionId', can('assessments', 'delete'), assessments.deleteQuestion);
apiRoutes.get('/assessments/mine', can('assessments'), assessments.available);
apiRoutes.get('/assessments', can('assessments', 'update'), assessments.list);
apiRoutes.post('/assessments', can('assessments', 'create'), assessments.create);
apiRoutes.get('/assessments/:id', can('assessments', 'update'), assessments.detail);
apiRoutes.patch('/assessments/:id', can('assessments', 'update'), assessments.update);
apiRoutes.delete('/assessments/:id', can('assessments', 'delete'), assessments.remove);
apiRoutes.put('/assessments/:id/questions', can('assessments', 'update'), assessments.setQuestions);
apiRoutes.post('/assessments/:id/windows', can('assessments', 'update'), assessments.saveWindow);
apiRoutes.patch('/assessments/:id/windows/:windowId', can('assessments', 'update'), assessments.saveWindow);
apiRoutes.delete('/assessments/:id/windows/:windowId', can('assessments', 'update'), assessments.removeWindow);
apiRoutes.post('/assessments/:id/status', can('assessments', 'update'), assessments.setStatus);
apiRoutes.post('/assessments/:id/results', can('assessments', 'update'), assessments.publishResults);
apiRoutes.get('/assessments/:id/attempts', can('assessments', 'update'), assessments.attempts);
apiRoutes.get('/attempts/:attemptId/review', can('assessments', 'update'), assessments.review);
apiRoutes.put('/attempts/:attemptId/answers/:questionId/grade', can('assessments', 'update'), assessments.grade);
apiRoutes.post('/assessments/:id/attempts', can('assessments'), assessments.start);
apiRoutes.get('/attempts/:attemptId', can('assessments'), assessments.attempt);
apiRoutes.put('/attempts/:attemptId/answers/:questionId', can('assessments'), assessments.saveAnswer);
apiRoutes.post('/attempts/:attemptId/submit', can('assessments'), assessments.submit);
// Coding questions inside an attempt: run against samples, submit for marks, read a judged result.
apiRoutes.post('/attempts/:attemptId/questions/:questionId/run', can('assessments'), assessments.runCode);
apiRoutes.post('/attempts/:attemptId/questions/:questionId/code', can('assessments'), assessments.submitCode);
apiRoutes.get('/attempts/:attemptId/code/:submissionId', can('assessments'), assessments.codeResult);
