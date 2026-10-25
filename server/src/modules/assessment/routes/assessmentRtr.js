import { Router } from 'express';
import { requirePermission as can } from '../../../middleware/permission.middleware.js';
import * as assessments from '../controllers/assessmentCtrl.js';
import { numericIds } from '../../../utils/ids.js';

export const assessmentRoutes = numericIds(Router());
// Assessments. Editors (update permission) manage the question bank, assessments, windows and grading; students
// (view permission) take attempts. The models also check ownership: teachers only reach their own or their courses'.
assessmentRoutes.get('/assessments/options', can('assessments', 'update'), assessments.optionsCtrl);
assessmentRoutes.get('/assessments/questions', can('assessments', 'update'), assessments.listQuestionsCtrl);
assessmentRoutes.post('/assessments/questions', can('assessments', 'create'), assessments.createQuestionCtrl);
assessmentRoutes.patch('/assessments/questions/:questionId', can('assessments', 'update'), assessments.updateQuestionCtrl);
assessmentRoutes.delete('/assessments/questions/:questionId', can('assessments', 'delete'), assessments.deleteQuestionCtrl);
assessmentRoutes.get('/assessments/mine', can('assessments'), assessments.availableCtrl);
assessmentRoutes.get('/assessments', can('assessments', 'update'), assessments.listCtrl);
assessmentRoutes.post('/assessments', can('assessments', 'create'), assessments.createCtrl);
assessmentRoutes.get('/assessments/:id', can('assessments', 'update'), assessments.detailCtrl);
assessmentRoutes.patch('/assessments/:id', can('assessments', 'update'), assessments.updateCtrl);
assessmentRoutes.delete('/assessments/:id', can('assessments', 'delete'), assessments.removeCtrl);
assessmentRoutes.put('/assessments/:id/questions', can('assessments', 'update'), assessments.setQuestionsCtrl);
assessmentRoutes.post('/assessments/:id/windows', can('assessments', 'update'), assessments.saveWindowCtrl);
assessmentRoutes.patch('/assessments/:id/windows/:windowId', can('assessments', 'update'), assessments.saveWindowCtrl);
assessmentRoutes.delete('/assessments/:id/windows/:windowId', can('assessments', 'update'), assessments.removeWindowCtrl);
assessmentRoutes.post('/assessments/:id/status', can('assessments', 'update'), assessments.setStatusCtrl);
assessmentRoutes.post('/assessments/:id/results', can('assessments', 'update'), assessments.publishResultsCtrl);
assessmentRoutes.get('/assessments/:id/attempts', can('assessments', 'update'), assessments.attemptsCtrl);
assessmentRoutes.get('/attempts/:attemptId/review', can('assessments', 'update'), assessments.reviewCtrl);
assessmentRoutes.put('/attempts/:attemptId/answers/:questionId/grade', can('assessments', 'update'), assessments.gradeCtrl);
assessmentRoutes.post('/assessments/:id/attempts', can('assessments'), assessments.startCtrl);
assessmentRoutes.get('/attempts/:attemptId', can('assessments'), assessments.attemptCtrl);
assessmentRoutes.put('/attempts/:attemptId/answers/:questionId', can('assessments'), assessments.saveAnswerCtrl);
assessmentRoutes.post('/attempts/:attemptId/submit', can('assessments'), assessments.submitCtrl);
// Coding questions inside an attempt: run against samples, submit for marks, read a judged result.
assessmentRoutes.post('/attempts/:attemptId/questions/:questionId/run', can('assessments'), assessments.runCodeCtrl);
assessmentRoutes.post('/attempts/:attemptId/questions/:questionId/code', can('assessments'), assessments.submitCodeCtrl);
assessmentRoutes.get('/attempts/:attemptId/code/:submissionId', can('assessments'), assessments.codeResultCtrl);
