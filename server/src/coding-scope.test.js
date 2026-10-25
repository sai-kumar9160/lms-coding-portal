import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db } from '../config/db.config.js';
import { change, remove, fakeId } from './test-helpers.js';
import { codingMdl } from './modules/coding/models/codingMdl.js';

test('Super Admin problems are shared; college problems stay within their college', async () => {
    const suffix = randomUUID();
    const colleges = [];
    const problems = [];
    const identity = role => ({ id: fakeId(), role });
    const superAdmin = identity('SUPER_ADMIN');
    const admin = identity('COLLEGE_ADMIN');
    const student = identity('STUDENT');
    try {
        for (const label of ['one', 'two']) colleges.push(await db.one('INSERT INTO "College" (name, slug) VALUES ($1, $2) RETURNING id', [label, `scope-${label}-${suffix}`]));
        const [one, two] = colleges;
        const data = { title: `Scope ${suffix}`, statement: 'Return the input number.', difficulty: 'EASY', visibility: 'PRACTICE' };
        await assert.rejects(codingMdl.create(student, one.id, data), { status: 403 });
        await assert.rejects(codingMdl.create(admin, null, data), { status: 403 });
        const shared = await codingMdl.create(superAdmin, one.id, data);
        problems.push(shared);
        const privateOne = await codingMdl.create(admin, one.id, data);
        problems.push(privateOne);
        const privateTwo = await codingMdl.create(admin, two.id, data);
        problems.push(privateTwo);
        assert.equal(shared.collegeId, null, 'Super Admin creates shared problems even with a college selected');
        assert.equal(privateOne.collegeId, one.id);
        await change('codingProblem', { id: problems.map(p => p.id) }, { status: 'PUBLISHED' });
        for (const [college, own, other] of [[one, privateOne, privateTwo], [two, privateTwo, privateOne]]) {
            const visible = await codingMdl.list(student, college.id);
            assert.ok(visible.some(p => p.id === shared.id));
            assert.ok(visible.some(p => p.id === own.id));
            assert.ok(!visible.some(p => p.id === other.id));
            await assert.rejects(codingMdl.detail(student, college.id, other.id), { status: 404 });
            await assert.rejects(codingMdl.editorDetail(admin, college.id, shared.id), { status: 404 });
            await assert.rejects(codingMdl.editorDetail(admin, college.id, other.id), { status: 404 });
        }
        const platform = await codingMdl.list(superAdmin, null);
        assert.ok(platform.some(p => p.id === shared.id));
        assert.ok(!platform.some(p => p.id === privateOne.id || p.id === privateTwo.id));
        assert.equal((await codingMdl.editorDetail(superAdmin, two.id, shared.id)).id, shared.id);
        await assert.rejects(codingMdl.editorDetail(superAdmin, one.id, privateOne.id), { status: 404 });
    } finally {
        await remove('codingProblem', { id: problems.map(p => p.id) });
        await remove('college', { id: colleges.map(c => c.id) });
        await db.end();
    }
});
