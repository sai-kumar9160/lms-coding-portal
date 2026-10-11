import { db } from '../../config/db.config.js';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export const platformModel = {
    ping() { return db.$queryRaw`SELECT 1`; },
    async profile(userId) {
        const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
        return { user, college: user.collegeId ? await db.college.findUnique({ where: { id: user.collegeId }, select: { id: true, name: true, slug: true, active: true } }) : null };
    },
    // College a Super Admin may work in through the college switcher (suspended colleges included, deleted ones not).
    switchableCollege(id) {
        return db.college.findFirst({ where: { id, activeIndicator: 1 }, select: { id: true } });
    },
    async listColleges() {
        const [colleges, groups] = await Promise.all([
            db.college.findMany({ where: { activeIndicator: 1 }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { users: true, courses: true } } } }),
            db.user.groupBy({ by: ['collegeId', 'role'], where: { activeIndicator: 1, roleDefinition: { activeIndicator: 1 }, collegeId: { not: null } }, _count: { _all: true } }),
        ]);
        return colleges.map(college => ({ ...college, memberCounts: Object.fromEntries(groups.filter(group => group.collegeId === college.id).map(group => [group.role, group._count._all])) }));
    },
    collegeMembers(id, role) {
        return db.college.findUniqueOrThrow({ where: { id, activeIndicator: 1 }, select: {
            users: { where: { role, activeIndicator: 1, roleDefinition: { activeIndicator: 1 } }, orderBy: [{ name: 'asc' }, { id: 'asc' }],
                select: { id: true, name: true, mobileNo: true, email: true } },
        } }).then(college => college.users);
    },
    async createCollege(identity, input) {
        const password = await bcrypt.hash(input.adminPassword, 12);
        return db.college.create({ data: { name: input.name, slug: input.slug, createdBy: identity.id, users: { create: { name: input.adminName, email: input.adminEmail, password, role: Role.COLLEGE_ADMIN, createdBy: identity.id } } } });
    },
    updateCollegeMember(identity, collegeId, id, input) {
        return db.$transaction(async transaction => {
            await transaction.college.findUniqueOrThrow({ where: { id: collegeId, activeIndicator: 1 } });
            const where = { id, collegeId, activeIndicator: 1, role: { in: [Role.COLLEGE_ADMIN, Role.TEACHER, Role.STUDENT] }, roleDefinition: { activeIndicator: 1 } };
            const select = { id: true, name: true, email: true, mobileNo: true };
            const before = await transaction.user.findFirstOrThrow({ where, select });
            const after = await transaction.user.update({ where, data: { ...input, updatedBy: identity.id }, select });
            return { before, after };
        });
    },
    setCollegeActive(identity, id, active) {
        return db.college.update({ where: { id, activeIndicator: 1 }, data: { active, updatedBy: identity.id } });
    },
    updateCollege(identity, id, data) {
        return db.$transaction(async transaction => {
            const before = await transaction.college.findUniqueOrThrow({ where: { id, activeIndicator: 1 } });
            const after = await transaction.college.update({ where: { id, activeIndicator: 1 }, data: { ...data, updatedBy: identity.id } });
            return { before, after };
        });
    },
};
