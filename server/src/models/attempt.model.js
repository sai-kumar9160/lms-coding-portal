import { Prisma } from '@prisma/client';
import { db } from '../../config/db.config.js';
import { fail, notFound } from '../utils/http-error.js';
import { gradeAnswer, totalAttempt } from '../services/grading.service.js';
import { pointsOf } from './assessment.model.js';
import { createLogger } from '../utils/logger.js';
import { enqueue, onJudged } from '../services/judge.service.js';
import { checkLanguage, presentSubmission, publicProblem } from './coding.model.js';

const log = createLogger('attempts');
const active = { activeIndicator: 1 };
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

const linkInclude = { questions: { orderBy: { sequence: 'asc' }, include: { question: { include: { options: { orderBy: { sequence: 'asc' } }, codingProblem: { include: { testCases: { orderBy: { sequence: 'asc' } } } } } } } } };
const MAX_CODE_SUBMISSIONS = 20;
const round = value => Math.round(value * 100) / 100;

// Marks for a coding question: the best judged submission of this attempt scales the question's points.
// Still judging, or only internal errors: null (pending; the judged hook below fills it in).
async function codingMarks(attemptId, questionId, points) {
    const subs = await db.codingSubmission.findMany({ where: { attemptId, questionId, kind: 'SUBMIT' } });
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
    const cohorts = (await db.cohortMember.findMany({ where: { userId, ...active }, select: { cohortId: true } })).map(m => m.cohortId);
    return db.assessmentWindow.findMany({ where: { assessmentId, ...active, OR: [{ cohortId: null }, { cohortId: { in: cohorts } }] }, orderBy: { opensAt: 'asc' } });
}

// When a student may see marks and correct answers.
function resultsVisible(assessment, window, now = new Date()) {
    if (assessment.resultVisibility === 'IMMEDIATE') return true;
    if (assessment.resultVisibility === 'AFTER_CLOSE') return window.closesAt <= now || assessment.status === 'CLOSED';
    return assessment.resultsPublished === 1;
}

// Grades and closes an attempt once. Safe to call twice: only the call that changes IN_PROGRESS does the work.
async function finalise(attemptId, status) {
    const claimed = await db.attempt.updateMany({ where: { id: attemptId, status: 'IN_PROGRESS' }, data: { status, submittedAt: new Date() } });
    if (!claimed.count) return false;
    const attempt = await db.attempt.findUnique({ where: { id: attemptId }, include: { answers: true, assessment: { include: linkInclude } } });
    const links = new Map(attempt.assessment.questions.map(q => [q.questionId, q]));
    const saved = new Map(attempt.answers.map(a => [a.questionId, a]));
    const graded = [];
    for (const { questionId } of attempt.layout) {
        const link = links.get(questionId);
        if (!link) continue;
        const result = link.question.questionType === 'CODING'
            ? await codingMarks(attemptId, questionId, pointsOf(link))
            : gradeAnswer(link.question, pointsOf(link), saved.get(questionId)?.answer);
        graded.push(result);
        const data = { isCorrect: result.isCorrect, marksAwarded: result.marks };
        await db.attemptAnswer.upsert({ where: { attemptId_questionId: { attemptId, questionId } }, create: { attemptId, questionId, answer: Prisma.DbNull, ...data }, update: data });
    }
    await db.attempt.update({ where: { id: attemptId }, data: totalAttempt(graded, attempt.maxScore, attempt.assessment.passPct) });
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
    const expired = await db.attempt.findMany({ where: { status: 'IN_PROGRESS', expiresAt: { lt: new Date(Date.now() - GRACE_MS) } }, select: { id: true }, take: 200 });
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
        SINGLE_CHOICE: () => typeof answer.optionId === 'string' && optionIds.has(answer.optionId),
        TRUE_FALSE: () => typeof answer.optionId === 'string' && optionIds.has(answer.optionId),
        MULTIPLE_CHOICE: () => Array.isArray(answer.optionIds) && new Set(answer.optionIds).size === answer.optionIds.length && answer.optionIds.every(id => optionIds.has(id)),
        NUMERIC: () => typeof answer.value === 'number' && Number.isFinite(answer.value),
        SHORT_ANSWER: () => typeof answer.text === 'string' && answer.text.length <= 5000,
    }[question.questionType];
    if (!ok?.()) fail(400, 'This answer does not fit the question');
}

async function ownAttempt(identity, collegeId, id) {
    const attempt = await db.attempt.findFirst({ where: { id, collegeId, userId: identity.id } });
    if (!attempt) notFound('Attempt');
    return attempt;
}

// What the student sees: questions in their order, options without the correct flags, their saved answers;
// after submission, marks and correct answers only when the results are visible.
async function playerView(attemptId) {
    const attempt = await db.attempt.findUnique({ where: { id: attemptId }, include: { answers: true, window: true, assessment: { include: linkInclude } } });
    const { assessment } = attempt;
    const links = new Map(assessment.questions.map(q => [q.questionId, q]));
    const answers = new Map(attempt.answers.map(a => [a.questionId, a]));
    const finished = attempt.status !== 'IN_PROGRESS';
    const reveal = finished && resultsVisible(assessment, attempt.window);
    // Coding questions: the problem as students see it, plus this attempt's code submissions (newest first).
    const codeSubs = await db.codingSubmission.findMany({ where: { attemptId, kind: 'SUBMIT' }, orderBy: { createdAt: 'desc' },
        select: { id: true, questionId: true, language: true, jobStatus: true, status: true, passedCount: true, totalCount: true, score: true, maxScore: true, createdAt: true } });
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
    const attempt = await db.attempt.findUnique({ where: { id: sub.attemptId }, include: { answers: true, assessment: { include: linkInclude } } });
    if (!attempt || attempt.status === 'IN_PROGRESS') return;
    const link = attempt.assessment.questions.find(q => q.questionId === sub.questionId);
    const answer = attempt.answers.find(a => a.questionId === sub.questionId);
    if (!link || answer?.evaluatedBy) return;
    const result = await codingMarks(attempt.id, sub.questionId, pointsOf(link));
    await db.attemptAnswer.upsert({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: sub.questionId } },
        create: { attemptId: attempt.id, questionId: sub.questionId, answer: Prisma.DbNull, isCorrect: result.isCorrect, marksAwarded: result.marks },
        update: { isCorrect: result.isCorrect, marksAwarded: result.marks },
    });
    const answers = await db.attemptAnswer.findMany({ where: { attemptId: attempt.id } });
    await db.attempt.update({ where: { id: attempt.id }, data: totalAttempt(answers.map(a => ({ marks: a.marksAwarded })), attempt.maxScore, attempt.assessment.passPct) });
}
onJudged(regradeCoding);

// The coding question of a running attempt, checked for time and ownership.
async function codingQuestion(identity, collegeId, attemptId, questionId) {
    const attempt = await ownAttempt(identity, collegeId, attemptId);
    if (await closeIfExpired(attempt) || attempt.status !== 'IN_PROGRESS')
        fail(409, 'Time is up; this attempt has been submitted.');
    if (!attempt.layout.some(item => item.questionId === questionId)) notFound('Question');
    const question = await db.question.findUnique({ where: { id: questionId }, include: { codingProblem: { include: { testCases: true } } } });
    if (question?.questionType !== 'CODING' || !question.codingProblem) fail(400, 'This is not a coding question');
    return { attempt, question, problem: question.codingProblem };
}

export const attemptModel = {
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
        if (await db.codingSubmission.count({ where: { attemptId, questionId, kind: 'SUBMIT' } }) >= MAX_CODE_SUBMISSIONS)
            fail(409, `You can submit at most ${MAX_CODE_SUBMISSIONS} times for this question.`);
        const sub = await enqueue({ collegeId, userId: identity.id, problemId: problem.id, kind: 'SUBMIT', language, code, attemptId, questionId });
        const answer = { submissionId: sub.id, language, code };
        await db.attemptAnswer.upsert({ where: { attemptId_questionId: { attemptId, questionId } }, create: { attemptId, questionId, answer, savedAt: new Date() }, update: { answer, savedAt: new Date() } });
        return presentSubmission(sub);
    },
    async codeResult(identity, collegeId, attemptId, submissionId) {
        await ownAttempt(identity, collegeId, attemptId);
        const sub = await db.codingSubmission.findFirst({ where: { id: submissionId, attemptId, userId: identity.id } });
        if (!sub) notFound('Submission');
        return presentSubmission(sub);
    },
    // Published assessments with a window for this student, their attempts and what they can do next.
    async available(identity, collegeId) {
        const now = new Date();
        const assessments = await db.assessment.findMany({
            where: { collegeId, ...active, status: { in: ['PUBLISHED', 'CLOSED'] } },
            include: { questions: { include: { question: { select: { marks: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
        const out = [];
        for (const a of assessments) {
            const windows = await studentWindows(identity.id, a.id);
            if (!windows.length) continue;
            const attempts = await db.attempt.findMany({ where: { assessmentId: a.id, userId: identity.id }, orderBy: { attemptNo: 'asc' }, include: { window: true } });
            for (const attempt of attempts)
                if (await closeIfExpired(attempt)) Object.assign(attempt, await db.attempt.findUnique({ where: { id: attempt.id } }));
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
        const assessment = await db.assessment.findFirst({ where: { id: assessmentId, collegeId, ...active, status: 'PUBLISHED' }, include: linkInclude });
        if (!assessment) notFound('Assessment');
        const previous = await db.attempt.findMany({ where: { assessmentId, userId: identity.id }, orderBy: { attemptNo: 'asc' } });
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
            const attempt = await db.attempt.create({ data: {
                collegeId, assessmentId, windowId: window.id, userId: identity.id, attemptNo: previous.length + 1,
                expiresAt: new Date(Math.min(limit, window.closesAt.getTime())), layout,
                maxScore: assessment.questions.reduce((n, q) => n + pointsOf(q), 0),
            } });
            return { resumed: false, attempt: await playerView(attempt.id) };
        }
        catch (error) {
            if (error.code === 'P2002') fail(409, 'An attempt was just started in another tab. Reload the page.');
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
        const question = await db.question.findUnique({ where: { id: questionId }, include: { options: true } });
        checkAnswer(question, answer);
        const value = answer === null ? Prisma.DbNull : answer;
        await db.attemptAnswer.upsert({
            where: { attemptId_questionId: { attemptId: id, questionId } },
            create: { attemptId: id, questionId, answer: value, savedAt: new Date() },
            update: { answer: value, savedAt: new Date() },
        });
        return { savedAt: new Date() };
    },
    async submit(identity, collegeId, id) {
        const attempt = await ownAttempt(identity, collegeId, id);
        if (!await closeIfExpired(attempt))
            await finalise(id, 'SUBMITTED');
        return playerView(id);
    },
};
