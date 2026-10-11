import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createDatabaseClient } from '../config/db.config.js';
import { gradeAnswer, totalAttempt } from './services/grading.service.js';
process.env.NODE_ENV = 'test';
const { app, db: appDb } = await import('./index.js');
const { sweepExpired } = await import('./models/attempt.model.js');
const db = createDatabaseClient();

test('grading rules', () => {
    const options = [{ id: 'a', isCorrect: 1 }, { id: 'b', isCorrect: 0 }, { id: 'c', isCorrect: 1 }];
    const multiple = { questionType: 'MULTIPLE_CHOICE', options, negativeMarks: 0.5 };
    assert.deepEqual(gradeAnswer(multiple, 2, { optionIds: ['c', 'a'] }), { isCorrect: 1, marks: 2 });
    assert.deepEqual(gradeAnswer(multiple, 2, { optionIds: ['a'] }), { isCorrect: 0, marks: -0.5 }, 'partial = wrong');
    assert.deepEqual(gradeAnswer(multiple, 2, null), { isCorrect: 0, marks: 0 }, 'unanswered scores 0');
    const numeric = { questionType: 'NUMERIC', options: [], answerKey: { value: 3.14, tolerance: 0.01 } };
    assert.equal(gradeAnswer(numeric, 1, { value: 3.15 }).isCorrect, 1);
    assert.equal(gradeAnswer(numeric, 1, { value: 3.2 }).isCorrect, 0);
    const short = { questionType: 'SHORT_ANSWER', options: [], answerKey: { accepted: ['New  Delhi'], caseSensitive: false } };
    assert.equal(gradeAnswer(short, 1, { text: ' new delhi ' }).isCorrect, 1);
    assert.deepEqual(gradeAnswer({ ...short, answerKey: { accepted: [] } }, 1, { text: 'essay' }), { isCorrect: null, marks: null });
    assert.deepEqual(totalAttempt([{ marks: -1 }, { marks: 0 }], 4, 40), { score: 0, needsGrading: 0, isPassed: 0 }, 'never below zero');
    assert.deepEqual(totalAttempt([{ marks: 2 }, { marks: null }], 4, 40), { score: 2, needsGrading: 1, isPassed: null });
});

test('assessments: question bank, windows, attempts, grading and auto-submit', async () => {
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
    async function login(email, college) { const r = await request('/auth/login', '', 'POST', { email, college, password: 'DemoPass123!' }); assert.equal(r.status, 200, `login ${email}`); return r.data.token; }
    const ok = async (promise, status = 200, label = '') => { const r = await promise; assert.equal(r.status, status, `${label} ${JSON.stringify(r.data)}`); return r.data; };
    try {
        const superToken = await login('super@lms.local');
        const slug = `asmt-${Date.now()}`;
        created.push((await request('/colleges', superToken, 'POST', { name: slug, slug, adminName: 'Exam Admin', adminEmail: 'admin@exam.local', adminPassword: 'DemoPass123!' })).data.id);
        const admin = await login('admin@exam.local', slug);
        const people = {};
        for (const [n, [name, role]] of [['teacher', 'TEACHER'], ['teacher2', 'TEACHER'], ['s1', 'STUDENT'], ['s2', 'STUDENT']].entries())
            people[name] = await ok(request('/users', admin, 'POST', { name, email: `${name}@exam.local`, mobileNo: `+9132000000${n}`, password: 'DemoPass123!', role }), 201, name);
        const teacher = await login('teacher@exam.local', slug);
        const teacher2 = await login('teacher2@exam.local', slug);
        const s1 = await login('s1@exam.local', slug);
        const s2 = await login('s2@exam.local', slug);
        const cohort = await ok(request('/academics/cohorts', admin, 'POST', { name: 'Batch A', description: '' }), 201, 'cohort');
        await ok(request(`/academics/cohorts/${cohort.id}/members`, admin, 'POST', { userIds: [people.s1.id] }), 200, 'members');

        // Question bank, with type-specific validation.
        assert.equal((await request('/assessments/questions', teacher, 'POST', { questionType: 'SINGLE_CHOICE', stem: 'Pick one', options: [{ text: 'a', isCorrect: true }, { text: 'b', isCorrect: true }] })).status, 400);
        assert.equal((await request('/assessments/questions', s1, 'POST', { questionType: 'TRUE_FALSE', stem: 'Students cannot', correct: true })).status, 403);
        const q = {};
        q.single = await ok(request('/assessments/questions', teacher, 'POST', { questionType: 'SINGLE_CHOICE', stem: '2 + 2 = ?', options: [{ text: '3' }, { text: '4', isCorrect: true }, { text: '5' }], explanation: 'Basic sum' }), 201, 'single');
        q.multiple = await ok(request('/assessments/questions', teacher, 'POST', { questionType: 'MULTIPLE_CHOICE', stem: 'Primes?', options: [{ text: '2', isCorrect: true }, { text: '4' }, { text: '5', isCorrect: true }] }), 201, 'multiple');
        q.tf = await ok(request('/assessments/questions', teacher, 'POST', { questionType: 'TRUE_FALSE', stem: 'Python is interpreted', correct: true }), 201, 'tf');
        q.numeric = await ok(request('/assessments/questions', teacher, 'POST', { questionType: 'NUMERIC', stem: 'Value of pi to 2 places', answerKey: { value: 3.14, tolerance: 0.005 } }), 201, 'numeric');
        q.short = await ok(request('/assessments/questions', teacher, 'POST', { questionType: 'SHORT_ANSWER', stem: 'Explain recursion', marks: 2 }), 201, 'short');
        assert.deepEqual(q.tf.options.map(o => [o.text, o.isCorrect]), [['True', 1], ['False', 0]]);
        assert.equal((await request('/assessments/questions', teacher2)).data.length, 0, 'Teachers see only their own questions');
        assert.equal((await request('/assessments/questions', admin)).data.length, 5, 'Admins see the college bank');

        // Assessment: needs questions and a window before publishing.
        const exam = await ok(request('/assessments', teacher, 'POST', { title: 'Unit test 1', durationMin: 30, maxAttempts: 2, passPct: 50, shuffleOptions: true }), 201, 'assessment');
        assert.equal((await request(`/assessments/${exam.id}/status`, teacher, 'POST', { status: 'PUBLISHED' })).status, 400);
        const items = [{ questionId: q.single.id, marksOverride: 2 }, { questionId: q.multiple.id }, { questionId: q.tf.id }, { questionId: q.numeric.id }, { questionId: q.short.id }];
        assert.equal((await ok(request(`/assessments/${exam.id}/questions`, teacher, 'PUT', { items }))).totalMarks, 7);
        const now = Date.now();
        assert.equal((await request(`/assessments/${exam.id}/windows`, teacher, 'POST', { cohortId: cohort.id, opensAt: new Date(now + 60000), closesAt: new Date(now) })).status, 400);
        const window = await ok(request(`/assessments/${exam.id}/windows`, teacher, 'POST', { cohortId: cohort.id, opensAt: new Date(now - 60000), closesAt: new Date(now + 3600000), extraTimeMin: 5 }), 201, 'window');
        await ok(request(`/assessments/${exam.id}/status`, teacher, 'POST', { status: 'PUBLISHED' }));
        assert.equal((await request(`/assessments/${exam.id}`, teacher2)).status, 404, 'Other teachers cannot open it');
        assert.equal((await request('/assessments', admin)).data.length, 1);

        // Only the cohort's students see and start it.
        assert.equal((await request('/assessments/mine', s2)).data.length, 0);
        assert.equal((await request(`/assessments/${exam.id}/attempts`, s2, 'POST')).status, 409);
        assert.equal((await request(`/assessments/${exam.id}/attempts`, teacher, 'POST')).status, 403);
        const mine = (await request('/assessments/mine', s1)).data;
        assert.equal(mine[0].state, 'OPEN');
        const attempt = await ok(request(`/assessments/${exam.id}/attempts`, s1, 'POST'), 201, 'start');
        const minutes = (new Date(attempt.expiresAt) - new Date(attempt.startedAt)) / 60000;
        assert.ok(minutes > 34.9 && minutes <= 35.01, 'duration + extra time');
        assert.equal(attempt.questions.length, 5);
        const leaked = JSON.stringify(attempt);
        assert.ok(!leaked.includes('isCorrect') && !leaked.includes('answerKey') && !leaked.includes('Basic sum'), 'No answer keys during the attempt');
        assert.equal((await ok(request(`/assessments/${exam.id}/attempts`, s1, 'POST'))).id, attempt.id, 'Starting again resumes');

        // Autosave answers.
        const save = (questionId, answer, token = s1) => request(`/attempts/${attempt.id}/answers/${questionId}`, token, 'PUT', { answer });
        const optionId = (question, text) => question.options.find(o => o.text === text).id;
        assert.equal((await save(q.single.id, { optionId: optionId(q.tf, 'True') })).status, 400, 'Options of another question are refused');
        assert.equal((await save(q.single.id, { optionId: optionId(q.single, '4') }, s2)).status, 404, 'Only the owner saves');
        await ok(save(q.single.id, { optionId: optionId(q.single, '3') }));
        await ok(save(q.single.id, { optionId: optionId(q.single, '4') }), 200, 'change answer');
        await ok(save(q.multiple.id, { optionIds: [optionId(q.multiple, '2')] }));
        await ok(save(q.tf.id, { optionId: optionId(q.tf, 'True') }));
        await ok(save(q.numeric.id, { value: 3.141 }));
        await ok(save(q.short.id, { text: 'A function calling itself' }));
        const resumed = (await request(`/attempts/${attempt.id}`, s1)).data;
        assert.equal(resumed.questions.find(x => x.id === q.numeric.id).answer.value, 3.141);

        // Submit: auto-graded, short answer waits for the teacher.
        const submitted = await ok(request(`/attempts/${attempt.id}/submit`, s1, 'POST'));
        assert.equal(submitted.status, 'SUBMITTED');
        assert.deepEqual(submitted.result, { score: 4, maxScore: 7, isPassed: null, needsGrading: 1 });
        assert.equal(submitted.questions.find(x => x.id === q.single.id).explanation, 'Basic sum', 'Results shown immediately');
        assert.equal((await save(q.tf.id, { optionId: optionId(q.tf, 'False') })).status, 409);

        // Teacher review and manual grading.
        const list = (await request(`/assessments/${exam.id}/attempts`, teacher)).data;
        assert.equal(list[0].student.email, 's1@exam.local');
        const review = (await request(`/attempts/${attempt.id}/review`, teacher)).data;
        assert.equal(review.questions.find(x => x.id === q.short.id).response.marksAwarded, null);
        assert.equal((await request(`/attempts/${attempt.id}/answers/${q.short.id}/grade`, teacher, 'PUT', { marks: 5 })).status, 400);
        assert.deepEqual(await ok(request(`/attempts/${attempt.id}/answers/${q.short.id}/grade`, teacher, 'PUT', { marks: 2, feedback: 'Good' })), { score: 6, needsGrading: 0, isPassed: 1 });
        assert.equal((await request(`/attempts/${attempt.id}/answers/${q.short.id}/grade`, teacher2, 'PUT', { marks: 0 })).status, 404);

        // Locks once students have attempted.
        assert.equal((await request(`/assessments/questions/${q.single.id}`, teacher, 'PATCH', { questionType: 'SINGLE_CHOICE', stem: 'Changed', options: [{ text: 'x', isCorrect: true }, { text: 'y' }] })).status, 409);
        assert.equal((await request(`/assessments/${exam.id}/questions`, teacher, 'PUT', { items: items.slice(1) })).status, 409);
        assert.equal((await request(`/assessments/${exam.id}`, teacher, 'DELETE')).status, 409);
        assert.equal((await request(`/assessments/${exam.id}/windows/${window.id}`, teacher, 'DELETE')).status, 409);

        // Second attempt runs out of time and is auto-submitted by the sweep.
        const second = await ok(request(`/assessments/${exam.id}/attempts`, s1, 'POST'), 201, 'second');
        assert.equal(second.attemptNo, 2);
        await db.attempt.update({ where: { id: second.id }, data: { expiresAt: new Date(Date.now() - 60000) } });
        assert.ok(await sweepExpired() >= 1);
        const expired = (await request(`/attempts/${second.id}`, s1)).data;
        assert.equal(expired.status, 'AUTO_SUBMITTED');
        assert.equal(expired.result.score, 0);
        assert.equal((await request(`/assessments/${exam.id}/attempts`, s1, 'POST')).status, 409, 'All attempts used');
        const summary = (await request('/assessments/mine', s1)).data[0];
        assert.equal(summary.state, 'USED_UP');
        assert.equal(summary.finalScore.score, 6, 'Best attempt counts');

        // Manual result release hides marks until published.
        await ok(request(`/assessments/${exam.id}`, teacher, 'PATCH', { title: 'Unit test 1', durationMin: 30, maxAttempts: 2, passPct: 50, resultVisibility: 'MANUAL' }));
        assert.equal((await request(`/attempts/${attempt.id}`, s1)).data.result, null);
        assert.equal((await request(`/attempts/${attempt.id}`, s1)).data.resultsPending, true);
        await ok(request(`/assessments/${exam.id}/results`, teacher, 'POST', { published: true }));
        assert.equal((await request(`/attempts/${attempt.id}`, s1)).data.result.score, 6);
    }
    finally {
        const sids = [...sessions.keys()].map(token => jwt.decode(token)?.sid).filter(sid => typeof sid === 'string');
        await db.session.deleteMany({ where: { sid: { in: sids } } });
        await db.attempt.deleteMany({ where: { collegeId: { in: created } } });
        await db.assessment.deleteMany({ where: { collegeId: { in: created } } });
        await db.question.deleteMany({ where: { collegeId: { in: created } } });
        await db.cohort.deleteMany({ where: { collegeId: { in: created } } });
        await db.auditLog.deleteMany({ where: { collegeId: { in: created } } });
        await db.user.deleteMany({ where: { collegeId: { in: created } } });
        await db.college.deleteMany({ where: { id: { in: created } } });
        await new Promise(resolve => server.close(() => resolve()));
        await db.$disconnect();
        await appDb.$disconnect();
    }
});
