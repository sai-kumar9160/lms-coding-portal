import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../config/db.config.js';
import { performanceMdl, POINTS } from './modules/performance/models/performanceMdl.js';

after(() => db.end());

test('a student sees points, a rank inside their college and a breakdown that adds up', async () => {
    const student = await db.one(`SELECT id, "collegeId" FROM "User" WHERE role = 'STUDENT' AND a_in = 1 AND status = 'ACTIVE' ORDER BY "collegeId", email LIMIT 1`);
    const mine = await performanceMdl.forStudent({ id: student.id, role: 'STUDENT' }, student.collegeId);
    const { problems, lessons, assessments } = mine.breakdown;
    assert.equal(mine.points, problems.solved * POINTS.problem + lessons.completed * POINTS.lesson + assessments.averagePercent);
    assert.ok(mine.rank >= 1 && mine.rank <= mine.totalStudents);
    assert.ok(mine.aheadOfPercent >= 0 && mine.aheadOfPercent <= 100);
    assert.ok(mine.leaderboard.length <= 5 && mine.leaderboard.every((row, i, all) => i === 0 || all[i - 1].points >= row.points), 'the leaderboard is sorted');
    assert.equal(mine.leaderboard[0].rank, 1);
});

test('students of another college are not part of the ranking', async () => {
    const total = await db.one(`SELECT COUNT(*)::int AS n FROM "User" WHERE "collegeId" = (SELECT "collegeId" FROM "User" WHERE role = 'STUDENT' AND a_in = 1 AND status = 'ACTIVE' ORDER BY "collegeId", email LIMIT 1) AND role = 'STUDENT' AND a_in = 1 AND status = 'ACTIVE'`);
    const student = await db.one(`SELECT id, "collegeId" FROM "User" WHERE role = 'STUDENT' AND a_in = 1 AND status = 'ACTIVE' ORDER BY "collegeId", email LIMIT 1`);
    assert.equal((await performanceMdl.forStudent({ id: student.id, role: 'STUDENT' }, student.collegeId)).totalStudents, total.n);
});
