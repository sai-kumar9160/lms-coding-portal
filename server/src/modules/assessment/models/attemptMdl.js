import { db } from '../../../../config/db.config.js';
import { fail, notFound } from '../../../utils/http-error.js';
import { gradeAnswer, totalAttempt } from '../../../services/grading.service.js';
import { assessmentLinks, pointsOf, withQuestionParts } from './assessmentMdl.js';
import { createLogger } from '../../../utils/logger.js';
import { enqueue, onJudged } from '../../../services/judge.service.js';
import { checkLanguage, presentSubmission, publicProblem } from '../../coding/models/codingMdl.js';

const log = createLogger('attempts');
// Saves arriving this long after expiry (network delay) are still accepted.
const GRACE_MS = 5000;

function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

const MAX_CODE_SUBMISSIONS = 20;
const round = value => Math.round(value * 100) / 100;

const attemptById = (client, id) => client.one(`SELECT a.atmpt_id AS "id", a.college_id AS "collegeId", a.asmt_id AS "assessmentId", a.asmt_wndw_id AS "windowId",
            a.user_id AS "userId", a.atmpt_no AS "attemptNo", a.status_cd AS "status", a.started_ts AS
            "startedAt", a.expires_ts AS "expiresAt", a.submitted_ts AS "submittedAt", a.layout_json AS
            "layout", a.score_ct AS "score", a.max_score_ct AS "maxScore", a.is_passed_in AS "isPassed",
            a.needs_grading_in AS "needsGrading", a.i_ts AS "createdAt", a.u_ts AS "updatedAt" FROM atmpt_dtl_t a WHERE a.atmpt_id = $1`, [id]);
const answersOf = (client, attemptId) => client.many(`SELECT w.atmpt_ans_id AS "id", w.atmpt_id AS "attemptId", w.qstn_id AS "questionId", w.answer_json AS "answer",
            w.is_correct_in AS "isCorrect", w.marks_awarded_ct AS "marksAwarded", w.feedback_tx AS "feedback",
            w.evaluated_by AS "evaluatedBy", w.evaluated_ts AS "evaluatedAt", w.saved_ts AS "savedAt" FROM atmpt_ans_dtl_t w WHERE w.atmpt_id = $1`, [attemptId]);
const assessmentById = (client, id) => client.one(`SELECT x.asmt_id AS "id", x.college_id AS "collegeId", x.course_id AS "courseId", x.asmt_type_cd AS "assessmentType",
            x.asmt_ttl AS "title", x.instructions_tx AS "instructions", x.duration_min_ct AS "durationMin",
            x.pass_pct AS "passPct", x.max_attempts_ct AS "maxAttempts", x.attempt_strategy_cd AS
            "attemptStrategy", x.shuffle_qstn_in AS "shuffleQuestions", x.shuffle_optn_in AS "shuffleOptions",
            x.result_visibility_cd AS "resultVisibility", x.results_published_in AS "resultsPublished",
            x.status_cd AS "status", x.i_ts AS "createdAt", x.u_ts AS "updatedAt", x.crte_usr_id AS
            "createdBy", x.updte_usr_id AS "updatedBy", x.a_in AS "activeIndicator", x.d_ts AS "deletedAt" FROM asmt_lst_t x WHERE x.asmt_id = $1`, [id]);
const submissionOf = (client, id) => client.one(`SELECT s.cdng_sbmsn_id AS "id", s.college_id AS "collegeId", s.user_id AS "userId", s.cdng_prblm_id AS "problemId",
            s.kind_cd AS "kind", s.job_status_cd AS "jobStatus", s.lang_cd AS "language", s.code_tx AS "code",
            s.custom_input_tx AS "customInput", s.status_cd AS "status", s.passed_ct AS "passedCount",
            s.total_ct AS "totalCount", s.score_ct AS "score", s.max_score_ct AS "maxScore", s.runtime_ms_ct
            AS "runtimeMs", s.results_json AS "results", s.limits_json AS "limits", s.atmpt_id AS "attemptId",
            s.qstn_id AS "questionId", s.tries_ct AS "tries", s.worker_tx AS "worker", s.started_ts AS
            "startedAt", s.judged_ts AS "judgedAt", s.i_ts AS "createdAt" FROM cdng_sbmsn_dtl_t s WHERE s.cdng_sbmsn_id = $1`, [id]);
// Stores the attempt's score, pass state and whether a teacher still has to grade something.
const saveTotals = (attemptId, totals) => db.run(
    'UPDATE atmpt_dtl_t SET score_ct = $2, needs_grading_in = $3, is_passed_in = $4 WHERE atmpt_id = $1', [attemptId, totals.score, totals.needsGrading, totals.isPassed]);
// Stores (or replaces) the graded values of one answer; the student's saved answer itself is left alone.
const saveGrade = (client, attemptId, questionId, { isCorrect, marks }) => client.run(
    `INSERT INTO atmpt_ans_dtl_t (atmpt_ans_id, atmpt_id, qstn_id, is_correct_in, marks_awarded_ct) VALUES (DEFAULT, $1, $2, $3, $4)
     ON CONFLICT (atmpt_id, qstn_id) DO UPDATE SET is_correct_in = $3, marks_awarded_ct = $4`, [attemptId, questionId, isCorrect, marks]);

// Marks for a coding question: the best judged submission of this attempt scales the question's points.
// Still judging, or only internal errors: null (pending; the judged hook below fills it in).
async function codingMarks(attemptId, questionId, points) {
    const subs = await db.many(`SELECT s.job_status_cd AS "jobStatus", s.score_ct AS "score", s.max_score_ct AS "maxScore", s.status_cd AS "status" FROM cdng_sbmsn_dtl_t s WHERE s.atmpt_id = $1 AND s.qstn_id = $2 AND s.kind_cd = 'SUBMIT'`, [attemptId, questionId]);
    if (!subs.length) return { isCorrect: 0, marks: 0 };
    if (subs.some(s => s.jobStatus === 'QUEUED' || s.jobStatus === 'RUNNING')) return { isCorrect: null, marks: null };
    const done = subs.filter(s => s.jobStatus === 'DONE');
    if (!done.length) return { isCorrect: null, marks: null };
    const ratio = s => (s.score ?? 0) / (s.maxScore || 1);
    const best = done.reduce((b, s) => (ratio(s) > ratio(b) ? s : b));
    return { isCorrect: best.status === 'ACCEPTED' ? 1 : 0, marks: round(points * ratio(best)) };
}

// Windows of the assessment that apply to this student: everyone (no cohort) or a cohort they belong to.
async function studentWindows(userId, assessmentId) {
    const cohorts = (await db.many('SELECT chrt_id AS "cohortId" FROM chrt_mbr_rel_t WHERE user_id = $1 AND a_in = 1', [userId])).map(m => m.cohortId);
    return db.many(
        `SELECT w.asmt_wndw_id AS "id", w.asmt_id AS "assessmentId", w.chrt_id AS "cohortId", w.opens_ts AS "opensAt",
            w.closes_ts AS "closesAt", w.extra_time_min_ct AS "extraTimeMin", w.i_ts AS "createdAt", w.u_ts AS
            "updatedAt", w.crte_usr_id AS "createdBy", w.updte_usr_id AS "updatedBy", w.a_in AS
            "activeIndicator", w.d_ts AS "deletedAt" FROM asmt_wndw_lst_t w
         WHERE w.asmt_id = $1 AND w.a_in = 1 AND (w.chrt_id IS NULL OR w.chrt_id = ANY($2::int[])) ORDER BY w.opens_ts ASC`, [assessmentId, cohorts]);
}

// When a student may see marks and correct answers.
function resultsVisible(assessment, window, now = new Date()) {
    if (assessment.resultVisibility === 'IMMEDIATE') return true;
    if (assessment.resultVisibility === 'AFTER_CLOSE') return window.closesAt <= now || assessment.status === 'CLOSED';
    return assessment.resultsPublished === 1;
}

// Grades and closes an attempt once. Safe to call twice: only the call that changes IN_PROGRESS does the work.
async function finalise(attemptId, status) {
    const claimed = await db.run(`UPDATE atmpt_dtl_t SET status_cd = $2, submitted_ts = $3 WHERE atmpt_id = $1 AND status_cd = 'IN_PROGRESS'`, [attemptId, status, new Date()]);
    if (!claimed) return false;
    const attempt = await attemptById(db, attemptId);
    const [answers, assessment] = await Promise.all([answersOf(db, attemptId), assessmentById(db, attempt.assessmentId)]);
    const links = new Map((await assessmentLinks(db, [assessment.id])).map(q => [q.questionId, q]));
    const saved = new Map(answers.map(a => [a.questionId, a]));
    const graded = [];
    for (const { questionId } of attempt.layout) {
        const link = links.get(questionId);
        if (!link) continue;
        const result = link.question.questionType === 'CODING'
            ? await codingMarks(attemptId, questionId, pointsOf(link))
            : gradeAnswer(link.question, pointsOf(link), saved.get(questionId)?.answer);
        graded.push(result);
        await saveGrade(db, attemptId, questionId, result);
    }
    await saveTotals(attemptId, totalAttempt(graded, attempt.maxScore, assessment.passPct));
    return true;
}

async function closeIfExpired(attempt) {
    if (attempt.status === 'IN_PROGRESS' && attempt.expiresAt.getTime() + GRACE_MS < Date.now()) {
        await finalise(attempt.id, 'AUTO_SUBMITTED');
        return true;
    }
    return false;
}

// Auto-submits attempts whose time ran out (students who closed the browser). Run every minute.
export async function sweepExpired() {
    const expired = await db.many(`SELECT atmpt_id AS id FROM atmpt_dtl_t WHERE status_cd = 'IN_PROGRESS' AND expires_ts < $1 LIMIT 200`, [new Date(Date.now() - GRACE_MS)]);
    for (const { id } of expired) {
        try { await finalise(id, 'AUTO_SUBMITTED'); }
        catch (error) { log.error('Auto-submit failed', { attemptId: id, error: error.message }); }
    }
    return expired.length;
}

function checkAnswer(question, answer) {
    if (question.questionType === 'CODING') fail(400, 'Use Run and Submit to answer a coding question');
    if (answer === null) return;
    const optionIds = new Set(question.options.map(o => o.id));
    const ok = {
        SINGLE_CHOICE: () => Number.isInteger(answer.optionId) && optionIds.has(answer.optionId),
        TRUE_FALSE: () => Number.isInteger(answer.optionId) && optionIds.has(answer.optionId),
        MULTIPLE_CHOICE: () => Array.isArray(answer.optionIds) && new Set(answer.optionIds).size === answer.optionIds.length && answer.optionIds.every(id => optionIds.has(id)),
        NUMERIC: () => typeof answer.value === 'number' && Number.isFinite(answer.value),
        SHORT_ANSWER: () => typeof answer.text === 'string' && answer.text.length <= 5000,
    }[question.questionType];
    if (!ok?.()) fail(400, 'This answer does not fit the question');
}

async function ownAttempt(identity, collegeId, id) {
    const attempt = await db.one(`SELECT a.atmpt_id AS "id", a.college_id AS "collegeId", a.asmt_id AS "assessmentId", a.asmt_wndw_id AS "windowId",
            a.user_id AS "userId", a.atmpt_no AS "attemptNo", a.status_cd AS "status", a.started_ts AS
            "startedAt", a.expires_ts AS "expiresAt", a.submitted_ts AS "submittedAt", a.layout_json AS
            "layout", a.score_ct AS "score", a.max_score_ct AS "maxScore", a.is_passed_in AS "isPassed",
            a.needs_grading_in AS "needsGrading", a.i_ts AS "createdAt", a.u_ts AS "updatedAt" FROM atmpt_dtl_t a WHERE a.atmpt_id = $1 AND a.college_id = $2 AND a.user_id = $3`, [id, collegeId, identity.id]);
    if (!attempt) notFound('Attempt');
    return attempt;
}

// What the student sees: questions in their order, options without the correct flags, their saved answers;
// after submission, marks and correct answers only when the results are visible.
async function playerView(attemptId) {
    const attempt = await attemptById(db, attemptId);
    const [answerRows, window, assessment] = await Promise.all([
        answersOf(db, attemptId),
        db.one(`SELECT w.asmt_wndw_id AS "id", w.asmt_id AS "assessmentId", w.chrt_id AS "cohortId", w.opens_ts AS "opensAt",
            w.closes_ts AS "closesAt", w.extra_time_min_ct AS "extraTimeMin", w.i_ts AS "createdAt", w.u_ts AS
            "updatedAt", w.crte_usr_id AS "createdBy", w.updte_usr_id AS "updatedBy", w.a_in AS
            "activeIndicator", w.d_ts AS "deletedAt" FROM asmt_wndw_lst_t w WHERE w.asmt_wndw_id = $1`, [attempt.windowId]),
        assessmentById(db, attempt.assessmentId),
    ]);
    const links = new Map((await assessmentLinks(db, [assessment.id], { fullProblem: true })).map(q => [q.questionId, q]));
    const answers = new Map(answerRows.map(a => [a.questionId, a]));
    const finished = attempt.status !== 'IN_PROGRESS';
    const reveal = finished && resultsVisible(assessment, window);
    // Coding questions: the problem as students see it, plus this attempt's code submissions (newest first).
    const codeSubs = await db.many(
        `SELECT s.cdng_sbmsn_id AS "id", s.qstn_id AS "questionId", s.lang_cd AS "language", s.job_status_cd AS "jobStatus",
            s.status_cd AS "status", s.passed_ct AS "passedCount", s.total_ct AS "totalCount", s.score_ct AS
            "score", s.max_score_ct AS "maxScore", s.i_ts AS "createdAt"
         FROM cdng_sbmsn_dtl_t s WHERE s.atmpt_id = $1 AND s.kind_cd = 'SUBMIT' ORDER BY s.i_ts DESC`, [attemptId]);
    const codingOf = question => question.questionType === 'CODING' && question.codingProblem ? {
        coding: publicProblem(question.codingProblem),
        codeSubmissions: codeSubs.filter(s => s.questionId === question.id),
    } : {};
    return {
        id: attempt.id, attemptNo: attempt.attemptNo, status: attempt.status, startedAt: attempt.startedAt, expiresAt: attempt.expiresAt, submittedAt: attempt.submittedAt,
        serverNow: new Date(),
        assessment: { id: assessment.id, title: assessment.title, instructions: assessment.instructions, assessmentType: assessment.assessmentType, passPct: assessment.passPct, durationMin: assessment.durationMin },
        result: reveal ? { score: attempt.score, maxScore: attempt.maxScore, isPassed: attempt.isPassed, needsGrading: attempt.needsGrading } : null,
        resultsPending: finished && !reveal,
        questions: attempt.layout.filter(item => links.has(item.questionId)).map(({ questionId, optionIds }) => {
            const { question } = links.get(questionId);
            const byId = new Map(question.options.map(o => [o.id, o]));
            const response = answers.get(questionId);
            return {
                id: questionId, questionType: question.questionType, stem: question.stem, points: pointsOf(links.get(questionId)),
                options: optionIds.filter(id => byId.has(id)).map(id => ({ id, text: byId.get(id).text, ...(reveal ? { isCorrect: byId.get(id).isCorrect === 1 } : {}) })),
                answer: response?.answer ?? null,
                ...codingOf(question),
                ...(reveal ? { isCorrect: response?.isCorrect ?? null, marksAwarded: response?.marksAwarded ?? null, feedback: response?.feedback ?? '', explanation: question.explanation, answerKey: question.answerKey } : {}),
            };
        }),
    };
}

// When an exam submission is judged after its attempt was already submitted, fill in that question's marks
// (unless a teacher has graded it by hand) and recalculate the attempt.
async function regradeCoding(sub) {
    if (sub.kind !== 'SUBMIT' || !sub.attemptId) return;
    const attempt = await attemptById(db, sub.attemptId);
    if (!attempt || attempt.status === 'IN_PROGRESS') return;
    const [answers, assessment, links] = await Promise.all([answersOf(db, attempt.id), assessmentById(db, attempt.assessmentId), assessmentLinks(db, [attempt.assessmentId])]);
    const link = links.find(q => q.questionId === sub.questionId);
    const answer = answers.find(a => a.questionId === sub.questionId);
    if (!link || answer?.evaluatedBy) return;
    await saveGrade(db, attempt.id, sub.questionId, await codingMarks(attempt.id, sub.questionId, pointsOf(link)));
    const graded = await db.many('SELECT marks_awarded_ct AS marks FROM atmpt_ans_dtl_t WHERE atmpt_id = $1', [attempt.id]);
    await saveTotals(attempt.id, totalAttempt(graded, attempt.maxScore, assessment.passPct));
}
onJudged(regradeCoding);

// The coding question of a running attempt, checked for time and ownership.
async function codingQuestion(identity, collegeId, attemptId, questionId) {
    const attempt = await ownAttempt(identity, collegeId, attemptId);
    if (await closeIfExpired(attempt) || attempt.status !== 'IN_PROGRESS')
        fail(409, 'Time is up; this attempt has been submitted.');
    if (!attempt.layout.some(item => item.questionId === questionId)) notFound('Question');
    const row = await db.one(`SELECT x.qstn_id AS "id", x.college_id AS "collegeId", x.course_id AS "courseId", x.qstn_type_cd AS "questionType",
            x.stem_tx AS "stem", x.explanation_tx AS "explanation", x.difficulty_cd AS "difficulty",
            x.marks_ct AS "marks", x.negative_marks_ct AS "negativeMarks", x.answer_key_json AS "answerKey",
            x.topic_tx AS "topic", x.cdng_prblm_id AS "codingProblemId", x.i_ts AS "createdAt", x.u_ts AS
            "updatedAt", x.crte_usr_id AS "createdBy", x.updte_usr_id AS "updatedBy", x.a_in AS
            "activeIndicator", x.d_ts AS "deletedAt" FROM qstn_lst_t x WHERE x.qstn_id = $1`, [questionId]);
    const question = row && (await withQuestionParts(db, [row], { fullProblem: true }))[0];
    if (question?.questionType !== 'CODING' || !question.codingProblem) fail(400, 'This is not a coding question');
    return { attempt, question, problem: question.codingProblem };
}

// Saves the student's answer (null clears it) and when it was saved.
const saveAnswerRow = (attemptId, questionId, answer) => db.run(
    `INSERT INTO atmpt_ans_dtl_t (atmpt_ans_id, atmpt_id, qstn_id, answer_json, saved_ts) VALUES (DEFAULT, $1, $2, $3::jsonb, $4)
     ON CONFLICT (atmpt_id, qstn_id) DO UPDATE SET answer_json = $3::jsonb, saved_ts = $4`,
    [attemptId, questionId, answer === null ? null : JSON.stringify(answer), new Date()]);

export const attemptMdl = {
    // Run code against the problem's samples (or custom input) during an attempt. Not marked.
    async runCode(identity, collegeId, attemptId, questionId, { language, code, customInput }) {
        const { problem } = await codingQuestion(identity, collegeId, attemptId, questionId);
        checkLanguage(problem, language);
        return presentSubmission(await enqueue({ collegeId, userId: identity.id, problemId: problem.id, kind: 'RUN', language, code, customInput: customInput ?? null, attemptId, questionId }));
    },
    // Submit code for marks. The best judged submission counts; the answer keeps the latest code for review.
    async submitCode(identity, collegeId, attemptId, questionId, { language, code }) {
        const { problem } = await codingQuestion(identity, collegeId, attemptId, questionId);
        checkLanguage(problem, language);
        if ((await db.one(`SELECT COUNT(*) AS total FROM cdng_sbmsn_dtl_t WHERE atmpt_id = $1 AND qstn_id = $2 AND kind_cd = 'SUBMIT'`, [attemptId, questionId])).total >= MAX_CODE_SUBMISSIONS)
            fail(409, `You can submit at most ${MAX_CODE_SUBMISSIONS} times for this question.`);
        const sub = await enqueue({ collegeId, userId: identity.id, problemId: problem.id, kind: 'SUBMIT', language, code, attemptId, questionId });
        const answer = { submissionId: sub.id, language, code };
        await saveAnswerRow(attemptId, questionId, answer);
        return presentSubmission(sub);
    },
    async codeResult(identity, collegeId, attemptId, submissionId) {
        await ownAttempt(identity, collegeId, attemptId);
        const sub = await db.one(`SELECT s.cdng_sbmsn_id AS "id", s.college_id AS "collegeId", s.user_id AS "userId", s.cdng_prblm_id AS "problemId",
            s.kind_cd AS "kind", s.job_status_cd AS "jobStatus", s.lang_cd AS "language", s.code_tx AS "code",
            s.custom_input_tx AS "customInput", s.status_cd AS "status", s.passed_ct AS "passedCount",
            s.total_ct AS "totalCount", s.score_ct AS "score", s.max_score_ct AS "maxScore", s.runtime_ms_ct
            AS "runtimeMs", s.results_json AS "results", s.limits_json AS "limits", s.atmpt_id AS "attemptId",
            s.qstn_id AS "questionId", s.tries_ct AS "tries", s.worker_tx AS "worker", s.started_ts AS
            "startedAt", s.judged_ts AS "judgedAt", s.i_ts AS "createdAt" FROM cdng_sbmsn_dtl_t s WHERE s.cdng_sbmsn_id = $1 AND s.atmpt_id = $2 AND s.user_id = $3`, [submissionId, attemptId, identity.id]);
        if (!sub) notFound('Submission');
        return presentSubmission(sub);
    },
    // Published assessments with a window for this student, their attempts and what they can do next.
    async available(identity, collegeId) {
        const now = new Date();
        const assessments = await db.many(`SELECT x.asmt_id AS "id", x.college_id AS "collegeId", x.course_id AS "courseId", x.asmt_type_cd AS "assessmentType",
            x.asmt_ttl AS "title", x.instructions_tx AS "instructions", x.duration_min_ct AS "durationMin",
            x.pass_pct AS "passPct", x.max_attempts_ct AS "maxAttempts", x.attempt_strategy_cd AS
            "attemptStrategy", x.shuffle_qstn_in AS "shuffleQuestions", x.shuffle_optn_in AS "shuffleOptions",
            x.result_visibility_cd AS "resultVisibility", x.results_published_in AS "resultsPublished",
            x.status_cd AS "status", x.i_ts AS "createdAt", x.u_ts AS "updatedAt", x.crte_usr_id AS
            "createdBy", x.updte_usr_id AS "updatedBy", x.a_in AS "activeIndicator", x.d_ts AS "deletedAt" FROM asmt_lst_t x WHERE x.college_id = $1 AND x.a_in = 1 AND x.status_cd IN ('PUBLISHED', 'CLOSED') ORDER BY x.i_ts DESC`, [collegeId]);
        const marks = await db.many(
            `SELECT l.asmt_id AS "assessmentId", l.marks_override_ct AS "marksOverride", x.marks_ct AS marks
             FROM asmt_qstn_rel_t l JOIN qstn_lst_t x ON x.qstn_id = l.qstn_id WHERE l.asmt_id = ANY($1::int[])`, [assessments.map(a => a.id)]);
        for (const a of assessments)
            a.questions = marks.filter(link => link.assessmentId === a.id).map(link => ({ marksOverride: link.marksOverride, question: { marks: link.marks } }));
        const out = [];
        for (const a of assessments) {
            const windows = await studentWindows(identity.id, a.id);
            if (!windows.length) continue;
            const attempts = await db.many(`SELECT a.atmpt_id AS "id", a.college_id AS "collegeId", a.asmt_id AS "assessmentId", a.asmt_wndw_id AS "windowId",
            a.user_id AS "userId", a.atmpt_no AS "attemptNo", a.status_cd AS "status", a.started_ts AS
            "startedAt", a.expires_ts AS "expiresAt", a.submitted_ts AS "submittedAt", a.layout_json AS
            "layout", a.score_ct AS "score", a.max_score_ct AS "maxScore", a.is_passed_in AS "isPassed",
            a.needs_grading_in AS "needsGrading", a.i_ts AS "createdAt", a.u_ts AS "updatedAt" FROM atmpt_dtl_t a WHERE a.asmt_id = $1 AND a.user_id = $2 ORDER BY a.atmpt_no ASC`, [a.id, identity.id]);
            for (const attempt of attempts) {
                if (await closeIfExpired(attempt)) Object.assign(attempt, await attemptById(db, attempt.id));
                attempt.window = await db.one(`SELECT w.asmt_wndw_id AS "id", w.asmt_id AS "assessmentId", w.chrt_id AS "cohortId", w.opens_ts AS "opensAt",
            w.closes_ts AS "closesAt", w.extra_time_min_ct AS "extraTimeMin", w.i_ts AS "createdAt", w.u_ts AS
            "updatedAt", w.crte_usr_id AS "createdBy", w.updte_usr_id AS "updatedBy", w.a_in AS
            "activeIndicator", w.d_ts AS "deletedAt" FROM asmt_wndw_lst_t w WHERE w.asmt_wndw_id = $1`, [attempt.windowId]);
            }
            const open = a.status === 'PUBLISHED' ? windows.find(w => w.opensAt <= now && w.closesAt > now) : null;
            const window = open ?? windows.find(w => w.opensAt > now) ?? windows.at(-1);
            const inProgress = attempts.find(t => t.status === 'IN_PROGRESS');
            const shown = attempts.map(t => {
                const visible = t.status !== 'IN_PROGRESS' && resultsVisible(a, t.window, now);
                return { id: t.id, attemptNo: t.attemptNo, status: t.status, startedAt: t.startedAt, submittedAt: t.submittedAt, expiresAt: t.expiresAt, ...(visible ? { score: t.score, maxScore: t.maxScore, isPassed: t.isPassed, needsGrading: t.needsGrading } : { resultsPending: t.status !== 'IN_PROGRESS' }) };
            });
            const scored = shown.filter(t => t.score !== undefined && t.score !== null);
            const final = a.attemptStrategy === 'LATEST' ? scored.at(-1) : scored.reduce((best, t) => (!best || t.score > best.score ? t : best), null);
            out.push({
                id: a.id, title: a.title, assessmentType: a.assessmentType, instructions: a.instructions, durationMin: a.durationMin, passPct: a.passPct,
                maxAttempts: a.maxAttempts, attemptStrategy: a.attemptStrategy, questionCount: a.questions.length, totalMarks: a.questions.reduce((n, q) => n + pointsOf(q), 0),
                window: window && { opensAt: window.opensAt, closesAt: window.closesAt, extraTimeMin: window.extraTimeMin },
                state: inProgress ? 'IN_PROGRESS' : open ? (attempts.length < a.maxAttempts ? 'OPEN' : 'USED_UP') : window.opensAt > now && a.status === 'PUBLISHED' ? 'UPCOMING' : 'CLOSED',
                inProgressId: inProgress?.id ?? null,
                attempts: shown, finalScore: final ? { score: final.score, maxScore: final.maxScore, isPassed: final.isPassed } : null,
            });
        }
        return out;
    },
    // Starts a new attempt, or returns the one in progress. The end time is fixed here by the server.
    async start(identity, collegeId, assessmentId) {
        if (identity.role !== 'STUDENT')
            fail(403, 'Only students attempt assessments');
        const assessment = await db.one(`SELECT x.asmt_id AS "id", x.college_id AS "collegeId", x.course_id AS "courseId", x.asmt_type_cd AS "assessmentType",
            x.asmt_ttl AS "title", x.instructions_tx AS "instructions", x.duration_min_ct AS "durationMin",
            x.pass_pct AS "passPct", x.max_attempts_ct AS "maxAttempts", x.attempt_strategy_cd AS
            "attemptStrategy", x.shuffle_qstn_in AS "shuffleQuestions", x.shuffle_optn_in AS "shuffleOptions",
            x.result_visibility_cd AS "resultVisibility", x.results_published_in AS "resultsPublished",
            x.status_cd AS "status", x.i_ts AS "createdAt", x.u_ts AS "updatedAt", x.crte_usr_id AS
            "createdBy", x.updte_usr_id AS "updatedBy", x.a_in AS "activeIndicator", x.d_ts AS "deletedAt" FROM asmt_lst_t x WHERE x.asmt_id = $1 AND x.college_id = $2 AND x.a_in = 1 AND x.status_cd = 'PUBLISHED'`, [assessmentId, collegeId]);
        if (!assessment) notFound('Assessment');
        assessment.questions = await assessmentLinks(db, [assessmentId]);
        const previous = await db.many(`SELECT a.atmpt_id AS "id", a.college_id AS "collegeId", a.asmt_id AS "assessmentId", a.asmt_wndw_id AS "windowId",
            a.user_id AS "userId", a.atmpt_no AS "attemptNo", a.status_cd AS "status", a.started_ts AS
            "startedAt", a.expires_ts AS "expiresAt", a.submitted_ts AS "submittedAt", a.layout_json AS
            "layout", a.score_ct AS "score", a.max_score_ct AS "maxScore", a.is_passed_in AS "isPassed",
            a.needs_grading_in AS "needsGrading", a.i_ts AS "createdAt", a.u_ts AS "updatedAt" FROM atmpt_dtl_t a WHERE a.asmt_id = $1 AND a.user_id = $2 ORDER BY a.atmpt_no ASC`, [assessmentId, identity.id]);
        for (const attempt of previous) {
            if (attempt.status === 'IN_PROGRESS' && !await closeIfExpired(attempt))
                return { resumed: true, attempt: await playerView(attempt.id) };
        }
        const now = new Date();
        const window = (await studentWindows(identity.id, assessmentId)).find(w => w.opensAt <= now && w.closesAt > now);
        if (!window) fail(409, 'This assessment is not open for you right now.');
        if (previous.length >= assessment.maxAttempts) fail(409, 'You have used all your attempts.');
        if (!assessment.questions.length) fail(409, 'This assessment has no questions.');
        const order = assessment.shuffleQuestions ? shuffle(assessment.questions) : assessment.questions;
        const layout = order.map(({ question }) => {
            const ids = question.options.map(o => o.id);
            return { questionId: question.id, optionIds: assessment.shuffleOptions && question.questionType !== 'TRUE_FALSE' ? shuffle(ids) : ids };
        });
        const limit = assessment.durationMin ? now.getTime() + (assessment.durationMin + window.extraTimeMin) * 60000 : Infinity;
        try {
            const attempt = await db.one(
                `INSERT INTO atmpt_dtl_t (atmpt_id, college_id, asmt_id, asmt_wndw_id, user_id, atmpt_no, expires_ts, layout_json, max_score_ct)
                 VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7::jsonb, $8) RETURNING atmpt_id AS "id"`,
                [collegeId, assessmentId, window.id, identity.id, previous.length + 1, new Date(Math.min(limit, window.closesAt.getTime())),
                    JSON.stringify(layout), assessment.questions.reduce((n, q) => n + pointsOf(q), 0)]);
            return { resumed: false, attempt: await playerView(attempt.id) };
        }
        catch (error) {
            if (error.code === '23505') fail(409, 'An attempt was just started in another tab. Reload the page.');
            throw error;
        }
    },
    async get(identity, collegeId, id) {
        await closeIfExpired(await ownAttempt(identity, collegeId, id));
        return playerView(id);
    },
    // Autosave of one answer; null clears it. Refused once the attempt is over.
    async saveAnswer(identity, collegeId, id, questionId, answer) {
        const attempt = await ownAttempt(identity, collegeId, id);
        if (await closeIfExpired(attempt) || attempt.status !== 'IN_PROGRESS')
            fail(409, 'Time is up; this attempt has been submitted.');
        if (!attempt.layout.some(item => item.questionId === questionId)) notFound('Question');
        const row = await db.one(`SELECT x.qstn_id AS "id", x.qstn_type_cd AS "questionType" FROM qstn_lst_t x WHERE x.qstn_id = $1`, [questionId]);
        const question = (await withQuestionParts(db, [row]))[0];
        checkAnswer(question, answer);
        await saveAnswerRow(id, questionId, answer);
        return { savedAt: new Date() };
    },
    async submit(identity, collegeId, id) {
        const attempt = await ownAttempt(identity, collegeId, id);
        if (!await closeIfExpired(attempt))
            await finalise(id, 'SUBMITTED');
        return playerView(id);
    },
};
