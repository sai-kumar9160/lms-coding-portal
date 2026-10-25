import { z } from 'zod';
import { assessmentMdl } from '../models/assessmentMdl.js';
import { attemptMdl } from '../models/attemptMdl.js';
import { audit } from '../../../services/audit.service.js';
import { waitUntilJudged } from '../../coding/controllers/codingCtrl.js';
import { idSchema } from '../../../utils/ids.js';

const id = idSchema;
const optionalCourse = id.nullish().transform(value => value ?? null);
const flag = z.boolean().default(false).transform(value => value ? 1 : 0);
const option = z.object({ text: z.string().trim().min(1).max(500), isCorrect: z.boolean().default(false) });

// One shape for create and edit. Type-specific rules: choice questions need options (exactly one correct for
// single choice), true/false takes `correct`, numeric and short answers keep their key in answerKey.
const questionSchema = z.object({
    questionType: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'NUMERIC', 'SHORT_ANSWER', 'CODING']),
    codingProblemId: id.nullish(),
    stem: z.string().trim().min(3).max(5000),
    explanation: z.string().trim().max(5000).default(''),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    marks: z.number().positive().max(100).default(1),
    negativeMarks: z.number().min(0).max(100).default(0),
    topic: z.string().trim().max(100).default(''),
    courseId: optionalCourse,
    options: z.array(option).max(10).default([]),
    correct: z.boolean().optional(),
    answerKey: z.object({
        value: z.number().finite().optional(),
        tolerance: z.number().min(0).optional(),
        accepted: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
        caseSensitive: z.boolean().optional(),
    }).nullish(),
}).superRefine((q, ctx) => {
    const issue = (message, path = ['options']) => ctx.addIssue({ code: 'custom', message, path });
    const correct = q.options.filter(o => o.isCorrect).length;
    if (q.questionType === 'SINGLE_CHOICE' && (q.options.length < 2 || correct !== 1)) issue('Give at least 2 options and mark exactly one correct');
    if (q.questionType === 'MULTIPLE_CHOICE' && (q.options.length < 2 || correct < 1)) issue('Give at least 2 options and mark at least one correct');
    if (q.questionType === 'TRUE_FALSE' && q.correct === undefined) issue('Choose whether the statement is true or false', ['correct']);
    if (q.questionType === 'NUMERIC' && q.answerKey?.value === undefined) issue('Enter the correct number', ['answerKey']);
    if (q.questionType === 'CODING' && !q.codingProblemId) issue('Choose a coding problem', ['codingProblemId']);
}).transform(({ correct, ...q }) => {
    if (q.questionType === 'CODING')
        return { ...q, options: [], answerKey: null };
    q = { ...q, codingProblemId: null };
    if (q.questionType === 'TRUE_FALSE')
        return { ...q, answerKey: null, options: [{ text: 'True', isCorrect: correct }, { text: 'False', isCorrect: !correct }] };
    if (q.questionType === 'NUMERIC')
        return { ...q, options: [], answerKey: { value: q.answerKey.value, tolerance: q.answerKey.tolerance ?? 0 } };
    if (q.questionType === 'SHORT_ANSWER')
        return { ...q, options: [], answerKey: { accepted: q.answerKey?.accepted ?? [], caseSensitive: q.answerKey?.caseSensitive ?? false } };
    return { ...q, answerKey: null };
});

const assessmentSchema = z.object({
    title: z.string().trim().min(3).max(150),
    assessmentType: z.enum(['QUIZ', 'ASSIGNMENT', 'EXAM']).default('QUIZ'),
    instructions: z.string().trim().max(5000).default(''),
    courseId: optionalCourse,
    durationMin: z.number().int().min(1).max(600).nullish().transform(value => value ?? null),
    passPct: z.number().int().min(0).max(100).default(40),
    maxAttempts: z.number().int().min(1).max(20).default(1),
    attemptStrategy: z.enum(['BEST', 'LATEST']).default('BEST'),
    shuffleQuestions: flag,
    shuffleOptions: flag,
    resultVisibility: z.enum(['IMMEDIATE', 'AFTER_CLOSE', 'MANUAL']).default('IMMEDIATE'),
});
const questionsSchema = z.object({ items: z.array(z.object({ questionId: id, marksOverride: z.number().positive().max(100).nullish() })).max(200) });
const windowSchema = z.object({
    cohortId: z.number().int().positive().max(2147483647).nullish().transform(value => value ?? null),
    opensAt: z.coerce.date(),
    closesAt: z.coerce.date(),
    extraTimeMin: z.number().int().min(0).max(600).default(0),
}).refine(w => w.closesAt > w.opensAt, { message: 'The window must close after it opens', path: ['closesAt'] });
const statusSchema = z.object({ status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']) });
const gradeSchema = z.object({ marks: z.number().min(-100).max(100), feedback: z.string().trim().max(2000).default('') });
const answerSchema = z.object({ answer: z.union([z.null(), z.object({ optionId: id }), z.object({ optionIds: z.array(id).max(10) }), z.object({ value: z.number() }), z.object({ text: z.string().max(5000) })]) });
const listSchema = z.object({ courseId: id.optional(), type: z.string().optional(), search: z.string().max(100).optional() });

const ctx = req => [req.identity, req.collegeId];

// ---- Editors ----
export async function optionsCtrl(req, res) {
    res.json(await assessmentMdl.options(...ctx(req)));
}
export async function listQuestionsCtrl(req, res) {
    res.json(await assessmentMdl.listQuestions(...ctx(req), listSchema.parse(req.query)));
}
export async function createQuestionCtrl(req, res) {
    const after = await assessmentMdl.createQuestion(...ctx(req), questionSchema.parse(req.body));
    await audit(req, { action: 'create', entityType: 'question', entityId: after.id, after });
    res.status(201).json(after);
}
export async function updateQuestionCtrl(req, res) {
    const { before, after } = await assessmentMdl.updateQuestion(...ctx(req), req.params.questionId, questionSchema.parse(req.body));
    await audit(req, { action: 'update', entityType: 'question', entityId: after.id, before, after });
    res.json(after);
}
export async function deleteQuestionCtrl(req, res) {
    const before = await assessmentMdl.deleteQuestion(...ctx(req), req.params.questionId);
    await audit(req, { action: 'delete', entityType: 'question', entityId: before.id, before });
    res.json({ success: true });
}
export async function listCtrl(req, res) {
    res.json(await assessmentMdl.list(...ctx(req)));
}
export async function detailCtrl(req, res) {
    res.json(await assessmentMdl.detail(...ctx(req), req.params.id));
}
export async function createCtrl(req, res) {
    const after = await assessmentMdl.create(...ctx(req), assessmentSchema.parse(req.body));
    await audit(req, { action: 'create', entityType: 'assessment', entityId: after.id, after });
    res.status(201).json(after);
}
export async function updateCtrl(req, res) {
    const { before, after } = await assessmentMdl.update(...ctx(req), req.params.id, assessmentSchema.parse(req.body));
    await audit(req, { action: 'update', entityType: 'assessment', entityId: after.id, before, after });
    res.json(after);
}
export async function removeCtrl(req, res) {
    const before = await assessmentMdl.remove(...ctx(req), req.params.id);
    await audit(req, { action: 'delete', entityType: 'assessment', entityId: before.id, before });
    res.json({ success: true });
}
export async function setQuestionsCtrl(req, res) {
    const { items } = questionsSchema.parse(req.body);
    const after = await assessmentMdl.setQuestions(...ctx(req), req.params.id, items);
    await audit(req, { action: 'set_questions', entityType: 'assessment', entityId: req.params.id, after: { items } });
    res.json(after);
}
export async function saveWindowCtrl(req, res) {
    const after = await assessmentMdl.saveWindow(...ctx(req), req.params.id, req.params.windowId ?? null, windowSchema.parse(req.body));
    await audit(req, { action: req.params.windowId ? 'update_window' : 'create_window', entityType: 'assessment', entityId: req.params.id, after });
    res.status(req.params.windowId ? 200 : 201).json(after);
}
export async function removeWindowCtrl(req, res) {
    const result = await assessmentMdl.removeWindow(...ctx(req), req.params.id, req.params.windowId);
    await audit(req, { action: 'delete_window', entityType: 'assessment', entityId: req.params.id, before: { windowId: req.params.windowId } });
    res.json(result);
}
export async function setStatusCtrl(req, res) {
    const { status } = statusSchema.parse(req.body);
    const { before, after } = await assessmentMdl.setStatus(...ctx(req), req.params.id, status);
    await audit(req, { action: 'set_status', entityType: 'assessment', entityId: req.params.id, before, after });
    res.json(after);
}
export async function publishResultsCtrl(req, res) {
    const published = z.object({ published: z.boolean() }).parse(req.body).published;
    const result = await assessmentMdl.publishResults(...ctx(req), req.params.id, published);
    await audit(req, { action: published ? 'publish_results' : 'hide_results', entityType: 'assessment', entityId: req.params.id });
    res.json(result);
}
export async function attemptsCtrl(req, res) {
    res.json(await assessmentMdl.attempts(...ctx(req), req.params.id));
}
export async function reviewCtrl(req, res) {
    res.json(await assessmentMdl.review(...ctx(req), req.params.attemptId));
}
export async function gradeCtrl(req, res) {
    const result = await assessmentMdl.grade(...ctx(req), req.params.attemptId, req.params.questionId, gradeSchema.parse(req.body));
    await audit(req, { action: 'grade', entityType: 'attempt', entityId: req.params.attemptId, before: result.before, after: result.after });
    res.json(result.totals);
}

// ---- Students ----
export async function availableCtrl(req, res) {
    res.json(await attemptMdl.available(...ctx(req)));
}
export async function startCtrl(req, res) {
    const { resumed, attempt } = await attemptMdl.start(...ctx(req), req.params.id);
    if (!resumed) await audit(req, { action: 'start', entityType: 'attempt', entityId: attempt.id, after: { assessmentId: req.params.id, attemptNo: attempt.attemptNo, expiresAt: attempt.expiresAt } });
    res.status(resumed ? 200 : 201).json(attempt);
}
export async function attemptCtrl(req, res) {
    res.json(await attemptMdl.get(...ctx(req), req.params.attemptId));
}
export async function saveAnswerCtrl(req, res) {
    const { answer } = answerSchema.parse(req.body);
    res.json(await attemptMdl.saveAnswer(...ctx(req), req.params.attemptId, req.params.questionId, answer));
}
const codeSchema = z.object({ language: z.string().min(1).max(20), code: z.string().min(1, 'Write some code first').max(65536), customInput: z.string().max(1024 * 1024).optional() });
export async function runCodeCtrl(req, res) {
    res.status(202).json(await attemptMdl.runCode(...ctx(req), req.params.attemptId, req.params.questionId, codeSchema.parse(req.body)));
}
export async function submitCodeCtrl(req, res) {
    const { language, code } = codeSchema.parse(req.body);
    res.status(202).json(await attemptMdl.submitCode(...ctx(req), req.params.attemptId, req.params.questionId, { language, code }));
}
export async function codeResultCtrl(req, res) {
    res.json(await waitUntilJudged(() => attemptMdl.codeResult(...ctx(req), req.params.attemptId, req.params.submissionId), Boolean(req.query.wait)));
}
export async function submitCtrl(req, res) {
    const result = await attemptMdl.submit(...ctx(req), req.params.attemptId);
    await audit(req, { action: 'submit', entityType: 'attempt', entityId: req.params.attemptId, after: { status: result.status } });
    res.json(result);
}
