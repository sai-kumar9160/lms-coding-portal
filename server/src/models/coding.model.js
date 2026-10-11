import { randomUUID } from 'node:crypto';
import { db } from '../../config/db.config.js';
import { fail, notFound } from '../utils/http-error.js';
import { languages, runProgram } from '../services/code-runner.service.js';
import { checkerFor } from '../services/checker.service.js';
import { enqueue } from '../services/judge.service.js';

const active = { activeIndicator: 1 };
const isAdmin = (identity) => identity.role === 'COLLEGE_ADMIN' || identity.role === 'SUPER_ADMIN';
const isEditor = (identity) => isAdmin(identity) || identity.role === 'TEACHER';
const caseOrder = { testCases: { orderBy: { sequence: 'asc' } } };

// Problems linked to an assessment of this college whose window is open now: hidden from practice (spec 10.2).
async function liveExamProblemIds(collegeId) {
    if (!collegeId) return [];
    const now = new Date();
    const rows = await db.question.findMany({
        where: { collegeId, ...active, codingProblemId: { not: null }, assessments: { some: { assessment: { status: 'PUBLISHED', ...active, windows: { some: { ...active, opensAt: { lte: now }, closesAt: { gt: now } } } } } } },
        select: { codingProblemId: true },
    });
    return rows.map(r => r.codingProblemId);
}
async function practiceWhere(collegeId) {
    // The live-exam exclusion sits inside AND so it can be combined with a lookup by id.
    return { ...active, status: 'PUBLISHED', visibility: { in: ['PRACTICE', 'SHARED'] }, OR: [{ collegeId: null }, ...(collegeId ? [{ collegeId }] : [])], AND: [{ id: { notIn: await liveExamProblemIds(collegeId) } }] };
}
// Problems an editor manages: their college's own (teachers: the ones they created).
const editorWhere = (identity, collegeId) => ({ ...active, collegeId: identity.role === 'SUPER_ADMIN' ? null : collegeId, ...(isAdmin(identity) ? {} : { createdBy: identity.id }) });

async function practiceProblem(collegeId, id) {
    const problem = await db.codingProblem.findFirst({ where: { id, ...await practiceWhere(collegeId) }, include: caseOrder });
    if (!problem) notFound('Problem');
    return problem;
}
async function editableProblem(identity, collegeId, id) {
    const problem = await db.codingProblem.findFirst({ where: { id, ...editorWhere(identity, collegeId) }, include: caseOrder });
    if (!problem) notFound('Problem');
    return problem;
}

// Languages a problem allows (null = every enabled one), in the author's order, with availability on this server.
export function problemLanguages(problem) {
    const all = languages();
    if (!Array.isArray(problem.languages) || !problem.languages.length) return all;
    return problem.languages.map(id => all.find(l => l.id === id)).filter(Boolean);
}
export function checkLanguage(problem, language) {
    const lang = problemLanguages(problem).find(l => l.id === language);
    if (!lang) fail(400, 'This language is not allowed for this problem.');
    if (!lang.available) fail(400, 'This language is not installed on this server yet.');
}

// The statement as students see it: samples only, never hidden cases or the reference solution.
export function publicProblem(problem) {
    const { testCases, referenceSolution, referenceLanguage, ...rest } = problem;
    return {
        ...rest,
        languages: problemLanguages(problem),
        samples: testCases.filter(t => t.isSample === 1).map(t => ({ input: t.input, output: t.expectedOutput, explanation: t.explanation })),
        hiddenCount: testCases.filter(t => t.isSample !== 1).length,
    };
}

// A submission for its owner: sample cases with input/expected/output; hidden cases only verdict and time (spec 9.2.1).
export async function presentSubmission(sub) {
    const cases = sub.results?.tests?.length ? await db.codingTestCase.findMany({ where: { id: { in: sub.results.tests.map(t => t.caseId).filter(Boolean) } } }) : [];
    const byId = new Map(cases.map(c => [c.id, c]));
    const tests = (sub.results?.tests ?? []).map((t, index) => {
        if (!t.caseId) return { index, sample: true, custom: true, status: t.status, input: sub.customInput, stdout: t.stdout, stderr: t.stderr, timeMs: t.timeMs };
        if (!t.sample) return { index, sample: false, status: t.status, timeMs: t.timeMs };
        const c = byId.get(t.caseId);
        return { index, sample: true, status: t.status, input: c?.input ?? '', expected: c?.expectedOutput ?? '', stdout: t.stdout, stderr: t.stderr, timeMs: t.timeMs };
    });
    return {
        id: sub.id, problemId: sub.problemId, kind: sub.kind, jobStatus: sub.jobStatus, language: sub.language, status: sub.status,
        passedCount: sub.passedCount, totalCount: sub.totalCount, score: sub.score, maxScore: sub.maxScore, runtimeMs: sub.runtimeMs,
        compileError: sub.results?.compileError ?? null, error: sub.results?.error ?? null, tests, limits: sub.limits, createdAt: sub.createdAt, judgedAt: sub.judgedAt,
    };
}

function slugify(title) {
    return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'problem'}-${randomUUID().slice(0, 6)}`;
}

export const codingModel = {
    // ---- Practice ----
    async list(identity, collegeId) {
        const problems = await db.codingProblem.findMany({
            where: await practiceWhere(collegeId),
            select: { id: true, slug: true, title: true, difficulty: true, topic: true, sequence: true, collegeId: true },
            orderBy: [{ sequence: 'asc' }, { title: 'asc' }],
        });
        if (!collegeId) return problems.map(problem => ({ ...problem, state: 'NEW', submissions: 0, acceptance: null }));
        const ids = problems.map(p => p.id);
        const [mine, stats] = await Promise.all([
            db.codingSubmission.groupBy({ by: ['problemId', 'status'], where: { userId: identity.id, collegeId, kind: 'SUBMIT', attemptId: null, problemId: { in: ids } }, _count: true }),
            db.codingSubmission.groupBy({ by: ['problemId', 'status'], where: { collegeId, kind: 'SUBMIT', jobStatus: 'DONE', attemptId: null, problemId: { in: ids } }, _count: true }),
        ]);
        const solved = new Set(mine.filter(s => s.status === 'ACCEPTED').map(s => s.problemId));
        const tried = new Set(mine.map(s => s.problemId));
        const totals = new Map();
        for (const s of stats) {
            const t = totals.get(s.problemId) ?? { all: 0, accepted: 0 };
            t.all += s._count;
            if (s.status === 'ACCEPTED') t.accepted += s._count;
            totals.set(s.problemId, t);
        }
        return problems.map(p => {
            const t = totals.get(p.id);
            return { ...p, state: solved.has(p.id) ? 'SOLVED' : tried.has(p.id) ? 'ATTEMPTED' : 'NEW', submissions: t?.all ?? 0, acceptance: t?.all ? Math.round((t.accepted / t.all) * 100) : null };
        });
    },
    async detail(identity, collegeId, id) {
        const problem = await practiceProblem(collegeId, id);
        return { ...publicProblem(problem), solved: collegeId ? (await db.codingSubmission.count({ where: { userId: identity.id, collegeId, problemId: id, status: 'ACCEPTED', attemptId: null } })) > 0 : false };
    },
    // Run (samples or custom input) and Submit (every case) both go through the judge queue; the client polls the result.
    async run(identity, collegeId, id, { language, code, customInput }) {
        const problem = await practiceProblem(collegeId, id);
        checkLanguage(problem, language);
        return presentSubmission(await enqueue({ collegeId, userId: identity.id, problemId: id, kind: 'RUN', language, code, customInput: customInput ?? null }));
    },
    async submit(identity, collegeId, id, { language, code }) {
        const problem = await practiceProblem(collegeId, id);
        checkLanguage(problem, language);
        if (!problem.testCases.length) fail(409, 'This problem has no test cases yet.');
        return presentSubmission(await enqueue({ collegeId, userId: identity.id, problemId: id, kind: 'SUBMIT', language, code }));
    },
    // Owner sees their own; editors may open any submission of the college.
    async submission(identity, collegeId, id) {
        const sub = await db.codingSubmission.findFirst({ where: { id, collegeId, ...(isEditor(identity) ? {} : { userId: identity.id }) }, include: { problem: { select: { title: true } } } });
        if (!sub) notFound('Submission');
        return { ...await presentSubmission(sub), title: sub.problem.title, ...(isEditor(identity) || sub.userId === identity.id ? { code: sub.code } : {}) };
    },
    async submissions(identity, collegeId, { problemId, all }) {
        const everyone = all && isEditor(identity);
        const rows = await db.codingSubmission.findMany({
            where: { collegeId, kind: 'SUBMIT', attemptId: null, ...(everyone ? {} : { userId: identity.id }), ...(problemId ? { problemId } : {}) },
            select: { id: true, userId: true, problemId: true, language: true, jobStatus: true, status: true, passedCount: true, totalCount: true, score: true, maxScore: true, runtimeMs: true, createdAt: true, problem: { select: { title: true } }, ...(everyone ? {} : { code: true }) },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        if (!everyone) return rows;
        const users = await db.user.findMany({ where: { id: { in: [...new Set(rows.map(r => r.userId))] } }, select: { id: true, name: true, email: true } });
        const byId = new Map(users.map(u => [u.id, u]));
        return rows.map(r => ({ ...r, user: byId.get(r.userId) ?? null }));
    },

    // ---- Authoring (teachers and admins) ----
    async manageList(identity, collegeId) {
        return db.codingProblem.findMany({
            where: editorWhere(identity, collegeId),
            select: { id: true, title: true, difficulty: true, topic: true, status: true, visibility: true, validatedAt: true, updatedAt: true, createdAt: true, _count: { select: { testCases: true, submissions: true } } },
            orderBy: { createdAt: 'desc' },
        });
    },
    async editorDetail(identity, collegeId, id) {
        return editableProblem(identity, collegeId, id);
    },
    async create(identity, collegeId, data) {
        if (!isEditor(identity)) fail(403, 'Only teachers and admins can add problems');
        if (identity.role !== 'SUPER_ADMIN' && !collegeId) fail(403, 'Choose a college before adding problems');
        return db.codingProblem.create({ data: { ...data, slug: slugify(data.title), collegeId: identity.role === 'SUPER_ADMIN' ? null : collegeId, status: 'DRAFT', createdBy: identity.id } });
    },
    // Changing what is judged (limits, checker, scoring, reference) sends the problem back to draft until validated again.
    async update(identity, collegeId, id, data) {
        const before = await editableProblem(identity, collegeId, id);
        const judged = ['timeLimitMs', 'memoryLimitMb', 'checker', 'epsilon', 'scoring', 'maxScore', 'referenceLanguage', 'referenceSolution', 'languages'];
        const changed = judged.some(key => key in data && JSON.stringify(data[key]) !== JSON.stringify(before[key]));
        const after = await db.codingProblem.update({ where: { id }, data: { ...data, updatedBy: identity.id, ...(changed ? { status: 'DRAFT', validatedAt: null } : {}) } });
        return { before, after };
    },
    async remove(identity, collegeId, id) {
        const problem = await editableProblem(identity, collegeId, id);
        if (await db.question.count({ where: { codingProblemId: id, ...active } }))
            fail(409, 'This problem is used in an assessment question. Remove it from the question bank first.');
        await db.codingProblem.update({ where: { id }, data: { activeIndicator: 0, updatedBy: identity.id } });
        return problem;
    },
    // Replaces all test cases. Earlier submissions keep their stored results; the problem must be validated again.
    async saveTestCases(identity, collegeId, id, cases) {
        await editableProblem(identity, collegeId, id);
        const seen = new Set();
        for (const c of cases) {
            const key = `${c.input}\u0000${c.expectedOutput}`;
            if (seen.has(key)) fail(400, 'Two test cases are identical. Remove the duplicate.');
            seen.add(key);
        }
        if (!cases.some(c => c.isSample)) fail(400, 'Mark at least one test case as a sample so students see the input format.');
        await db.$transaction([
            db.codingTestCase.deleteMany({ where: { problemId: id } }),
            db.codingTestCase.createMany({ data: cases.map((c, i) => ({ problemId: id, input: c.input, expectedOutput: c.expectedOutput, isSample: c.isSample ? 1 : 0, weight: c.weight, group: c.group, explanation: c.explanation, sequence: i })) }),
            db.codingProblem.update({ where: { id }, data: { status: 'DRAFT', validatedAt: null, updatedBy: identity.id } }),
        ]);
        return editableProblem(identity, collegeId, id);
    },
    // Publishing requires the reference solution to pass every case within the limits (spec 9.2.4).
    async validateAndPublish(identity, collegeId, id) {
        const problem = await editableProblem(identity, collegeId, id);
        if (!problem.testCases.length) fail(400, 'Add test cases first.');
        if (!problem.referenceSolution || !problem.referenceLanguage) fail(400, 'Add a reference solution first.');
        const run = await runProgram(problem.referenceLanguage, problem.referenceSolution, problem.testCases.map(c => ({ input: c.input, expectedOutput: c.expectedOutput })), problem.timeLimitMs,
            { compare: checkerFor(problem.checker, problem.epsilon), memoryMb: problem.memoryLimitMb });
        const failures = run.compileError ? [{ index: 0, status: 'COMPILE_ERROR', detail: run.compileError }]
            : run.results.map((r, index) => ({ index, status: r.status, timeMs: r.timeMs, stdout: r.stdout.slice(0, 2000), stderr: r.stderr.slice(0, 2000) })).filter(r => r.status !== 'PASSED');
        if (failures.length) return { published: false, failures };
        await db.codingProblem.update({ where: { id }, data: { status: 'PUBLISHED', validatedAt: new Date(), updatedBy: identity.id } });
        return { published: true, failures: [], slowestMs: Math.max(...run.results.map(r => r.timeMs)) };
    },
    async unpublish(identity, collegeId, id) {
        await editableProblem(identity, collegeId, id);
        await db.codingProblem.update({ where: { id }, data: { status: 'DRAFT', updatedBy: identity.id } });
        return { success: true };
    },
};
