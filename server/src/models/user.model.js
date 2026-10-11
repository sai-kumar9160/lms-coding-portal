import { db } from '../../config/db.config.js';
import bcrypt from 'bcryptjs';
import { Role, UserStatus } from '@prisma/client';
import { fail, notFound } from '../utils/http-error.js';

const active = { activeIndicator: 1 };
const listFields = {
    id: true, name: true, email: true, mobileNo: true, role: true, roleId: true, status: true,
    cohorts: { where: { activeIndicator: 1, cohort: { activeIndicator: 1, archived: 0 } }, select: { cohort: { select: { id: true, name: true } } } },
    studentProfile: { select: { rollNumber: true, batchId: true, admissionYear: true, dateOfBirth: true, gender: true, guardianPhone: true, batch: { select: { name: true, section: true } } } },
    teacherProfile: { select: { employeeCode: true, departmentId: true, designation: true, qualification: true, department: { select: { name: true } } } },
};
// Teachers see roll number and batch only, never a student's date of birth, gender or guardian phone.
const teacherVisibleFields = { ...listFields, studentProfile: { select: { rollNumber: true, batch: { select: { name: true, section: true } } } } };
// College Admins manage teachers and students of their own college, never other admins.
const managedUser = (collegeId, id) => ({ id, collegeId, activeIndicator: 1, role: { in: [Role.TEACHER, Role.STUDENT] } });

export const userModel = {
    branchOptions(collegeId) {
        return db.cohort.findMany({ where: { collegeId, ...active, archived: 0 }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
    },
    async saveBranches(identity, collegeId, id, branchGroupIds) {
        if (!['SUPER_ADMIN', 'COLLEGE_ADMIN'].includes(identity.role)) fail(403, 'Only admins can assign branches');
        return db.$transaction(async tx => {
            if (!await tx.user.findFirst({ where: { id, collegeId, role: 'STUDENT', ...active } })) notFound('Student');
            const branches = await tx.cohort.findMany({ where: { id: { in: branchGroupIds }, collegeId, ...active, archived: 0 }, select: { id: true, name: true } });
            if (branches.length !== branchGroupIds.length) fail(400, 'Choose active branch groups of this college');
            const before = await tx.cohortMember.findMany({ where: { userId: id, collegeId, ...active, cohort: { ...active, archived: 0 } }, select: { cohortId: true } });
            await tx.cohortMember.updateMany({ where: { userId: id, collegeId, cohortId: { in: before.map(row => row.cohortId).filter(groupId => !branchGroupIds.includes(groupId)) } }, data: { activeIndicator: 0, updatedBy: identity.id } });
            for (const cohortId of branchGroupIds) await tx.cohortMember.upsert({ where: { cohortId_userId: { cohortId, userId: id } }, create: { collegeId, cohortId, userId: id, createdBy: identity.id }, update: { activeIndicator: 1, deletedAt: null, updatedBy: identity.id } });
            return { before: before.map(row => row.cohortId), branches, branchGroupIds };
        });
    },
    list(identity, collegeId) {
        // Pending accounts are visible only to admins, listed first for approval.
        const admin = identity.role === Role.COLLEGE_ADMIN || identity.role === Role.SUPER_ADMIN;
        return db.user.findMany({ where: { collegeId, activeIndicator: 1, ...(admin ? {} : { status: UserStatus.ACTIVE }) }, select: admin ? listFields : teacherVisibleFields, orderBy: [{ status: 'asc' }, { name: 'asc' }] });
    },
    async create(identity, collegeId, input) {
        if (input.role === Role.COLLEGE_ADMIN && identity.role !== Role.SUPER_ADMIN)
            fail(403, 'Only Super Admin can add college admins');
        return db.user.create({ data: { ...input, password: await bcrypt.hash(input.password, 12), collegeId, createdBy: identity.id } });
    },
    async approve(identity, collegeId, id) {
        const result = await db.user.updateMany({ where: { ...managedUser(collegeId, id), status: UserStatus.PENDING }, data: { status: UserStatus.ACTIVE, updatedBy: identity.id } });
        if (!result.count) notFound('Pending user');
        return { success: true };
    },
    // Deactivation also rejects a pending registration. Existing sessions are revoked immediately.
    async deactivate(identity, collegeId, id) {
        return db.$transaction(async transaction => {
            const result = await transaction.user.updateMany({ where: managedUser(collegeId, id), data: { activeIndicator: 0, updatedBy: identity.id } });
            if (!result.count) notFound('User');
            await transaction.session.deleteMany({ where: { userId: id } });
            return { success: true };
        });
    },
    // Role decides which profile applies: STUDENT -> student profile, TEACHER -> teacher profile.
    async managedRole(collegeId, id) {
        const user = await db.user.findFirst({ where: managedUser(collegeId, id), select: { role: true } });
        if (!user) notFound('User');
        return user.role;
    },
    // Creates or replaces a student/teacher profile; batch and department must be active and in this college.
    async saveProfile(identity, collegeId, id, role, data) {
        const student = role === Role.STUDENT;
        const ref = student ? data.batchId && await db.batch.findFirst({ where: { id: data.batchId, collegeId, ...active } }) : data.departmentId && await db.department.findFirst({ where: { id: data.departmentId, collegeId, ...active } });
        if ((student ? data.batchId : data.departmentId) && !ref)
            fail(400, student ? 'Choose an existing batch from this college' : 'Choose an existing department from this college');
        const model = student ? db.studentProfile : db.teacherProfile;
        const before = await model.findUnique({ where: { userId: id } });
        const after = await model.upsert({ where: { userId: id }, create: { ...data, userId: id, collegeId, createdBy: identity.id }, update: { ...data, activeIndicator: 1, updatedBy: identity.id } });
        return { before, after };
    },
};
