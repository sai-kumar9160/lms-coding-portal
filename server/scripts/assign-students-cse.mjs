import { db } from '../config/db.config.js';

try {
    const result = await db.$transaction(async tx => {
        const students = await tx.user.findMany({ where: { role: 'STUDENT', collegeId: { not: null } }, select: { id: true, collegeId: true } });
        const collegeIds = [...new Set(students.map(student => student.collegeId))];
        let createdGroups = 0;
        for (const collegeId of collegeIds) {
            let group = await tx.cohort.findFirst({ where: { collegeId, name: { equals: 'CSE', mode: 'insensitive' }, activeIndicator: 1, archived: 0 }, orderBy: { createdAt: 'asc' } });
            if (!group) {
                group = await tx.cohort.create({ data: { collegeId, name: 'CSE', description: 'Computer Science and Engineering branch group' } });
                createdGroups++;
            }
            for (const student of students.filter(student => student.collegeId === collegeId)) {
                await tx.cohortMember.upsert({ where: { cohortId_userId: { cohortId: group.id, userId: student.id } }, create: { collegeId, cohortId: group.id, userId: student.id }, update: { activeIndicator: 1, deletedAt: null } });
            }
            const count = await tx.cohortMember.count({ where: { cohortId: group.id, activeIndicator: 1, userId: { in: students.filter(student => student.collegeId === collegeId).map(student => student.id) } } });
            if (count !== students.filter(student => student.collegeId === collegeId).length) throw new Error('CSE assignment verification failed');
        }
        return { studentsAssigned: students.length, colleges: collegeIds.length, createdGroups };
    }, { timeout: 60000 });
    console.log(JSON.stringify(result));
} finally { await db.$disconnect(); }
