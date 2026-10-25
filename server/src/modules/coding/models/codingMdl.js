import { randomUUID } from 'node:crypto';
import { db, params } from '../../../../config/db.config.js';
import { isPlatformRole } from '../../../utils/enums.js';
import { fail, notFound } from '../../../utils/http-error.js';
import { languages, runProgram } from '../../../services/code-runner.service.js';
import { checkerFor } from '../../../services/checker.service.js';
import { enqueue } from '../../../services/judge.service.js';
import { startersFor } from './starters.js';

// Columns of a coding problem row returned by INSERT / UPDATE ... RETURNING.
const PROBLEM_RETURNING = `cdng_prblm_id AS "id", college_id AS "collegeId", prblm_slug_tx AS "slug", prblm_ttl AS "title", difficulty_cd AS "difficulty", topic_tx AS "topic", track_tx AS "track", starters_json AS "starters",
    statement_tx AS "statement", input_format_tx AS "inputFormat", output_format_tx AS "outputFormat", constraints_tx AS "constraints", time_limit_ms_ct AS "timeLimitMs",
    memory_limit_mb_ct AS "memoryLimitMb", sqnce_id AS "sequence", status_cd AS "status", visibility_cd AS "visibility", languages_json AS "languages", checker_cd AS "checker",
    epsilon_ct AS "epsilon", scoring_cd AS "scoring", max_score_ct AS "maxScore", reference_lang_cd AS "referenceLanguage", reference_solution_tx AS "referenceSolution",
    validated_ts AS "validatedAt", i_ts AS "createdAt", u_ts AS "updatedAt", crte_usr_id AS "createdBy", updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`;
const asJson = value => (value === null || value === undefined ? null : JSON.stringify(value));

const isAdmin = (identity) => identity.role === 'COLLEGE_ADMIN' || identity.role === 'SUPER_ADMIN';
const isEditor = (identity) => isAdmin(identity) || identity.role === 'TEACHER' || identity.role === 'VENDOR';

// A problem row with its test cases in order.
async function withCases(problem) {
    return { ...problem, testCases: await db.many(`SELECT t.cdng_tst_cs_id AS "id", t.cdng_prblm_id AS "problemId", t.input_tx AS "input", t.expected_output_tx AS
            "expectedOutput", t.is_sample_in AS "isSample", t.weight_ct AS "weight", t.group_tx AS "group",
            t.explanation_tx AS "explanation", t.sqnce_id AS "sequence", t.i_ts AS "createdAt" FROM cdng_tst_cs_lst_t t WHERE t.cdng_prblm_id = $1 ORDER BY t.sqnce_id ASC`, [problem.id]) };
}

// Problems linked to an assessment of this college whose window is open now: hidden from practice (spec 10.2).
async function liveExamProblemIds(collegeId) {
    if (!collegeId) return [];
    const rows = await db.many(
        `SELECT DISTINCT x.cdng_prblm_id AS id FROM qstn_lst_t x
         WHERE x.college_id = $1 AND x.a_in = 1 AND x.cdng_prblm_id IS NOT NULL
           AND EXISTS (SELECT 1 FROM asmt_qstn_rel_t l JOIN asmt_lst_t a ON a.asmt_id = l.asmt_id
                       WHERE l.qstn_id = x.qstn_id AND a.status_cd = 'PUBLISHED' AND a.a_in = 1
                         AND EXISTS (SELECT 1 FROM asmt_wndw_lst_t w WHERE w.asmt_id = a.asmt_id AND w.a_in = 1 AND w.opens_ts <= $2 AND w.closes_ts > $2))`, [collegeId, new Date()]);
    return rows.map(r => r.id);
}
// SQL condition for the problems students may practise: published, shared with everyone or this college, not in a live exam.
async function practiceFilter(q, collegeId, p = 'p') {
    const exam = await liveExamProblemIds(collegeId);
    return `${p}.a_in = 1 AND ${p}.status_cd = 'PUBLISHED' AND ${p}.visibility_cd IN ('PRACTICE', 'SHARED')
        AND (${p}.college_id IS NULL${collegeId ? ` OR ${p}.college_id = ${q.add(collegeId)}` : ''}) AND ${p}.cdng_prblm_id <> ALL(${q.add(exam)}::int[])`;
}
// Problems an editor manages: their college's own (teachers: the ones they created).
function editorFilter(q, identity, collegeId, p = 'p') {
    const college = isPlatformRole(identity.role) ? `${p}.college_id IS NULL` : collegeId ? `${p}.college_id = ${q.add(collegeId)}` : 'FALSE';
    return `${p}.a_in = 1 AND ${college}${isAdmin(identity) ? '' : ` AND ${p}.crte_usr_id = ${q.add(identity.id)}`}`;
}

async function practiceProblem(collegeId, id) {
    const q = params();
    const problem = await db.one(`SELECT p.cdng_prblm_id AS "id", p.college_id AS "collegeId", p.prblm_slug_tx AS "slug", p.prblm_ttl AS "title",
            p.difficulty_cd AS "difficulty", p.topic_tx AS "topic", track_tx AS "track", p.starters_json AS "starters", p.pseudocode_tx AS "pseudocode", p.explanation_tx AS "explanation", p.statement_tx AS "statement",
            p.input_format_tx AS "inputFormat", p.output_format_tx AS "outputFormat", p.constraints_tx AS
            "constraints", p.time_limit_ms_ct AS "timeLimitMs", p.memory_limit_mb_ct AS "memoryLimitMb",
            p.sqnce_id AS "sequence", p.status_cd AS "status", p.visibility_cd AS "visibility",
            p.languages_json AS "languages", p.checker_cd AS "checker", p.epsilon_ct AS "epsilon",
            p.scoring_cd AS "scoring", p.max_score_ct AS "maxScore", p.reference_lang_cd AS
            "referenceLanguage", p.reference_solution_tx AS "referenceSolution", p.validated_ts AS
            "validatedAt", p.i_ts AS "createdAt", p.u_ts AS "updatedAt", p.crte_usr_id AS "createdBy",
            p.updte_usr_id AS "updatedBy", p.a_in AS "activeIndicator", p.d_ts AS "deletedAt" FROM cdng_prblm_lst_t p WHERE p.cdng_prblm_id = ${q.add(id)} AND ${await practiceFilter(q, collegeId)}`, q.values);
    if (!problem) notFound('Problem');
    return withCases(problem);
}
async function editableProblem(identity, collegeId, id) {
    const q = params();
    const problem = await db.one(`SELECT p.cdng_prblm_id AS "id", p.college_id AS "collegeId", p.prblm_slug_tx AS "slug", p.prblm_ttl AS "title",
            p.difficulty_cd AS "difficulty", p.topic_tx AS "topic", track_tx AS "track", p.starters_json AS "starters", p.pseudocode_tx AS "pseudocode", p.explanation_tx AS "explanation", p.statement_tx AS "statement",
            p.input_format_tx AS "inputFormat", p.output_format_tx AS "outputFormat", p.constraints_tx AS
            "constraints", p.time_limit_ms_ct AS "timeLimitMs", p.memory_limit_mb_ct AS "memoryLimitMb",
            p.sqnce_id AS "sequence", p.status_cd AS "status", p.visibility_cd AS "visibility",
            p.languages_json AS "languages", p.checker_cd AS "checker", p.epsilon_ct AS "epsilon",
            p.scoring_cd AS "scoring", p.max_score_ct AS "maxScore", p.reference_lang_cd AS
            "referenceLanguage", p.reference_solution_tx AS "referenceSolution", p.validated_ts AS
            "validatedAt", p.i_ts AS "createdAt", p.u_ts AS "updatedAt", p.crte_usr_id AS "createdBy",
            p.updte_usr_id AS "updatedBy", p.a_in AS "activeIndicator", p.d_ts AS "deletedAt" FROM cdng_prblm_lst_t p WHERE p.cdng_prblm_id = ${q.add(id)} AND ${editorFilter(q, identity, collegeId)}`, q.values);
    if (!problem) notFound('Problem');
    return withCases(problem);
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
        starters: startersFor(problem, Array.isArray(problem.languages) && problem.languages.length ? problem.languages : null),
        samples: testCases.filter(t => t.isSample === 1).map(t => ({ input: t.input, output: t.expectedOutput, explanation: t.explanation })),
        hiddenCount: testCases.filter(t => t.isSample !== 1).length,
    };
}

// A submission for its owner: sample cases with input/expected/output; hidden cases only verdict and time (spec 9.2.1).
export async function presentSubmission(sub) {
    const cases = sub.results?.tests?.length ? await db.many(`SELECT t.cdng_tst_cs_id AS "id", t.cdng_prblm_id AS "problemId", t.input_tx AS "input", t.expected_output_tx AS
            "expectedOutput", t.is_sample_in AS "isSample", t.weight_ct AS "weight", t.group_tx AS "group",
            t.explanation_tx AS "explanation", t.sqnce_id AS "sequence", t.i_ts AS "createdAt" FROM cdng_tst_cs_lst_t t WHERE t.cdng_tst_cs_id = ANY($1::int[])`, [sub.results.tests.map(t => t.caseId).filter(Boolean)]) : [];
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

export const codingMdl = {
    // ---- Practice ----
    async list(identity, collegeId) {
        const q = params();
        const problems = await db.many(
            `SELECT p.cdng_prblm_id AS "id", p.prblm_slug_tx AS "slug", p.prblm_ttl AS "title", p.difficulty_cd AS "difficulty",
            p.topic_tx AS "topic", track_tx AS "track", p.sqnce_id AS "sequence", p.college_id AS "collegeId" FROM cdng_prblm_lst_t p
             WHERE ${await practiceFilter(q, collegeId)} ORDER BY p.sqnce_id ASC, p.prblm_ttl ASC`, q.values);
        if (!collegeId) return problems.map(problem => ({ ...problem, state: 'NEW', submissions: 0, acceptance: null }));
        const ids = problems.map(p => p.id);
        const counts = `SELECT cdng_prblm_id AS "problemId", status_cd AS status, COUNT(*) AS total FROM cdng_sbmsn_dtl_t
                        WHERE college_id = $1 AND kind_cd = 'SUBMIT' AND atmpt_id IS NULL AND cdng_prblm_id = ANY($2::int[])`;
        const [mine, stats] = await Promise.all([
            db.many(`${counts} AND user_id = $3 GROUP BY cdng_prblm_id, status_cd`, [collegeId, ids, identity.id]),
            db.many(`${counts} AND job_status_cd = 'DONE' GROUP BY cdng_prblm_id, status_cd`, [collegeId, ids]),
        ]);
        const solved = new Set(mine.filter(s => s.status === 'ACCEPTED').map(s => s.problemId));
        const tried = new Set(mine.map(s => s.problemId));
        const totals = new Map();
        for (const s of stats) {
            const t = totals.get(s.problemId) ?? { all: 0, accepted: 0 };
            t.all += s.total;
            if (s.status === 'ACCEPTED') t.accepted += s.total;
            totals.set(s.problemId, t);
        }
        return problems.map(p => {
            const t = totals.get(p.id);
            return { ...p, state: solved.has(p.id) ? 'SOLVED' : tried.has(p.id) ? 'ATTEMPTED' : 'NEW', submissions: t?.all ?? 0, acceptance: t?.all ? Math.round((t.accepted / t.all) * 100) : null };
        });
    },
    async detail(identity, collegeId, id) {
        const problem = await practiceProblem(collegeId, id);
        const solved = collegeId && await db.one(`SELECT 1 FROM cdng_sbmsn_dtl_t WHERE user_id = $1 AND college_id = $2 AND cdng_prblm_id = $3 AND status_cd = 'ACCEPTED' AND atmpt_id IS NULL LIMIT 1`, [identity.id, collegeId, id]);
        return { ...publicProblem(problem), solved: !!solved };
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
        const q = params();
        const sub = await db.one(
            `SELECT s.cdng_sbmsn_id AS "id", s.college_id AS "collegeId", s.user_id AS "userId", s.cdng_prblm_id AS "problemId",
            s.kind_cd AS "kind", s.job_status_cd AS "jobStatus", s.lang_cd AS "language", s.code_tx AS "code",
            s.custom_input_tx AS "customInput", s.status_cd AS "status", s.passed_ct AS "passedCount",
            s.total_ct AS "totalCount", s.score_ct AS "score", s.max_score_ct AS "maxScore", s.runtime_ms_ct
            AS "runtimeMs", s.results_json AS "results", s.limits_json AS "limits", s.atmpt_id AS "attemptId",
            s.qstn_id AS "questionId", s.tries_ct AS "tries", s.worker_tx AS "worker", s.started_ts AS
            "startedAt", s.judged_ts AS "judgedAt", s.i_ts AS "createdAt", p.prblm_ttl AS "problemTitle" FROM cdng_sbmsn_dtl_t s JOIN cdng_prblm_lst_t p ON p.cdng_prblm_id = s.cdng_prblm_id
             WHERE s.cdng_sbmsn_id = ${q.add(id)} AND s.college_id = ${q.add(collegeId)}${isEditor(identity) ? '' : ` AND s.user_id = ${q.add(identity.id)}`}`, q.values);
        if (!sub) notFound('Submission');
        return { ...await presentSubmission(sub), title: sub.problemTitle, ...(isEditor(identity) || sub.userId === identity.id ? { code: sub.code } : {}) };
    },
    async submissions(identity, collegeId, { problemId, all }) {
        const everyone = all && isEditor(identity);
        const q = params();
        const where = [`s.college_id = ${q.add(collegeId)}`, `s.kind_cd = 'SUBMIT'`, 's.atmpt_id IS NULL'];
        if (!everyone) where.push(`s.user_id = ${q.add(identity.id)}`);
        if (problemId) where.push(`s.cdng_prblm_id = ${q.add(problemId)}`);
                const rows = (await db.many(
            `SELECT s.cdng_sbmsn_id AS "id", s.user_id AS "userId", s.cdng_prblm_id AS "problemId", s.lang_cd AS "language", s.job_status_cd AS "jobStatus", s.status_cd AS "status",
                    s.passed_ct AS "passedCount", s.total_ct AS "totalCount", s.score_ct AS "score", s.max_score_ct AS "maxScore", s.runtime_ms_ct AS "runtimeMs", s.i_ts AS "createdAt", p.prblm_ttl AS "problemTitle"${everyone ? '' : ', s.code_tx AS "code"'} FROM cdng_sbmsn_dtl_t s JOIN cdng_prblm_lst_t p ON p.cdng_prblm_id = s.cdng_prblm_id
             WHERE ${where.join(' AND ')} ORDER BY s.i_ts DESC LIMIT 200`, q.values)).map(({ problemTitle, ...row }) => ({ ...row, problem: { title: problemTitle } }));
        if (!everyone) return rows;
        const users = await db.many(`SELECT u.id, u.name, u.email FROM "User" u WHERE u.id = ANY($1::int[])`, [[...new Set(rows.map(r => r.userId))]]);
        const byId = new Map(users.map(u => [u.id, u]));
        return rows.map(r => ({ ...r, user: byId.get(r.userId) ?? null }));
    },

    // ---- Authoring (teachers and admins) ----
    async manageList(identity, collegeId) {
        const q = params();
        const rows = await db.many(
            `SELECT p.cdng_prblm_id AS "id", p.prblm_ttl AS "title", p.difficulty_cd AS "difficulty", p.topic_tx AS "topic", track_tx AS "track",
            p.status_cd AS "status", p.visibility_cd AS "visibility", p.validated_ts AS "validatedAt", p.u_ts
            AS "updatedAt", p.i_ts AS "createdAt",
                    (SELECT COUNT(*) FROM cdng_tst_cs_lst_t t WHERE t.cdng_prblm_id = p.cdng_prblm_id) AS "testCases",
                    (SELECT COUNT(*) FROM cdng_sbmsn_dtl_t s WHERE s.cdng_prblm_id = p.cdng_prblm_id) AS "submissions"
             FROM cdng_prblm_lst_t p WHERE ${editorFilter(q, identity, collegeId)} ORDER BY p.i_ts DESC`, q.values);
        return rows.map(({ testCases, submissions, ...row }) => ({ ...row, _count: { testCases, submissions } }));
    },
    async editorDetail(identity, collegeId, id) {
        return editableProblem(identity, collegeId, id);
    },
    async create(identity, collegeId, data) {
        if (!isEditor(identity)) fail(403, 'Only teachers and admins can add problems');
        if (!isPlatformRole(identity.role) && !collegeId) fail(403, 'Choose a college before adding problems');
        return db.one(
            `INSERT INTO cdng_prblm_lst_t (cdng_prblm_id, college_id, prblm_slug_tx, prblm_ttl, difficulty_cd, topic_tx, statement_tx, input_format_tx, output_format_tx, constraints_tx,
                                           time_limit_ms_ct, memory_limit_mb_ct, status_cd, visibility_cd, languages_json, checker_cd, epsilon_ct, scoring_cd, max_score_ct,
                                           reference_lang_cd, reference_solution_tx, crte_usr_id, track_tx)
             VALUES (DEFAULT, $1, $2, $3, COALESCE($4::"Difficulty", 'EASY'), COALESCE($5, ''), $6, COALESCE($7, ''), COALESCE($8, ''), COALESCE($9, ''),
                     COALESCE($10, 2000), COALESCE($11, 256), 'DRAFT', COALESCE($12::"CodingVisibility", 'PRACTICE'), $13::jsonb, COALESCE($14::"CheckerMode", 'TRIMMED'),
                     COALESCE($15, 0.000001), COALESCE($16::"ScoringMode", 'WEIGHTED'), COALESCE($17, 100), $18, $19, $20, COALESCE($21, 'General'))
             RETURNING ${PROBLEM_RETURNING}`,
            [isPlatformRole(identity.role) ? null : collegeId, slugify(data.title), data.title, data.difficulty ?? null, data.topic ?? null, data.statement, data.inputFormat ?? null, data.outputFormat ?? null,
                data.constraints ?? null, data.timeLimitMs ?? null, data.memoryLimitMb ?? null, data.visibility ?? null, asJson(data.languages), data.checker ?? null, data.epsilon ?? null, data.scoring ?? null, data.maxScore ?? null,
                data.referenceLanguage ?? null, data.referenceSolution ?? null, identity.id, data.track ?? null]);
    },
    // Changing what is judged (limits, checker, scoring, reference) sends the problem back to draft until validated again.
    async update(identity, collegeId, id, data) {
        const before = await editableProblem(identity, collegeId, id);
        const judged = ['timeLimitMs', 'memoryLimitMb', 'checker', 'epsilon', 'scoring', 'maxScore', 'referenceLanguage', 'referenceSolution', 'languages'];
        const changed = judged.some(key => key in data && JSON.stringify(data[key]) !== JSON.stringify(before[key]));
        const after = await db.one(
            `UPDATE cdng_prblm_lst_t SET prblm_ttl = $2, difficulty_cd = $3, topic_tx = $4, statement_tx = $5, input_format_tx = $6, output_format_tx = $7, constraints_tx = $8,
                    time_limit_ms_ct = $9, memory_limit_mb_ct = $10, visibility_cd = $11, languages_json = $12::jsonb, checker_cd = $13, epsilon_ct = $14, scoring_cd = $15,
                    max_score_ct = $16, reference_lang_cd = $17, reference_solution_tx = $18,
                    status_cd = CASE WHEN $19 THEN 'DRAFT'::"ProblemStatus" ELSE status_cd END, validated_ts = CASE WHEN $19 THEN NULL ELSE validated_ts END, updte_usr_id = $20, track_tx = COALESCE($21, track_tx)
             WHERE cdng_prblm_id = $1 RETURNING ${PROBLEM_RETURNING}`,
            [id, data.title, data.difficulty, data.topic, data.statement, data.inputFormat, data.outputFormat, data.constraints, data.timeLimitMs, data.memoryLimitMb,
                data.visibility, asJson(data.languages), data.checker, data.epsilon, data.scoring, data.maxScore, data.referenceLanguage, data.referenceSolution, changed, identity.id, data.track ?? null]);
        return { before, after };
    },
    async remove(identity, collegeId, id) {
        const problem = await editableProblem(identity, collegeId, id);
        if (await db.one('SELECT 1 FROM qstn_lst_t WHERE cdng_prblm_id = $1 AND a_in = 1 LIMIT 1', [id]))
            fail(409, 'This problem is used in an assessment question. Remove it from the question bank first.');
        await db.run('UPDATE cdng_prblm_lst_t SET a_in = 0, updte_usr_id = $2 WHERE cdng_prblm_id = $1', [id, identity.id]);
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
        await db.transaction(async tx => {
            await tx.run('DELETE FROM cdng_tst_cs_lst_t WHERE cdng_prblm_id = $1', [id]);
            for (const [i, c] of cases.entries())
                await tx.run(
                    `INSERT INTO cdng_tst_cs_lst_t (cdng_tst_cs_id, cdng_prblm_id, input_tx, expected_output_tx, is_sample_in, weight_ct, group_tx, explanation_tx, sqnce_id)
                     VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8)`,
                    [id, c.input, c.expectedOutput, c.isSample ? 1 : 0, c.weight, c.group, c.explanation, i]);
            await tx.run(`UPDATE cdng_prblm_lst_t SET status_cd = 'DRAFT', validated_ts = NULL, updte_usr_id = $2 WHERE cdng_prblm_id = $1`, [id, identity.id]);
        });
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
        await db.run(`UPDATE cdng_prblm_lst_t SET status_cd = 'PUBLISHED', validated_ts = $2, updte_usr_id = $3 WHERE cdng_prblm_id = $1`, [id, new Date(), identity.id]);
        return { published: true, failures: [], slowestMs: Math.max(...run.results.map(r => r.timeMs)) };
    },
    async unpublish(identity, collegeId, id) {
        await editableProblem(identity, collegeId, id);
        await db.run(`UPDATE cdng_prblm_lst_t SET status_cd = 'DRAFT', updte_usr_id = $2 WHERE cdng_prblm_id = $1`, [id, identity.id]);
        return { success: true };
    },
};
