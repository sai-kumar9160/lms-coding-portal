import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { db } from '../../config/db.config.js';
import { runProgram } from './code-runner.service.js';
import { checkerFor, scoreCases } from './checker.service.js';
import { createLogger } from '../utils/logger.js';
import { fail } from '../utils/http-error.js';

// Judge queue (spec 9): code submissions are rows in cdng_sbmsn_dtl_t. The API inserts them as QUEUED; workers claim
// them with FOR UPDATE SKIP LOCKED (so several worker processes can share the queue), taking colleges in turn and at
// most JUDGE_COLLEGE_SLOTS at once per college, so one college's exam cannot starve another. Internal errors are
// retried and never charged to the student.
const log = createLogger('judge');
const MAX_QUEUE = Number(process.env.JUDGE_MAX_QUEUE || 500);
const COLLEGE_SLOTS = Number(process.env.JUDGE_COLLEGE_SLOTS || 2);
const MAX_TRIES = 3;
const STALE_MS = 5 * 60 * 1000;
// Columns of a submission row, as returned by INSERT / UPDATE ... RETURNING.
const SUBMISSION_RETURNING = `cdng_sbmsn_id AS "id", college_id AS "collegeId", user_id AS "userId", cdng_prblm_id AS "problemId", kind_cd AS "kind", job_status_cd AS "jobStatus", lang_cd AS "language",
    code_tx AS "code", custom_input_tx AS "customInput", status_cd AS "status", passed_ct AS "passedCount", total_ct AS "totalCount", score_ct AS "score", max_score_ct AS "maxScore",
    runtime_ms_ct AS "runtimeMs", results_json AS "results", limits_json AS "limits", atmpt_id AS "attemptId", qstn_id AS "questionId", tries_ct AS "tries", worker_tx AS "worker",
    started_ts AS "startedAt", judged_ts AS "judgedAt", i_ts AS "createdAt"`;
const listeners = new Set();
let wake = () => {};

// Called with each finished submission (used to regrade exam answers).
export function onJudged(listener) { listeners.add(listener); }

export async function enqueue(data) {
    if ((await db.one(`SELECT COUNT(*) AS total FROM cdng_sbmsn_dtl_t WHERE job_status_cd = 'QUEUED'`)).total >= MAX_QUEUE)
        fail(503, 'The judge is busy right now. Try again in a minute.');
    const row = await db.one(
        `INSERT INTO cdng_sbmsn_dtl_t (cdng_sbmsn_id, college_id, user_id, cdng_prblm_id, kind_cd, job_status_cd, lang_cd, code_tx, custom_input_tx, atmpt_id, qstn_id)
         VALUES (DEFAULT, $1, $2, $3, $4, 'QUEUED', $5, $6, $7, $8, $9) RETURNING ${SUBMISSION_RETURNING}`,
        [data.collegeId, data.userId, data.problemId, data.kind, data.language, data.code, data.customInput ?? null, data.attemptId ?? null, data.questionId ?? null]);
    wake();
    return row;
}

export async function queueStats() {
    const rows = await db.many(`SELECT job_status_cd AS "jobStatus", COUNT(*) AS total FROM cdng_sbmsn_dtl_t WHERE job_status_cd IN ('QUEUED', 'RUNNING') GROUP BY job_status_cd`);
    return Object.fromEntries(rows.map(r => [r.jobStatus, r.total]));
}

// Takes the next job: least recently served college first, then oldest; skips colleges at their slot limit.
async function claim(workerId) {
    const rows = await db.many(`
        UPDATE "cdng_sbmsn_dtl_t" SET "job_status_cd" = 'RUNNING', "started_ts" = CURRENT_TIMESTAMP, "tries_ct" = "tries_ct" + 1, "worker_tx" = $1
        WHERE "cdng_sbmsn_id" = (
            SELECT s."cdng_sbmsn_id" FROM "cdng_sbmsn_dtl_t" s
            WHERE s."job_status_cd" = 'QUEUED'
              AND (SELECT count(*) FROM "cdng_sbmsn_dtl_t" r WHERE r."job_status_cd" = 'RUNNING' AND r."college_id" = s."college_id") < $2
            ORDER BY (SELECT max(r."started_ts") FROM "cdng_sbmsn_dtl_t" r WHERE r."college_id" = s."college_id") ASC NULLS FIRST, s."i_ts" ASC
            LIMIT 1 FOR UPDATE SKIP LOCKED)
        RETURNING "cdng_sbmsn_id" AS id`, [workerId, COLLEGE_SLOTS]);
    return rows[0]?.id ?? null;
}

// Runs one submission and stores verdict, per-case results, score and the limits applied.
async function judge(id) {
    const sub = await db.one(`SELECT s.cdng_sbmsn_id AS "id", s.college_id AS "collegeId", s.user_id AS "userId", s.cdng_prblm_id AS "problemId",
            s.kind_cd AS "kind", s.job_status_cd AS "jobStatus", s.lang_cd AS "language", s.code_tx AS "code",
            s.custom_input_tx AS "customInput", s.status_cd AS "status", s.passed_ct AS "passedCount",
            s.total_ct AS "totalCount", s.score_ct AS "score", s.max_score_ct AS "maxScore", s.runtime_ms_ct
            AS "runtimeMs", s.results_json AS "results", s.limits_json AS "limits", s.atmpt_id AS "attemptId",
            s.qstn_id AS "questionId", s.tries_ct AS "tries", s.worker_tx AS "worker", s.started_ts AS
            "startedAt", s.judged_ts AS "judgedAt", s.i_ts AS "createdAt" FROM cdng_sbmsn_dtl_t s WHERE s.cdng_sbmsn_id = $1`, [id]);
    const problem = await db.one(`SELECT p.cdng_prblm_id AS "id", p.college_id AS "collegeId", p.prblm_slug_tx AS "slug", p.prblm_ttl AS "title",
            p.difficulty_cd AS "difficulty", p.topic_tx AS "topic", p.statement_tx AS "statement",
            p.input_format_tx AS "inputFormat", p.output_format_tx AS "outputFormat", p.constraints_tx AS
            "constraints", p.time_limit_ms_ct AS "timeLimitMs", p.memory_limit_mb_ct AS "memoryLimitMb",
            p.sqnce_id AS "sequence", p.status_cd AS "status", p.visibility_cd AS "visibility",
            p.languages_json AS "languages", p.checker_cd AS "checker", p.epsilon_ct AS "epsilon",
            p.scoring_cd AS "scoring", p.max_score_ct AS "maxScore", p.reference_lang_cd AS
            "referenceLanguage", p.reference_solution_tx AS "referenceSolution", p.validated_ts AS
            "validatedAt", p.i_ts AS "createdAt", p.u_ts AS "updatedAt", p.crte_usr_id AS "createdBy",
            p.updte_usr_id AS "updatedBy", p.a_in AS "activeIndicator", p.d_ts AS "deletedAt" FROM cdng_prblm_lst_t p WHERE p.cdng_prblm_id = $1`, [sub.problemId]);
    problem.testCases = await db.many(`SELECT t.cdng_tst_cs_id AS "id", t.cdng_prblm_id AS "problemId", t.input_tx AS "input", t.expected_output_tx AS
            "expectedOutput", t.is_sample_in AS "isSample", t.weight_ct AS "weight", t.group_tx AS "group",
            t.explanation_tx AS "explanation", t.sqnce_id AS "sequence", t.i_ts AS "createdAt" FROM cdng_tst_cs_lst_t t WHERE t.cdng_prblm_id = $1 ORDER BY t.sqnce_id ASC`, [problem.id]);
    const custom = sub.kind === 'RUN' && sub.customInput !== null;
    const cases = custom ? [{ id: null, input: sub.customInput, expectedOutput: undefined, isSample: 1, weight: 0, group: '' }]
        : sub.kind === 'RUN' ? problem.testCases.filter(t => t.isSample === 1) : problem.testCases;
    try {
        const run = await runProgram(sub.language, sub.code, cases.map(c => ({ input: c.input, expectedOutput: c.expectedOutput })), problem.timeLimitMs,
            { compare: checkerFor(problem.checker, problem.epsilon), memoryMb: problem.memoryLimitMb });
        const tests = run.compileError ? [] : run.results.map((r, i) => ({ caseId: cases[i].id, sample: cases[i].isSample === 1, status: r.status, stdout: r.stdout, stderr: r.stderr, timeMs: r.timeMs }));
        const status = run.compileError ? 'COMPILE_ERROR' : custom ? null : tests.find(t => t.status !== 'PASSED')?.status ?? 'ACCEPTED';
        // Hidden cases carry the marks; a problem with only samples is scored on them.
        const scored = cases.map((c, i) => ({ c, t: tests[i] })).filter(({ c }) => c.isSample !== 1);
        const basis = scored.length ? scored : cases.map((c, i) => ({ c, t: tests[i] }));
        const score = sub.kind === 'SUBMIT' ? (run.compileError ? 0 : scoreCases(problem.scoring, basis.map(({ c, t }) => ({ weight: c.weight, group: c.group, passed: t?.status === 'PASSED' })), problem.maxScore)) : null;
        const verdict = custom && !run.compileError ? (tests[0]?.status === 'PASSED' ? null : tests[0]?.status ?? null) : status;
        const done = await db.one(
            `UPDATE cdng_sbmsn_dtl_t SET job_status_cd = 'DONE', judged_ts = $2, status_cd = $3, passed_ct = $4, total_ct = $5, score_ct = $6, max_score_ct = $7, runtime_ms_ct = $8,
                    results_json = $9::jsonb, limits_json = $10::jsonb WHERE cdng_sbmsn_id = $1 RETURNING ${SUBMISSION_RETURNING}`,
            [id, new Date(), verdict, tests.filter(t => t.status === 'PASSED').length, cases.length, score, problem.maxScore, tests.reduce((max, t) => Math.max(max, t.timeMs), 0),
                JSON.stringify({ compileError: run.compileError ?? null, tests }), run.limits ? JSON.stringify(run.limits) : null]);
        for (const listener of listeners) await listener(done).catch(error => log.error('Judged hook failed', { id, error: error.message }));
    }
    catch (error) {
        // Bad requests (language removed, code too long) cannot succeed on retry; everything else is retried.
        const retry = !(error.status >= 400 && error.status < 500) && sub.tries < MAX_TRIES;
        log[retry ? 'warn' : 'error']('Judging failed', { id, tries: sub.tries, error: error.message });
        if (retry)
            await db.run(`UPDATE cdng_sbmsn_dtl_t SET job_status_cd = 'QUEUED', worker_tx = NULL WHERE cdng_sbmsn_id = $1`, [id]);
        else
            await db.run(
                `UPDATE cdng_sbmsn_dtl_t SET job_status_cd = 'INTERNAL_ERROR', judged_ts = $2, results_json = $3::jsonb WHERE cdng_sbmsn_id = $1`,
                [id, new Date(), JSON.stringify({ error: error.status && error.status < 500 ? error.message : 'The judge could not run this submission. It was not counted; please submit again.' })]);
    }
}

// Jobs left RUNNING by a crashed worker go back to the queue (or fail after MAX_TRIES).
async function recoverStale() {
    const before = new Date(Date.now() - STALE_MS);
    await db.run(`UPDATE cdng_sbmsn_dtl_t SET job_status_cd = 'QUEUED', worker_tx = NULL WHERE job_status_cd = 'RUNNING' AND started_ts < $1 AND tries_ct < $2`, [before, MAX_TRIES]);
    await db.run(`UPDATE cdng_sbmsn_dtl_t SET job_status_cd = 'INTERNAL_ERROR', judged_ts = $2 WHERE job_status_cd = 'RUNNING' AND started_ts < $1`, [before, new Date()]);
}

let worker = null;
// Starts a worker in this process. JUDGE_SLOTS sets how many programs it runs at once.
export function startJudgeWorker({ slots = Number(process.env.JUDGE_SLOTS || 4), intervalMs = 400 } = {}) {
    if (worker) return worker;
    const id = `${os.hostname()}-${process.pid}-${randomUUID().slice(0, 8)}`;
    let active = 0, stopped = false, ticking = false;
    const running = new Set();
    async function tick() {
        if (stopped || ticking) return;
        ticking = true;
        try {
            while (!stopped && active < slots) {
                const job = await claim(id);
                if (!job) break;
                active++;
                const task = judge(job).catch(error => log.error('Judge crashed', { job, error: error.message })).finally(() => { active--; running.delete(task); setImmediate(tick); });
                running.add(task);
            }
        }
        catch (error) { log.error('Judge queue poll failed', { error: error.message }); }
        finally { ticking = false; }
    }
    wake = () => setImmediate(tick);
    const poll = setInterval(tick, intervalMs);
    const stale = setInterval(() => recoverStale().catch(error => log.error('Stale job recovery failed', { error: error.message })), 60000);
    poll.unref(); stale.unref();
    recoverStale().catch(() => {}).finally(tick);
    log.info(`Judge worker ${id} started with ${slots} slot(s)`);
    worker = {
        id,
        async stop() {
            stopped = true;
            clearInterval(poll); clearInterval(stale);
            await Promise.allSettled([...running]);
            worker = null;
            wake = () => {};
        },
    };
    return worker;
}

// Waits until a submission leaves the queue (tests and scripts).
export async function waitForJudgement(id, timeoutMs = 60000) {
    const end = Date.now() + timeoutMs;
    for (;;) {
        const row = await db.one(`SELECT s.job_status_cd AS "jobStatus" FROM cdng_sbmsn_dtl_t s WHERE s.cdng_sbmsn_id = $1`, [id]);
        if (row.jobStatus === 'DONE' || row.jobStatus === 'INTERNAL_ERROR') return row;
        if (Date.now() > end) throw new Error(`Submission ${id} still ${row.jobStatus}`);
        await new Promise(resolve => setTimeout(resolve, 150));
    }
}
