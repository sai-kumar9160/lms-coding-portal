import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db } from '../config/db.config.js';
import { change, countRows, findOne, remove, fakeId } from './test-helpers.js';
import { authMdl } from './modules/auth/models/authMdl.js';
import { userMdl } from './modules/user/models/userMdl.js';
import { publicUser } from './services/session.service.js';

let college;
try {
    college = await db.one('INSERT INTO "College" (name, slug) VALUES ($1, $2) RETURNING id', ['Temporary registration test', `branch-test-${randomUUID()}`]);
    const group = await db.one(`INSERT INTO chrt_lst_t (college_id, chrt_nm) VALUES ($1, 'CSE') RETURNING chrt_id AS id`, [college.id]);
    const input = { name: 'Test Student', email: `${randomUUID()}@example.com`, mobileNo: '9999999999', password: randomUUID(), role: 'STUDENT', collegeId: college.id, branchGroupId: group.id };
    const user = await authMdl.register(input);
    const membership = await findOne('cohortMember', { cohortId: group.id, userId: user.id });
    assert.equal(membership.collegeId, college.id);
    const admin = { id: fakeId(), role: 'COLLEGE_ADMIN' };
    const second = await db.one(`INSERT INTO chrt_lst_t (college_id, chrt_nm) VALUES ($1, 'ECE') RETURNING chrt_id AS id`, [college.id]);
    await userMdl.saveBranches(admin, college.id, user.id, [second.id]);
    assert.deepEqual((await publicUser(user)).branchGroupIds, [second.id]);
    assert.equal((await publicUser(user)).branches[0].name, 'ECE');
    await assert.rejects(userMdl.saveBranches({ ...admin, role: 'TEACHER' }, college.id, user.id, [group.id]));
    await assert.rejects(userMdl.saveBranches(admin, college.id, user.id, [2147483647]));
    assert.deepEqual((await publicUser(user)).branchGroupIds, [second.id]);
    await assert.rejects(authMdl.register({ ...input, email: `${randomUUID()}@example.com`, branchGroupId: 2147483647 }));
    await assert.rejects(authMdl.register({ ...input, email: `${randomUUID()}@example.com`, collegeId: -1 }));
    await change('cohort', { id: group.id }, { archived: 1 });
    await assert.rejects(authMdl.register({ ...input, email: `${randomUUID()}@example.com` }));
    assert.equal(await countRows('user', { collegeId: college.id }), 1);
    const teacher = await authMdl.register({ ...input, email: `${randomUUID()}@example.com`, mobileNo: '8888888888', role: 'TEACHER', branchGroupId: undefined });
    assert.equal(teacher.status, 'PENDING');
    assert.equal(await countRows('cohortMember', { userId: teacher.id }), 0);
    console.log('PASS: branch membership, invalid/foreign/archived rejection, atomic registration, teacher registration');
} finally {
    if (college) {
        await remove('cohortMember', { collegeId: college.id });
        await remove('cohort', { collegeId: college.id });
        await remove('user', { collegeId: college.id });
        await remove('college', { id: college.id });
    }
    await db.end();
}
