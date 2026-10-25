import { db } from '../../../../config/db.config.js';
import { fail, notFound } from '../../../utils/http-error.js';

// Academic masters share one implementation, but every table has its own SQL below.
//   label   : name used in error messages            entity : name written to the audit log
//   find    : one active row of a college ($1 id, $2 college)
//   list    : all active rows of a college ($1 college), with joined names and counts, in display order
//   insert  : $1.. values from values(data, collegeId, userId)       update : values from values(data, id, userId)
//   remove  : soft delete ($1 id, $2 user)      checks : references that must be active rows of the same college
//   inUse   : why an item cannot be removed yet (children still active), or null
const AUDIT = `x.i_ts AS "createdAt", x.u_ts AS "updatedAt", x.crte_usr_id AS "createdBy", x.updte_usr_id AS "updatedBy", x.a_in AS "activeIndicator", x.d_ts AS "deletedAt"`;

export const academicResources = {
    'academic-years': {
        label: 'Academic year', entity: 'academic_year',
        find: `SELECT x.acdmc_yr_id AS "id", x.college_id AS "collegeId", x.acdmc_yr_nm AS "name", x.start_dt AS "startDate", x.end_dt AS "endDate", x.is_crnt_in AS "isCurrent", ${AUDIT}
               FROM acdmc_yr_lst_t x WHERE x.acdmc_yr_id = $1 AND x.college_id = $2 AND x.a_in = 1`,
        list: `SELECT x.acdmc_yr_id AS "id", x.college_id AS "collegeId", x.acdmc_yr_nm AS "name", x.start_dt AS "startDate", x.end_dt AS "endDate", x.is_crnt_in AS "isCurrent", ${AUDIT},
                      (SELECT COUNT(*) FROM btch_lst_t b WHERE b.acdmc_yr_id = x.acdmc_yr_id AND b.a_in = 1) AS "batches"
               FROM acdmc_yr_lst_t x WHERE x.college_id = $1 AND x.a_in = 1 ORDER BY x.start_dt DESC`,
        shape: ({ batches, ...row }) => ({ ...row, _count: { batches } }),
        insert: `INSERT INTO acdmc_yr_lst_t AS x (acdmc_yr_id, college_id, acdmc_yr_nm, start_dt, end_dt, is_crnt_in, crte_usr_id)
                 VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)
                 RETURNING x.acdmc_yr_id AS "id", x.college_id AS "collegeId", x.acdmc_yr_nm AS "name", x.start_dt AS "startDate", x.end_dt AS "endDate", x.is_crnt_in AS "isCurrent", ${AUDIT}`,
        update: `UPDATE acdmc_yr_lst_t x SET acdmc_yr_nm = $1, start_dt = $2, end_dt = $3, is_crnt_in = $4, updte_usr_id = $5 WHERE x.acdmc_yr_id = $6
                 RETURNING x.acdmc_yr_id AS "id", x.college_id AS "collegeId", x.acdmc_yr_nm AS "name", x.start_dt AS "startDate", x.end_dt AS "endDate", x.is_crnt_in AS "isCurrent", ${AUDIT}`,
        values: (d, collegeId, userId) => [collegeId, d.name, d.startDate, d.endDate, d.isCurrent, userId],
        updateValues: (d, id, userId) => [d.name, d.startDate, d.endDate, d.isCurrent, userId, id],
        remove: 'UPDATE acdmc_yr_lst_t SET a_in = 0, updte_usr_id = $2 WHERE acdmc_yr_id = $1',
        checks: [],
        inUse: async (client, id) => await client.one('SELECT 1 FROM btch_lst_t WHERE acdmc_yr_id = $1 AND a_in = 1', [id]) ? 'it still has batches' : null,
    },
    departments: {
        label: 'Department', entity: 'department',
        find: `SELECT x.dept_id AS "id", x.college_id AS "collegeId", x.dept_cd AS "code", x.dept_nm AS "name", x.hod_usr_id AS "hodUserId", ${AUDIT}
               FROM dept_lst_t x WHERE x.dept_id = $1 AND x.college_id = $2 AND x.a_in = 1`,
        list: `SELECT x.dept_id AS "id", x.college_id AS "collegeId", x.dept_cd AS "code", x.dept_nm AS "name", x.hod_usr_id AS "hodUserId", ${AUDIT},
                      h.id AS "hodId", h.name AS "hodName",
                      (SELECT COUNT(*) FROM prgm_lst_t p WHERE p.dept_id = x.dept_id AND p.a_in = 1) AS "programs",
                      (SELECT COUNT(*) FROM tchr_prfl_dtl_t t WHERE t.dept_id = x.dept_id AND t.a_in = 1) AS "teachers"
               FROM dept_lst_t x LEFT JOIN "User" h ON h.id = x.hod_usr_id
               WHERE x.college_id = $1 AND x.a_in = 1 ORDER BY x.dept_nm ASC`,
        shape: ({ hodId, hodName, programs, teachers, ...row }) => ({ ...row, hod: hodId ? { id: hodId, name: hodName } : null, _count: { programs, teachers } }),
        insert: `INSERT INTO dept_lst_t AS x (dept_id, college_id, dept_cd, dept_nm, hod_usr_id, crte_usr_id)
                 VALUES (DEFAULT, $1, $2, $3, $4, $5)
                 RETURNING x.dept_id AS "id", x.college_id AS "collegeId", x.dept_cd AS "code", x.dept_nm AS "name", x.hod_usr_id AS "hodUserId", ${AUDIT}`,
        update: `UPDATE dept_lst_t x SET dept_cd = $1, dept_nm = $2, hod_usr_id = $3, updte_usr_id = $4 WHERE x.dept_id = $5
                 RETURNING x.dept_id AS "id", x.college_id AS "collegeId", x.dept_cd AS "code", x.dept_nm AS "name", x.hod_usr_id AS "hodUserId", ${AUDIT}`,
        values: (d, collegeId, userId) => [collegeId, d.code, d.name, d.hodUserId, userId],
        updateValues: (d, id, userId) => [d.code, d.name, d.hodUserId, userId, id],
        remove: 'UPDATE dept_lst_t SET a_in = 0, updte_usr_id = $2 WHERE dept_id = $1',
        checks: [{ field: 'hodUserId', message: 'Head of department must be an active teacher of this college',
                   sql: `SELECT 1 FROM "User" WHERE id = $1 AND "collegeId" = $2 AND role = 'TEACHER' AND status = 'ACTIVE' AND a_in = 1` }],
        inUse: async (client, id) => await client.one('SELECT 1 FROM prgm_lst_t WHERE dept_id = $1 AND a_in = 1', [id]) ? 'it still has programmes' : null,
    },
    programs: {
        label: 'Programme', entity: 'program',
        find: `SELECT x.prgm_id AS "id", x.college_id AS "collegeId", x.dept_id AS "departmentId", x.prgm_cd AS "code", x.prgm_nm AS "name", x.duration_yrs_ct AS "durationYears", ${AUDIT}
               FROM prgm_lst_t x WHERE x.prgm_id = $1 AND x.college_id = $2 AND x.a_in = 1`,
        list: `SELECT x.prgm_id AS "id", x.college_id AS "collegeId", x.dept_id AS "departmentId", x.prgm_cd AS "code", x.prgm_nm AS "name", x.duration_yrs_ct AS "durationYears", ${AUDIT},
                      d.dept_cd AS "deptCode", d.dept_nm AS "deptName",
                      (SELECT COUNT(*) FROM btch_lst_t b WHERE b.prgm_id = x.prgm_id AND b.a_in = 1) AS "batches"
               FROM prgm_lst_t x JOIN dept_lst_t d ON d.dept_id = x.dept_id
               WHERE x.college_id = $1 AND x.a_in = 1 ORDER BY x.prgm_nm ASC`,
        shape: ({ deptCode, deptName, batches, ...row }) => ({ ...row, department: { id: row.departmentId, code: deptCode, name: deptName }, _count: { batches } }),
        insert: `INSERT INTO prgm_lst_t AS x (prgm_id, college_id, dept_id, prgm_cd, prgm_nm, duration_yrs_ct, crte_usr_id)
                 VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)
                 RETURNING x.prgm_id AS "id", x.college_id AS "collegeId", x.dept_id AS "departmentId", x.prgm_cd AS "code", x.prgm_nm AS "name", x.duration_yrs_ct AS "durationYears", ${AUDIT}`,
        update: `UPDATE prgm_lst_t x SET dept_id = $1, prgm_cd = $2, prgm_nm = $3, duration_yrs_ct = $4, updte_usr_id = $5 WHERE x.prgm_id = $6
                 RETURNING x.prgm_id AS "id", x.college_id AS "collegeId", x.dept_id AS "departmentId", x.prgm_cd AS "code", x.prgm_nm AS "name", x.duration_yrs_ct AS "durationYears", ${AUDIT}`,
        values: (d, collegeId, userId) => [collegeId, d.departmentId, d.code, d.name, d.durationYears, userId],
        updateValues: (d, id, userId) => [d.departmentId, d.code, d.name, d.durationYears, userId, id],
        remove: 'UPDATE prgm_lst_t SET a_in = 0, updte_usr_id = $2 WHERE prgm_id = $1',
        checks: [{ field: 'departmentId', message: 'Choose an existing department from this college',
                   sql: 'SELECT 1 FROM dept_lst_t WHERE dept_id = $1 AND college_id = $2 AND a_in = 1' }],
        inUse: async (client, id) => await client.one('SELECT 1 FROM btch_lst_t WHERE prgm_id = $1 AND a_in = 1', [id]) ? 'it still has batches' : null,
    },
    batches: {
        label: 'Batch', entity: 'batch',
        find: `SELECT x.btch_id AS "id", x.college_id AS "collegeId", x.prgm_id AS "programId", x.acdmc_yr_id AS "academicYearId", x.btch_nm AS "name", x.section_tx AS "section", ${AUDIT}
               FROM btch_lst_t x WHERE x.btch_id = $1 AND x.college_id = $2 AND x.a_in = 1`,
        list: `SELECT x.btch_id AS "id", x.college_id AS "collegeId", x.prgm_id AS "programId", x.acdmc_yr_id AS "academicYearId", x.btch_nm AS "name", x.section_tx AS "section", ${AUDIT},
                      p.prgm_cd AS "prgmCode", p.prgm_nm AS "prgmName", y.acdmc_yr_nm AS "yearName",
                      (SELECT COUNT(*) FROM stdnt_prfl_dtl_t s WHERE s.btch_id = x.btch_id AND s.a_in = 1) AS "students",
                      (SELECT COUNT(*) FROM chrt_lst_t c WHERE c.btch_id = x.btch_id AND c.a_in = 1) AS "cohorts"
               FROM btch_lst_t x JOIN prgm_lst_t p ON p.prgm_id = x.prgm_id JOIN acdmc_yr_lst_t y ON y.acdmc_yr_id = x.acdmc_yr_id
               WHERE x.college_id = $1 AND x.a_in = 1 ORDER BY x.i_ts DESC`,
        shape: ({ prgmCode, prgmName, yearName, students, cohorts, ...row }) => ({ ...row, program: { id: row.programId, code: prgmCode, name: prgmName }, academicYear: { id: row.academicYearId, name: yearName }, _count: { students, cohorts } }),
        insert: `INSERT INTO btch_lst_t AS x (btch_id, college_id, prgm_id, acdmc_yr_id, btch_nm, section_tx, crte_usr_id)
                 VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)
                 RETURNING x.btch_id AS "id", x.college_id AS "collegeId", x.prgm_id AS "programId", x.acdmc_yr_id AS "academicYearId", x.btch_nm AS "name", x.section_tx AS "section", ${AUDIT}`,
        update: `UPDATE btch_lst_t x SET prgm_id = $1, acdmc_yr_id = $2, btch_nm = $3, section_tx = $4, updte_usr_id = $5 WHERE x.btch_id = $6
                 RETURNING x.btch_id AS "id", x.college_id AS "collegeId", x.prgm_id AS "programId", x.acdmc_yr_id AS "academicYearId", x.btch_nm AS "name", x.section_tx AS "section", ${AUDIT}`,
        values: (d, collegeId, userId) => [collegeId, d.programId, d.academicYearId, d.name, d.section, userId],
        updateValues: (d, id, userId) => [d.programId, d.academicYearId, d.name, d.section, userId, id],
        remove: 'UPDATE btch_lst_t SET a_in = 0, updte_usr_id = $2 WHERE btch_id = $1',
        checks: [{ field: 'programId', message: 'Choose an existing programme from this college', sql: 'SELECT 1 FROM prgm_lst_t WHERE prgm_id = $1 AND college_id = $2 AND a_in = 1' },
                 { field: 'academicYearId', message: 'Choose an existing academic year from this college', sql: 'SELECT 1 FROM acdmc_yr_lst_t WHERE acdmc_yr_id = $1 AND college_id = $2 AND a_in = 1' }],
        inUse: async (client, id) => await client.one('SELECT 1 FROM stdnt_prfl_dtl_t WHERE btch_id = $1 AND a_in = 1', [id]) ? 'students are still assigned to it'
            : await client.one('SELECT 1 FROM chrt_lst_t WHERE btch_id = $1 AND a_in = 1', [id]) ? 'it still has cohorts' : null,
    },
    cohorts: {
        label: 'Cohort', entity: 'cohort',
        find: `SELECT x.chrt_id AS "id", x.college_id AS "collegeId", x.chrt_nm AS "name", x.chrt_dscn_tx AS "description", x.btch_id AS "batchId", x.archived_in AS "archived", ${AUDIT}
               FROM chrt_lst_t x WHERE x.chrt_id = $1 AND x.college_id = $2 AND x.a_in = 1`,
        list: `SELECT x.chrt_id AS "id", x.college_id AS "collegeId", x.chrt_nm AS "name", x.chrt_dscn_tx AS "description", x.btch_id AS "batchId", x.archived_in AS "archived", ${AUDIT},
                      b.btch_nm AS "batchName", b.section_tx AS "batchSection",
                      (SELECT COUNT(*) FROM chrt_mbr_rel_t m WHERE m.chrt_id = x.chrt_id AND m.a_in = 1) AS "members"
               FROM chrt_lst_t x LEFT JOIN btch_lst_t b ON b.btch_id = x.btch_id
               WHERE x.college_id = $1 AND x.a_in = 1 ORDER BY x.archived_in ASC, x.chrt_nm ASC`,
        shape: ({ batchName, batchSection, members, ...row }) => ({ ...row, batch: row.batchId ? { id: row.batchId, name: batchName, section: batchSection } : null, _count: { members } }),
        insert: `INSERT INTO chrt_lst_t AS x (college_id, chrt_nm, chrt_dscn_tx, btch_id, archived_in, crte_usr_id)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING x.chrt_id AS "id", x.college_id AS "collegeId", x.chrt_nm AS "name", x.chrt_dscn_tx AS "description", x.btch_id AS "batchId", x.archived_in AS "archived", ${AUDIT}`,
        update: `UPDATE chrt_lst_t x SET chrt_nm = $1, chrt_dscn_tx = $2, btch_id = $3, archived_in = $4, updte_usr_id = $5 WHERE x.chrt_id = $6
                 RETURNING x.chrt_id AS "id", x.college_id AS "collegeId", x.chrt_nm AS "name", x.chrt_dscn_tx AS "description", x.btch_id AS "batchId", x.archived_in AS "archived", ${AUDIT}`,
        values: (d, collegeId, userId) => [collegeId, d.name, d.description, d.batchId, d.archived, userId],
        updateValues: (d, id, userId) => [d.name, d.description, d.batchId, d.archived, userId, id],
        remove: 'UPDATE chrt_lst_t SET a_in = 0, updte_usr_id = $2 WHERE chrt_id = $1',
        checks: [{ field: 'batchId', message: 'Choose an existing batch from this college', sql: 'SELECT 1 FROM btch_lst_t WHERE btch_id = $1 AND college_id = $2 AND a_in = 1' }],
        inUse: async () => null,
    },
};

// Every non-empty reference must be an active row in the same college.
async function checkRefs(client, config, collegeId, data) {
    for (const check of config.checks)
        if (data[check.field] && !await client.one(check.sql, [data[check.field], collegeId]))
            fail(400, check.message);
}

async function find(client, config, collegeId, id) {
    const item = await client.one(config.find, [id, collegeId]);
    if (!item)
        notFound(config.label);
    return item;
}

// Saves an item; making an academic year current clears the flag on the college's other years.
async function save(identity, config, collegeId, data, id) {
    return db.transaction(async client => {
        const before = id ? await find(client, config, collegeId, id) : null;
        await checkRefs(client, config, collegeId, data);
        if (config === academicResources['academic-years'] && data.isCurrent)
            await client.run('UPDATE acdmc_yr_lst_t SET is_crnt_in = 0, updte_usr_id = $2 WHERE college_id = $1 AND is_crnt_in = 1 AND a_in = 1 AND ($3::int IS NULL OR acdmc_yr_id <> $3)', [collegeId, identity.id, id]);
        const after = id
            ? await client.one(config.update, config.updateValues(data, id, identity.id))
            : await client.one(config.insert, config.values(data, collegeId, identity.id));
        return { before, after };
    });
}

export const academicMdl = {
    async list(config, collegeId) {
        return (await db.many(config.list, [collegeId])).map(config.shape);
    },
    create: (identity, config, collegeId, data) => save(identity, config, collegeId, data, null),
    update: (identity, config, collegeId, id, data) => save(identity, config, collegeId, data, id),
    // Soft delete, refused while active children still depend on the item.
    async remove(identity, config, collegeId, id) {
        return db.transaction(async client => {
            const before = await find(client, config, collegeId, id);
            const reason = await config.inUse(client, id);
            if (reason)
                fail(409, `${config.label} cannot be removed because ${reason}`);
            await client.run(config.remove, [id, identity.id]);
            return before;
        });
    },
    async members(collegeId, cohortId) {
        await find(db, academicResources.cohorts, collegeId, cohortId);
        const rows = await db.many(
            `SELECT m.user_id AS "userId", m.i_ts AS "createdAt", u.name, u.email, s.roll_no AS "rollNumber", s.user_id IS NOT NULL AS "hasProfile"
             FROM chrt_mbr_rel_t m JOIN "User" u ON u.id = m.user_id LEFT JOIN stdnt_prfl_dtl_t s ON s.user_id = u.id
             WHERE m.chrt_id = $1 AND m.a_in = 1 AND u.a_in = 1 ORDER BY m.i_ts ASC`, [cohortId]);
        return rows.map(row => ({ userId: row.userId, createdAt: row.createdAt, user: { name: row.name, email: row.email, studentProfile: row.hasProfile ? { rollNumber: row.rollNumber } : null } }));
    },
    // Adds students of this college; re-adding a removed student restores them.
    async addMembers(identity, collegeId, cohortId, userIds) {
        const cohort = await find(db, academicResources.cohorts, collegeId, cohortId);
        if (cohort.archived)
            fail(409, 'Archived cohorts cannot change');
        const students = await db.many(`SELECT id FROM "User" WHERE id = ANY($1::int[]) AND "collegeId" = $2 AND role = 'STUDENT' AND a_in = 1`, [userIds, collegeId]);
        if (students.length !== new Set(userIds).size)
            fail(400, 'Cohort members must be active students of this college');
        await db.transaction(async tx => {
            for (const student of students)
                await tx.run(
                    `INSERT INTO chrt_mbr_rel_t (chrt_mbr_id, chrt_id, user_id, college_id, crte_usr_id) VALUES (DEFAULT, $1, $2, $3, $4)
                     ON CONFLICT (chrt_id, user_id) DO UPDATE SET a_in = 1, updte_usr_id = $4`, [cohortId, student.id, collegeId, identity.id]);
        });
        return { added: students.length };
    },
    async removeMember(identity, collegeId, cohortId, userId) {
        const cohort = await find(db, academicResources.cohorts, collegeId, cohortId);
        if (cohort.archived)
            fail(409, 'Archived cohorts cannot change');
        const changed = await db.run('UPDATE chrt_mbr_rel_t SET a_in = 0, updte_usr_id = $3 WHERE chrt_id = $1 AND user_id = $2 AND a_in = 1', [cohortId, userId, identity.id]);
        if (!changed)
            notFound('Cohort member');
        return { success: true };
    },
};
