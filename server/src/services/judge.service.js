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
const listeners = new Set();
let wake = () => {};

// Called with each finished submission (used to regrade exam answers).
export function onJudged(listener) { listeners.add(listener); }

export async function enqueue(data) {
    if (await db.codingSubmission.count({ where: { jobStatus: 'QUEUED' } }) >= MAX_QUEUE)
        fail(503, 'The judge is busy right now. Try again in a minute.');
    const row = await db.codingSubmission.create({ data: { ...data, jobStatus: 'QUEUED' } });
    wake();
    return row;
}

export async function queueStats() {
    const rows = await db.codingSubmission.groupBy({ by: ['jobStatus'], where: { jobStatus: { in: ['QUEUED', 'RUNNING'] } }, _count: true });
    return Object.fromEntries(rows.map(r => [r.jobStatus, r._count]));
}

// Takes the next job: least recently served college first, then oldest; skips colleges at their slot limit.
async function claim(workerId) {
    const rows = await db.$queryRaw`
        UPDATE "cdng_sbmsn_dtl_t" SET "job_status_cd" = 'RUNNING', "started_ts" = CURRENT_TIMESTAMP, "tries_ct" = "tries_ct" + 1, "worker_tx" = ${workerId}
        WHERE "cdng_sbmsn_id" = (
            SELECT s."cdng_sbmsn_id" FROM "cdng_sbmsn_dtl_t" s
            WHERE s."job_status_cd" = 'QUEUED'
              AND (SELECT count(*) FROM "cdng_sbmsn_dtl_t" r WHERE r."job_status_cd" = 'RUNNING' AND r."college_id" = s."college_id") < ${COLLEGE_SLOTS}
            ORDER BY (SELECT max(r."started_ts") FROM "cdng_sbmsn_dtl_t" r WHERE r."college_id" = s."college_id") ASC NULLS FIRST, s."i_ts" ASC
            LIMIT 1 FOR UPDATE SKIP LOCKED)
        RETURNING "cdng_sbmsn_id" AS id`;
    return rows[0]?.id ?? null;
}

// Runs one submission and stores verdict, per-case results, score and the limits applied.
async function judge(id) {
    const sub = await db.codingSubmission.findUnique({ where: { id }, include: { problem: { include: { testCases: { orderBy: { sequence: 'asc' } } } } } });
    const problem = sub.problem;
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
        const done = await db.codingSubmission.update({ where: { id }, data: {
            jobStatus: 'DONE', judgedAt: new Date(), status: custom && !run.compileError ? (tests[0]?.status === 'PASSED' ? null : tests[0]?.status) : status,
            passedCount: tests.filter(t => t.status === 'PASSED').length, totalCount: cases.length,
            score, maxScore: problem.maxScore, runtimeMs: tests.reduce((max, t) => Math.max(max, t.timeMs), 0),
            results: { compileError: run.compileError ?? null, tests }, limits: run.limits,
        } });
        for (const listener of listeners) await listener(done).catch(error => log.error('Judged hook failed', { id, error: error.message }));
    }
    catch (error) {
        // Bad requests (language removed, code too long) cannot succeed on retry; everything else is retried.
        const retry = !(error.status >= 400 && error.status < 500) && sub.tries < MAX_TRIES;
        log[retry ? 'warn' : 'error']('Judging failed', { id, tries: sub.tries, error: error.message });
        await db.codingSubmission.update({ where: { id }, data: retry
            ? { jobStatus: 'QUEUED', worker: null }
            : { jobStatus: 'INTERNAL_ERROR', judgedAt: new Date(), results: { error: error.status && error.status < 500 ? error.message : 'The judge could not run this submission. It was not counted; please submit again.' } } });
    }
}

// Jobs left RUNNING by a crashed worker go back to the queue (or fail after MAX_TRIES).
async function recoverStale() {
    const before = new Date(Date.now() - STALE_MS);
    await db.codingSubmission.updateMany({ where: { jobStatus: 'RUNNING', startedAt: { lt: before }, tries: { lt: MAX_TRIES } }, data: { jobStatus: 'QUEUED', worker: null } });
    await db.codingSubmission.updateMany({ where: { jobStatus: 'RUNNING', startedAt: { lt: before } }, data: { jobStatus: 'INTERNAL_ERROR', judgedAt: new Date() } });
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
        const row = await db.codingSubmission.findUnique({ where: { id } });
        if (row.jobStatus === 'DONE' || row.jobStatus === 'INTERNAL_ERROR') return row;
        if (Date.now() > end) throw new Error(`Submission ${id} still ${row.jobStatus}`);
        await new Promise(resolve => setTimeout(resolve, 150));
    }
}
