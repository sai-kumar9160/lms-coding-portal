import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';
import { createDatabaseClient } from '../config/db.config.js';
import { CHECKERS, scoreCases } from './services/checker.service.js';
process.env.NODE_ENV = 'test';
process.env.CODE_RUNNER = 'local';
const { app, db: appDb } = await import('./index.js');
const { runProgram, languages, sameOutput } = await import('./services/code-runner.service.js');
const { startJudgeWorker } = await import('./services/judge.service.js');
const { importProblems } = await import('../scripts/import-problems.mjs');
const db = createDatabaseClient();
const library = JSON.parse(fs.readFileSync(new URL('../prisma/data/coding/problems.json', import.meta.url), 'utf8'));

test('output checkers and scoring modes', () => {
    assert.ok(sameOutput('1 2 \r\n3\n\n', '1 2\n3'));
    assert.ok(!sameOutput(' *\n', '*\n'), 'leading spaces matter (patterns)');
    assert.ok(CHECKERS.TRIMMED('a  \nb\n\n', 'a\nb'));
    assert.ok(!CHECKERS.EXACT('a \n', 'a\n') && CHECKERS.EXACT('a\r\n', 'a\n'));
    assert.ok(CHECKERS.TOKEN('1   2\n3', '1 2 3'));
    assert.ok(CHECKERS.CASE_INSENSITIVE('YES\n', 'yes'));
    assert.ok(CHECKERS.NUMERIC('3.1415927 2', '3.1415926 2', 1e-6) && !CHECKERS.NUMERIC('3.15', '3.14', 1e-6));
    assert.ok(CHECKERS.UNORDERED('b\na\n', 'a\nb') && !CHECKERS.UNORDERED('a\na', 'a\nb'));
    const cases = [{ weight: 1, group: 'small', passed: true }, { weight: 1, group: 'small', passed: false }, { weight: 2, group: 'big', passed: true }];
    assert.equal(scoreCases('WEIGHTED', cases, 100), 75);
    assert.equal(scoreCases('GROUP', cases, 100), 50, 'a group scores only when all of it passes');
    assert.equal(scoreCases('BINARY', cases, 100), 0);
    assert.equal(scoreCases('BINARY', cases.map(c => ({ ...c, passed: true })), 100), 100);
});

test('every library problem is solved by its reference solution through the runner', async () => {
    assert.ok(library.length >= 50);
    assert.ok(languages().some(l => l.id === 'python' && l.available), 'Python must be installed to run this test');
    for (const problem of library) {
        const run = await runProgram('python', problem.solution, problem.tests.map(t => ({ input: t.input, expectedOutput: t.output })), 10000);
        assert.equal(run.compileError, undefined, problem.slug);
        assert.deepEqual(run.results.map(r => r.status), problem.tests.map(() => 'PASSED'), problem.slug);
    }
});

test('coding platform: queue, practice, authoring, visibility and coding questions in exams', async () => {
    await importProblems();
    let worker = startJudgeWorker({ slots: 2, intervalMs: 100 });
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const sessions = new Map();
    const created = [];
    async function request(path, token = '', method = 'GET', body) {
        const auth = sessions.get(token);
        const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'x-access-token': token, Cookie: auth?.cookie ?? '', 'x-csrf-token': auth?.csrf ?? '' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
        const data = await response.json().catch(() => null);
        if (data?.token)
            sessions.set(data.token, { cookie: response.headers.get('set-cookie')?.split(';')[0], csrf: data.csrfToken });
        return { status: response.status, data };
    }
    const ok = async (promise, status = 200, label = '') => { const r = await promise; assert.equal(r.status, status, `${label} ${JSON.stringify(r.data)}`); return r.data; };
    async function login(email, college) { const r = await request('/auth/login', '', 'POST', { email, college, password: 'DemoPass123!' }); assert.equal(r.status, 200, `login ${email}`); return r.data.token; }
    // Queue a run/submit and wait for the verdict (long poll).
    const judged = async (token, path, body, resultPath = id => `/coding/submissions/${id}`) => {
        const queued = await ok(request(path, token, 'POST', body), 202, path);
        assert.ok(['QUEUED', 'RUNNING', 'DONE'].includes(queued.jobStatus));
        for (;;) {
            const result = await ok(request(`${resultPath(queued.id)}?wait=1`, token));
            if (result.jobStatus !== 'QUEUED' && result.jobStatus !== 'RUNNING') return result;
        }
    };
    try {
        const superToken = await login('super@lms.local');
        const slug = `code-${Date.now()}`;
        created.push((await request('/colleges', superToken, 'POST', { name: slug, slug, adminName: 'Code Admin', adminEmail: 'admin@code.local', adminPassword: 'DemoPass123!' })).data.id);
        const admin = await login('admin@code.local', slug);
        const people = {};
        for (const [n, [name, role]] of [['coder', 'STUDENT'], ['teacher', 'TEACHER'], ['teacher2', 'TEACHER']].entries())
            people[name] = await ok(request('/users', admin, 'POST', { name, email: `${name}@code.local`, mobileNo: `+91310000000${n}`, password: 'DemoPass123!', role }), 201, name);
        const student = await login('coder@code.local', slug);
        const teacher = await login('teacher@code.local', slug);
        const teacher2 = await login('teacher2@code.local', slug);

        // ---- Practice through the queue ----
        const menu = (await request('/menu', student)).data;
        assert.ok(menu.menu.some(item => item.code === 'coding'));
        const list = (await request('/coding/problems', student)).data;
        assert.ok(list.problems.length >= 50);
        const usable = list.languages.filter(l => l.available).map(l => l.id);
        assert.ok(usable.includes('python') && usable.includes('javascript'));
        const sum = list.problems.find(p => p.slug === 'sum-of-two-numbers');
        const detail = (await request(`/coding/problems/${sum.id}`, student)).data;
        assert.equal(detail.samples.length, 2);
        assert.equal(detail.testCases, undefined);
        assert.equal(detail.referenceSolution, undefined, 'Reference solutions never reach students');

        const js = "const [a, b] = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(a + b);\n";
        const ran = await judged(student, `/coding/problems/${sum.id}/run`, { language: 'javascript', code: js });
        assert.equal(ran.status, 'ACCEPTED');
        assert.equal(ran.tests[0].stdout.trim(), '8');
        assert.ok(ran.tests[0].expected !== undefined && ran.limits.timeLimitMs > 0);
        const custom = await judged(student, `/coding/problems/${sum.id}/run`, { language: 'python', code: 'a, b = map(int, input().split())\nprint(a * b)', customInput: '6 7' });
        assert.equal(custom.tests[0].stdout.trim(), '42');

        const wrong = await judged(student, `/coding/problems/${sum.id}/submit`, { language: 'python', code: 'a, b = map(int, input().split())\nprint(a + b if a < 1000 else 0)' });
        assert.equal(wrong.status, 'WRONG_ANSWER');
        assert.equal(wrong.score, 50, '2 of 4 hidden cases (weighted)');
        assert.ok(wrong.tests.filter(t => !t.sample).every(t => t.input === undefined && t.expected === undefined && t.stdout === undefined));
        assert.equal((await judged(student, `/coding/problems/${sum.id}/run`, { language: 'python', code: 'print(' })).status, 'RUNTIME_ERROR');
        const hello = list.problems.find(p => p.slug === 'hello-world');
        assert.equal((await judged(student, `/coding/problems/${hello.id}/run`, { language: 'python', code: 'while True:\n    pass' })).status, 'TIME_LIMIT');
        assert.equal((await request(`/coding/problems/${sum.id}/run`, student, 'POST', { language: 'cobol', code: 'x' })).status, 400);
        const accepted = await judged(student, `/coding/problems/${sum.id}/submit`, { language: 'javascript', code: js });
        assert.equal(accepted.status, 'ACCEPTED');
        assert.equal(accepted.score, 100);
        const after = (await request('/coding/problems', student)).data.problems.find(p => p.id === sum.id);
        assert.equal(after.state, 'SOLVED');
        assert.equal(after.acceptance, 50);
        assert.equal((await request(`/coding/submissions?problemId=${sum.id}`, student)).data.length, 2, 'Runs are not listed as submissions');
        assert.equal((await request('/coding/submissions?all=1', admin)).data.length, 2);
        assert.equal((await request(`/coding/submissions/${accepted.id}`, admin)).data.code, js);

        // ---- Authoring: teachers create, validate and publish ----
        assert.equal((await request('/coding/manage', student)).status, 403);
        const problemBody = { title: 'Double It', statement: 'Read an integer n and print 2 * n.', inputFormat: 'One integer n.', outputFormat: 'Print 2n.', difficulty: 'EASY', languages: ['python'], checker: 'TOKEN', scoring: 'BINARY', visibility: 'PRACTICE', referenceLanguage: 'python', referenceSolution: 'print(int(input()) * 3)' };
        const problem = await ok(request('/coding/manage', teacher, 'POST', problemBody), 201, 'create problem');
        assert.equal(problem.status, 'DRAFT');
        assert.deepEqual(problem.languages, ['python']);
        assert.equal((await request(`/coding/manage/${problem.id}`, teacher2)).status, 404, 'Teachers manage only their own problems');
        assert.equal((await request(`/coding/manage/${problem.id}`, admin)).status, 200, 'Admins manage every college problem');
        const cases = [{ input: '2\n', expectedOutput: '4\n', isSample: true }, { input: '0\n', expectedOutput: '0\n' }, { input: '-7\n', expectedOutput: '-14\n' }, { input: '1000000\n', expectedOutput: '2000000\n' }];
        assert.equal((await request(`/coding/manage/${problem.id}/test-cases`, teacher, 'PUT', { cases: cases.map(c => ({ ...c, isSample: false })) })).status, 400, 'Needs a sample');
        assert.equal((await request(`/coding/manage/${problem.id}/test-cases`, teacher, 'PUT', { cases: [...cases, cases[1]] })).status, 400, 'No duplicates');
        await ok(request(`/coding/manage/${problem.id}/test-cases`, teacher, 'PUT', { cases }));
        const failedPublish = await ok(request(`/coding/manage/${problem.id}/publish`, teacher, 'POST'));
        assert.equal(failedPublish.published, false, 'A wrong reference solution blocks publishing');
        assert.ok(failedPublish.failures.length >= 3);
        assert.ok(!(await request('/coding/problems', student)).data.problems.some(p => p.id === problem.id), 'Drafts are not in practice');
        assert.deepEqual((await ok(request(`/coding/manage/${problem.id}`, teacher, 'PATCH', { ...problemBody, referenceSolution: 'print(int(input()) * 2)' }))).languages, ['python']);
        assert.equal((await ok(request(`/coding/manage/${problem.id}/publish`, teacher, 'POST'))).published, true);
        assert.ok((await request('/coding/problems', student)).data.problems.some(p => p.id === problem.id));
        assert.deepEqual((await request(`/coding/problems/${problem.id}`, student)).data.languages.map(l => l.id), ['python']);
        assert.equal((await request(`/coding/problems/${problem.id}/run`, student, 'POST', { language: 'javascript', code: 'x' })).status, 400, 'Only the allowed languages');
        const partial = await judged(student, `/coding/problems/${problem.id}/submit`, { language: 'python', code: 'n = int(input())\nprint(n * 2 if n >= 0 else 0)' });
        assert.equal(partial.score, 0, 'Binary scoring: all hidden cases or nothing');
        const tokenOk = await judged(student, `/coding/problems/${problem.id}/submit`, { language: 'python', code: 'print("  ", int(input()) * 2, "  ")' });
        assert.equal(tokenOk.status, 'ACCEPTED', 'Token checker ignores spacing');
        // Changing what is judged sends it back to draft.
        assert.equal((await ok(request(`/coding/manage/${problem.id}`, teacher, 'PATCH', { ...problemBody, referenceSolution: 'print(int(input()) * 2)', timeLimitMs: 3000 }))).status, 'DRAFT');

        // ---- Coding questions in an assessment ----
        const examProblem = await ok(request('/coding/manage', teacher, 'POST', { ...problemBody, title: 'Exam Square', statement: 'Read n and print n squared.', visibility: 'ASSESSMENT', scoring: 'WEIGHTED', checker: 'TRIMMED', referenceSolution: 'n = int(input())\nprint(n * n)' }), 201);
        await ok(request(`/coding/manage/${examProblem.id}/test-cases`, teacher, 'PUT', { cases: [{ input: '3\n', expectedOutput: '9\n', isSample: true }, { input: '0\n', expectedOutput: '0\n' }, { input: '-4\n', expectedOutput: '16\n' }] }));
        assert.equal((await ok(request(`/coding/manage/${examProblem.id}/publish`, teacher, 'POST'))).published, true);
        assert.ok(!(await request('/coding/problems', student)).data.problems.some(p => p.id === examProblem.id), 'Assessment-only problems never show in practice');
        assert.equal((await request('/assessments/questions', teacher, 'POST', { questionType: 'CODING', stem: 'Practice-only problem', codingProblemId: problem.id })).status, 400, 'Practice-only problems cannot be used');
        const q1 = await ok(request('/assessments/questions', teacher, 'POST', { questionType: 'CODING', stem: 'Square a number', codingProblemId: examProblem.id, marks: 10 }), 201, 'q1');
        const q2 = await ok(request('/assessments/questions', teacher, 'POST', { questionType: 'CODING', stem: 'Add two numbers', codingProblemId: sum.id, marks: 10 }), 201, 'q2');
        const exam = await ok(request('/assessments', teacher, 'POST', { title: 'Coding test', durationMin: 30, maxAttempts: 2 }), 201);
        await ok(request(`/assessments/${exam.id}/questions`, teacher, 'PUT', { items: [{ questionId: q1.id }, { questionId: q2.id }] }));
        await ok(request(`/assessments/${exam.id}/windows`, teacher, 'POST', { opensAt: new Date(Date.now() - 60000), closesAt: new Date(Date.now() + 3600000) }), 201);
        await ok(request(`/assessments/${exam.id}/status`, teacher, 'POST', { status: 'PUBLISHED' }));
        assert.ok(!(await request('/coding/problems', student)).data.problems.some(p => p.id === sum.id), 'A shared problem in a live exam leaves practice');

        const attempt = await ok(request(`/assessments/${exam.id}/attempts`, student, 'POST'), 201, 'start');
        const square = attempt.questions.find(q => q.id === q1.id);
        assert.equal(square.coding.samples.length, 1);
        assert.equal(square.coding.hiddenCount, 2);
        assert.ok(!JSON.stringify(attempt).includes('n * n'), 'No reference solution in the exam');
        assert.equal((await request(`/attempts/${attempt.id}/answers/${q1.id}`, student, 'PUT', { answer: { text: 'x' } })).status, 400);
        const result = id => `/attempts/${attempt.id}/code/${id}`;
        const examRun = await judged(student, `/attempts/${attempt.id}/questions/${q1.id}/run`, { language: 'python', code: 'n = int(input())\nprint(n * n)' }, result);
        assert.equal(examRun.status, 'ACCEPTED');
        assert.equal((await judged(student, `/attempts/${attempt.id}/questions/${q1.id}/code`, { language: 'python', code: 'print(abs(int(input())) * 0 + 9)' }, result)).score, 0);
        assert.equal((await judged(student, `/attempts/${attempt.id}/questions/${q1.id}/code`, { language: 'python', code: 'n = int(input())\nprint(n * n)' }, result)).status, 'ACCEPTED');
        await judged(student, `/attempts/${attempt.id}/questions/${q2.id}/code`, { language: 'python', code: 'a, b = map(int, input().split())\nprint(a + b if a < 1000 else 0)' }, result);
        const submitted = await ok(request(`/attempts/${attempt.id}/submit`, student, 'POST'));
        assert.deepEqual(submitted.result, { score: 15, maxScore: 20, isPassed: 1, needsGrading: 0 }, 'Best submission per question: 10 + 5');
        const review = (await request(`/attempts/${attempt.id}/review`, teacher)).data;
        assert.ok(review.questions.find(q => q.id === q1.id).response.answer.code.includes('n * n'));

        // A submission still being judged when the attempt ends is marked when the judge finishes.
        await worker.stop();
        const second = await ok(request(`/assessments/${exam.id}/attempts`, student, 'POST'), 201, 'second attempt');
        await ok(request(`/attempts/${second.id}/questions/${q1.id}/code`, student, 'POST', { language: 'python', code: 'n = int(input())\nprint(n * n)' }), 202);
        const pending = await ok(request(`/attempts/${second.id}/submit`, student, 'POST'));
        assert.equal(pending.result.needsGrading, 1);
        worker = startJudgeWorker({ slots: 2, intervalMs: 100 });
        for (let i = 0; i < 100; i++) {
            const view = (await request(`/attempts/${second.id}`, student)).data;
            if (!view.result.needsGrading) { assert.equal(view.result.score, 10); break; }
            assert.ok(i < 99, 'regrade did not happen');
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        await ok(request(`/assessments/${exam.id}/status`, teacher, 'POST', { status: 'CLOSED' }));
        assert.ok((await request('/coding/problems', student)).data.problems.some(p => p.id === sum.id), 'Back in practice after the exam');
    }
    finally {
        await worker.stop();
        const sids = [...sessions.keys()].map(token => jwt.decode(token)?.sid).filter(sid => typeof sid === 'string');
        await db.session.deleteMany({ where: { sid: { in: sids } } });
        await db.attempt.deleteMany({ where: { collegeId: { in: created } } });
        await db.assessment.deleteMany({ where: { collegeId: { in: created } } });
        await db.question.deleteMany({ where: { collegeId: { in: created } } });
        await db.codingSubmission.deleteMany({ where: { collegeId: { in: created } } });
        await db.codingProblem.deleteMany({ where: { collegeId: { in: created } } });
        await db.auditLog.deleteMany({ where: { collegeId: { in: created } } });
        await db.user.deleteMany({ where: { collegeId: { in: created } } });
        await db.college.deleteMany({ where: { id: { in: created } } });
        await new Promise(resolve => server.close(() => resolve()));
        await db.$disconnect();
        await appDb.$disconnect();
    }
});
