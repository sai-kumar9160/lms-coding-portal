import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db } from '../config/db.config.js';
import { authModel } from './models/auth.model.js';
import { userModel } from './models/user.model.js';
import { publicUser } from './services/session.service.js';

let college;
try {
    college = await db.college.create({ data: { name: 'Temporary registration test', slug: `branch-test-${randomUUID()}` } });
    const group = await db.cohort.create({ data: { collegeId: college.id, name: 'CSE' } });
    const input = { name: 'Test Student', email: `${randomUUID()}@example.com`, mobileNo: '9999999999', password: randomUUID(), role: 'STUDENT', collegeId: college.id, branchGroupId: group.id };
    const user = await authModel.register(input);
    const membership = await db.cohortMember.findUnique({ where: { cohortId_userId: { cohortId: group.id, userId: user.id } } });
    assert.equal(membership.collegeId, college.id);
    const admin = { id: randomUUID(), role: 'COLLEGE_ADMIN' };
    const second = await db.cohort.create({ data: { collegeId: college.id, name: 'ECE' } });
    await userModel.saveBranches(admin, college.id, user.id, [second.id]);
    assert.deepEqual((await publicUser(user)).branchGroupIds, [second.id]);
    assert.equal((await publicUser(user)).branches[0].name, 'ECE');
    await assert.rejects(userModel.saveBranches({ ...admin, role: 'TEACHER' }, college.id, user.id, [group.id]));
    await assert.rejects(userModel.saveBranches(admin, college.id, user.id, [2147483647]));
    assert.deepEqual((await publicUser(user)).branchGroupIds, [second.id]);
    await assert.rejects(authModel.register({ ...input, email: `${randomUUID()}@example.com`, branchGroupId: 2147483647 }));
    await assert.rejects(authModel.register({ ...input, email: `${randomUUID()}@example.com`, collegeId: -1 }));
    await db.cohort.update({ where: { id: group.id }, data: { archived: 1 } });
    await assert.rejects(authModel.register({ ...input, email: `${randomUUID()}@example.com` }));
    assert.equal(await db.user.count({ where: { collegeId: college.id } }), 1);
    const teacher = await authModel.register({ ...input, email: `${randomUUID()}@example.com`, mobileNo: '8888888888', role: 'TEACHER', branchGroupId: undefined });
    assert.equal(teacher.status, 'PENDING');
    assert.equal(await db.cohortMember.count({ where: { userId: teacher.id } }), 0);
    console.log('PASS: branch membership, invalid/foreign/archived rejection, atomic registration, teacher registration');
} finally {
    if (college) {
        await db.cohortMember.deleteMany({ where: { collegeId: college.id } });
        await db.cohort.deleteMany({ where: { collegeId: college.id } });
        await db.user.deleteMany({ where: { collegeId: college.id } });
        await db.college.delete({ where: { id: college.id } });
    }
    await db.$disconnect();
}
