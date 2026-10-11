import { db } from '../../config/db.config.js';
import { fail, notFound } from '../utils/http-error.js';

const active = { activeIndicator: 1 };
const nameOf = { academicYear: 'Academic year', department: 'Department', program: 'Programme', batch: 'Batch', cohort: 'Cohort' };

// Academic masters share one implementation. refs: foreign keys that must point to an active row of the same college.
// inUse: why an item cannot be removed yet (children still active), or null.
export const academicResources = {
    'academic-years': {
        model: 'academicYear', entity: 'academic_year', orderBy: [{ startDate: 'desc' }],
        include: { _count: { select: { batches: { where: active } } } },
        inUse: async (client, id) => await client.batch.count({ where: { academicYearId: id, ...active } }) ? 'it still has batches' : null,
    },
    departments: {
        model: 'department', entity: 'department', orderBy: [{ name: 'asc' }],
        include: { hod: { select: { id: true, name: true } }, _count: { select: { programs: { where: active }, teachers: { where: active } } } },
        inUse: async (client, id) => await client.program.count({ where: { departmentId: id, ...active } }) ? 'it still has programmes' : null,
    },
    programs: {
        model: 'program', entity: 'program', orderBy: [{ name: 'asc' }], refs: { departmentId: 'department' },
        include: { department: { select: { id: true, code: true, name: true } }, _count: { select: { batches: { where: active } } } },
        inUse: async (client, id) => await client.batch.count({ where: { programId: id, ...active } }) ? 'it still has batches' : null,
    },
    batches: {
        model: 'batch', entity: 'batch', orderBy: [{ createdAt: 'desc' }], refs: { programId: 'program', academicYearId: 'academicYear' },
        include: { program: { select: { id: true, code: true, name: true } }, academicYear: { select: { id: true, name: true } }, _count: { select: { students: { where: active }, cohorts: { where: active } } } },
        inUse: async (client, id) => await client.studentProfile.count({ where: { batchId: id, ...active } }) ? 'students are still assigned to it'
            : await client.cohort.count({ where: { batchId: id, ...active } }) ? 'it still has cohorts' : null,
    },
    cohorts: {
        model: 'cohort', entity: 'cohort', orderBy: [{ archived: 'asc' }, { name: 'asc' }], refs: { batchId: 'batch' },
        include: { batch: { select: { id: true, name: true, section: true } }, _count: { select: { members: { where: active } } } },
        inUse: async () => null,
    },
};

// Every non-empty reference must be an active row in the same college.
async function checkRefs(client, config, collegeId, data) {
    for (const [field, model] of Object.entries(config.refs || {})) {
        if (data[field] && !await client[model].findFirst({ where: { id: data[field], collegeId, ...active } }))
            fail(400, `Choose an existing ${nameOf[model].toLowerCase()} from this college`);
    }
    if (data.hodUserId && !await client.user.findFirst({ where: { id: data.hodUserId, collegeId, role: 'TEACHER', status: 'ACTIVE', ...active } }))
        fail(400, 'Head of department must be an active teacher of this college');
}

async function find(client, config, collegeId, id) {
    const item = await client[config.model].findFirst({ where: { id, collegeId, ...active } });
    if (!item)
        notFound(nameOf[config.model]);
    return item;
}

// Saves an item; making an academic year current clears the flag on the college's other years.
async function save(identity, config, collegeId, data, id) {
    return db.$transaction(async client => {
        const before = id ? await find(client, config, collegeId, id) : null;
        await checkRefs(client, config, collegeId, data);
        if (config.model === 'academicYear' && data.isCurrent)
            await client.academicYear.updateMany({ where: { collegeId, isCurrent: 1, ...active, ...(id ? { id: { not: id } } : {}) }, data: { isCurrent: 0, updatedBy: identity.id } });
        const after = id
            ? await client[config.model].update({ where: { id }, data: { ...data, updatedBy: identity.id } })
            : await client[config.model].create({ data: { ...data, collegeId, createdBy: identity.id } });
        return { before, after };
    });
}

export const academicModel = {
    list(config, collegeId) {
        return db[config.model].findMany({ where: { collegeId, ...active }, include: config.include, orderBy: config.orderBy });
    },
    create: (identity, config, collegeId, data) => save(identity, config, collegeId, data, null),
    update: (identity, config, collegeId, id, data) => save(identity, config, collegeId, data, id),
    // Soft delete, refused while active children still depend on the item.
    async remove(identity, config, collegeId, id) {
        return db.$transaction(async client => {
            const before = await find(client, config, collegeId, id);
            const reason = await config.inUse(client, id);
            if (reason)
                fail(409, `${nameOf[config.model]} cannot be removed because ${reason}`);
            await client[config.model].update({ where: { id }, data: { activeIndicator: 0, updatedBy: identity.id } });
            return before;
        });
    },
    async members(collegeId, cohortId) {
        await find(db, academicResources.cohorts, collegeId, cohortId);
        return db.cohortMember.findMany({ where: { cohortId, ...active, user: active }, orderBy: { createdAt: 'asc' }, select: { userId: true, createdAt: true, user: { select: { name: true, email: true, studentProfile: { select: { rollNumber: true } } } } } });
    },
    // Adds students of this college; re-adding a removed student restores them.
    async addMembers(identity, collegeId, cohortId, userIds) {
        const cohort = await find(db, academicResources.cohorts, collegeId, cohortId);
        if (cohort.archived)
            fail(409, 'Archived cohorts cannot change');
        const students = await db.user.findMany({ where: { id: { in: userIds }, collegeId, role: 'STUDENT', ...active }, select: { id: true } });
        if (students.length !== new Set(userIds).size)
            fail(400, 'Cohort members must be active students of this college');
        await db.$transaction(students.map(student => db.cohortMember.upsert({
            where: { cohortId_userId: { cohortId, userId: student.id } },
            create: { cohortId, userId: student.id, collegeId, createdBy: identity.id },
            update: { activeIndicator: 1, updatedBy: identity.id },
        })));
        return { added: students.length };
    },
    async removeMember(identity, collegeId, cohortId, userId) {
        const cohort = await find(db, academicResources.cohorts, collegeId, cohortId);
        if (cohort.archived)
            fail(409, 'Archived cohorts cannot change');
        const result = await db.cohortMember.updateMany({ where: { cohortId, userId, ...active }, data: { activeIndicator: 0, updatedBy: identity.id } });
        if (!result.count)
            notFound('Cohort member');
        return { success: true };
    },
};
