import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db } from '../config/db.config.js';
import { codingModel } from './models/coding.model.js';

test('Super Admin problems are shared; college problems stay within their college', async () => {
    const suffix = randomUUID();
    const colleges = [];
    const problems = [];
    const identity = role => ({ id: randomUUID(), role });
    const superAdmin = identity('SUPER_ADMIN');
    const admin = identity('COLLEGE_ADMIN');
    const student = identity('STUDENT');
    try {
        for (const label of ['one', 'two']) colleges.push(await db.college.create({ data: { name: label, slug: `scope-${label}-${suffix}` } }));
        const [one, two] = colleges;
        const data = { title: `Scope ${suffix}`, statement: 'Return the input number.', difficulty: 'EASY', visibility: 'PRACTICE' };
        await assert.rejects(codingModel.create(student, one.id, data), { status: 403 });
        await assert.rejects(codingModel.create(admin, null, data), { status: 403 });
        const shared = await codingModel.create(superAdmin, one.id, data);
        problems.push(shared);
        const privateOne = await codingModel.create(admin, one.id, data);
        problems.push(privateOne);
        const privateTwo = await codingModel.create(admin, two.id, data);
        problems.push(privateTwo);
        assert.equal(shared.collegeId, null, 'Super Admin creates shared problems even with a college selected');
        assert.equal(privateOne.collegeId, one.id);
        await db.codingProblem.updateMany({ where: { id: { in: problems.map(p => p.id) } }, data: { status: 'PUBLISHED' } });
        for (const [college, own, other] of [[one, privateOne, privateTwo], [two, privateTwo, privateOne]]) {
            const visible = await codingModel.list(student, college.id);
            assert.ok(visible.some(p => p.id === shared.id));
            assert.ok(visible.some(p => p.id === own.id));
            assert.ok(!visible.some(p => p.id === other.id));
            await assert.rejects(codingModel.detail(student, college.id, other.id), { status: 404 });
            await assert.rejects(codingModel.editorDetail(admin, college.id, shared.id), { status: 404 });
            await assert.rejects(codingModel.editorDetail(admin, college.id, other.id), { status: 404 });
        }
        const platform = await codingModel.list(superAdmin, null);
        assert.ok(platform.some(p => p.id === shared.id));
        assert.ok(!platform.some(p => p.id === privateOne.id || p.id === privateTwo.id));
        assert.equal((await codingModel.editorDetail(superAdmin, two.id, shared.id)).id, shared.id);
        await assert.rejects(codingModel.editorDetail(superAdmin, one.id, privateOne.id), { status: 404 });
    } finally {
        await db.codingProblem.deleteMany({ where: { id: { in: problems.map(p => p.id) } } });
        await db.college.deleteMany({ where: { id: { in: colleges.map(c => c.id) } } });
        await db.$disconnect();
    }
});
