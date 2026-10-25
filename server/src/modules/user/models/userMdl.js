import { db } from '../../../../config/db.config.js';
import bcrypt from 'bcryptjs';
import { Role, UserStatus } from '../../../utils/enums.js';
import { fail, notFound } from '../../../utils/http-error.js';

// College Admins manage teachers and students of their own college, never other admins.
const MANAGED = `u.id = $1 AND u."collegeId" = $2 AND u.a_in = 1 AND u.role IN ('TEACHER', 'STUDENT')`;

export const userMdl = {
    branchOptions(collegeId) {
        return db.many(`SELECT c.chrt_id AS "id", c.chrt_nm AS "name" FROM chrt_lst_t c WHERE c.college_id = $1 AND c.a_in = 1 AND c.archived_in = 0 ORDER BY c.chrt_nm ASC`, [collegeId]);
    },
    async saveBranches(identity, collegeId, id, branchGroupIds) {
        if (!['SUPER_ADMIN', 'COLLEGE_ADMIN'].includes(identity.role)) fail(403, 'Only admins can assign branches');
        return db.transaction(async tx => {
            if (!await tx.one(`SELECT 1 FROM "User" WHERE id = $1 AND "collegeId" = $2 AND role = 'STUDENT' AND a_in = 1`, [id, collegeId])) notFound('Student');
            const branches = await tx.many(
                `SELECT c.chrt_id AS "id", c.chrt_nm AS "name" FROM chrt_lst_t c
                 WHERE c.chrt_id = ANY($1::int[]) AND c.college_id = $2 AND c.a_in = 1 AND c.archived_in = 0`, [branchGroupIds, collegeId]);
            if (branches.length !== branchGroupIds.length) fail(400, 'Choose active branch groups of this college');
            const before = (await tx.many(
                `SELECT m.chrt_id AS "cohortId" FROM chrt_mbr_rel_t m JOIN chrt_lst_t c ON c.chrt_id = m.chrt_id
                 WHERE m.user_id = $1 AND m.college_id = $2 AND m.a_in = 1 AND c.a_in = 1 AND c.archived_in = 0`, [id, collegeId])).map(row => row.cohortId);
            const removed = before.filter(groupId => !branchGroupIds.includes(groupId));
            await tx.run('UPDATE chrt_mbr_rel_t SET a_in = 0, updte_usr_id = $4 WHERE user_id = $1 AND college_id = $2 AND chrt_id = ANY($3::int[])', [id, collegeId, removed, identity.id]);
            for (const cohortId of branchGroupIds)
                await tx.run(
                    `INSERT INTO chrt_mbr_rel_t (chrt_mbr_id, college_id, chrt_id, user_id, crte_usr_id) VALUES (DEFAULT, $1, $2, $3, $4)
                     ON CONFLICT (chrt_id, user_id) DO UPDATE SET a_in = 1, d_ts = NULL, updte_usr_id = $4`, [collegeId, cohortId, id, identity.id]);
            return { before, branches, branchGroupIds };
        });
    },
    async list(identity, collegeId) {
        // Pending accounts are visible only to admins, listed first for approval.
        const admin = identity.role === Role.COLLEGE_ADMIN || identity.role === Role.SUPER_ADMIN;
        const users = await db.many(
            `SELECT u.id AS "id", u.name AS "name", u.email AS "email", u.mobile_no AS "mobileNo", u.role AS "role", u.role_id AS "roleId", u.status AS "status" FROM "User" u
             WHERE u."collegeId" = $1 AND u.a_in = 1 ${admin ? '' : `AND u.status = 'ACTIVE'`}
             ORDER BY u.status ASC, u.name ASC`, [collegeId]);
        const ids = users.map(user => user.id);
        const [memberships, students, teachers] = await Promise.all([
            db.many(
                `SELECT m.user_id AS "userId", c.chrt_id AS id, c.chrt_nm AS name
                 FROM chrt_mbr_rel_t m JOIN chrt_lst_t c ON c.chrt_id = m.chrt_id
                 WHERE m.user_id = ANY($1::int[]) AND m.a_in = 1 AND c.a_in = 1 AND c.archived_in = 0 ORDER BY m.i_ts`, [ids]),
            db.many(
                `SELECT s.user_id AS "userId", s.roll_no AS "rollNumber", s.btch_id AS "batchId", s.admsn_yr AS "admissionYear", s.dob_dt AS "dateOfBirth",
                        s.gndr_cd AS gender, s.grdn_phone_no AS "guardianPhone", b.btch_nm AS "batchName", b.section_tx AS "batchSection"
                 FROM stdnt_prfl_dtl_t s LEFT JOIN btch_lst_t b ON b.btch_id = s.btch_id WHERE s.user_id = ANY($1::int[])`, [ids]),
            db.many(
                `SELECT t.user_id AS "userId", t.emp_cd AS "employeeCode", t.dept_id AS "departmentId", t.dsgntn_tx AS designation, t.qlfctn_tx AS qualification, d.dept_nm AS "departmentName"
                 FROM tchr_prfl_dtl_t t LEFT JOIN dept_lst_t d ON d.dept_id = t.dept_id WHERE t.user_id = ANY($1::int[])`, [ids]),
        ]);
        const studentOf = new Map(students.map(row => [row.userId, row]));
        const teacherOf = new Map(teachers.map(row => [row.userId, row]));
        return users.map(user => {
            const s = studentOf.get(user.id), t = teacherOf.get(user.id);
            const batch = s?.batchId ? { name: s.batchName, section: s.batchSection } : null;
            return {
                ...user,
                cohorts: memberships.filter(row => row.userId === user.id).map(row => ({ cohort: { id: row.id, name: row.name } })),
                // Teachers see roll number and batch only, never a student's date of birth, gender or guardian phone.
                studentProfile: !s ? null : admin
                    ? { rollNumber: s.rollNumber, batchId: s.batchId, admissionYear: s.admissionYear, dateOfBirth: s.dateOfBirth, gender: s.gender, guardianPhone: s.guardianPhone, batch }
                    : { rollNumber: s.rollNumber, batch },
                teacherProfile: !t ? null : { employeeCode: t.employeeCode, departmentId: t.departmentId, designation: t.designation, qualification: t.qualification, department: t.departmentId ? { name: t.departmentName } : null },
            };
        });
    },
    async create(identity, collegeId, input) {
        if (input.role === Role.COLLEGE_ADMIN && identity.role !== Role.SUPER_ADMIN)
            fail(403, 'Only Super Admin can add college admins');
        return db.one(
            `INSERT INTO "User" (id, name, email, mobile_no, password, role, "collegeId", crte_usr_id) VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7)
             RETURNING id AS "id", name AS "name", email AS "email", mobile_no AS "mobileNo", password AS "password", role AS "role", role_id AS "roleId",
                           status AS "status", "collegeId" AS "collegeId", i_ts AS "createdAt", u_ts AS "updatedAt", crte_usr_id AS "createdBy",
                           updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`,
            [input.name, input.email, input.mobileNo, await bcrypt.hash(input.password, 12), input.role, collegeId, identity.id]);
    },
    async approve(identity, collegeId, id) {
        const changed = await db.run(`UPDATE "User" u SET status = 'ACTIVE', updte_usr_id = $3 WHERE ${MANAGED} AND u.status = 'PENDING'`, [id, collegeId, identity.id]);
        if (!changed) notFound('Pending user');
        return { success: true };
    },
    // Deactivation also rejects a pending registration. Existing sessions are revoked immediately.
    async deactivate(identity, collegeId, id) {
        return db.transaction(async tx => {
            if (!await tx.run(`UPDATE "User" u SET a_in = 0, updte_usr_id = $3 WHERE ${MANAGED}`, [id, collegeId, identity.id])) notFound('User');
            await tx.run('DELETE FROM "Session" WHERE "userId" = $1', [id]);
            return { success: true };
        });
    },
    // Role decides which profile applies: STUDENT -> student profile, TEACHER -> teacher profile.
    async managedRole(collegeId, id) {
        const user = await db.one(`SELECT u.role FROM "User" u WHERE ${MANAGED}`, [id, collegeId]);
        if (!user) notFound('User');
        return user.role;
    },
    // Creates or replaces a student/teacher profile; batch and department must be active and in this college.
    async saveProfile(identity, collegeId, id, role, data) {
        return role === Role.STUDENT ? saveStudentProfile(identity, collegeId, id, data) : saveTeacherProfile(identity, collegeId, id, data);
    },
};

async function saveStudentProfile(identity, collegeId, id, data) {
    if (data.batchId && !await db.one('SELECT 1 FROM btch_lst_t WHERE btch_id = $1 AND college_id = $2 AND a_in = 1', [data.batchId, collegeId]))
        fail(400, 'Choose an existing batch from this college');
    const QRY_COLUMNS = `stdnt_prfl_id AS "id", user_id AS "userId", college_id AS "collegeId", roll_no AS "rollNumber", btch_id AS "batchId", admsn_yr AS "admissionYear",
                       dob_dt AS "dateOfBirth", gndr_cd AS "gender", grdn_phone_no AS "guardianPhone", i_ts AS "createdAt", u_ts AS "updatedAt",
                       crte_usr_id AS "createdBy", updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`;
    const before = await db.one(`SELECT ${QRY_COLUMNS} FROM stdnt_prfl_dtl_t WHERE user_id = $1`, [id]);
    const after = await db.one(
        `INSERT INTO stdnt_prfl_dtl_t (stdnt_prfl_id, user_id, college_id, roll_no, btch_id, admsn_yr, dob_dt, gndr_cd, grdn_phone_no, crte_usr_id)
         VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id) DO UPDATE SET roll_no = $3, btch_id = $4, admsn_yr = $5, dob_dt = $6, gndr_cd = $7, grdn_phone_no = $8, a_in = 1, updte_usr_id = $9
         RETURNING ${QRY_COLUMNS}`,
        [id, collegeId, data.rollNumber, data.batchId, data.admissionYear, data.dateOfBirth, data.gender, data.guardianPhone, identity.id]);
    return { before, after };
}

async function saveTeacherProfile(identity, collegeId, id, data) {
    if (data.departmentId && !await db.one('SELECT 1 FROM dept_lst_t WHERE dept_id = $1 AND college_id = $2 AND a_in = 1', [data.departmentId, collegeId]))
        fail(400, 'Choose an existing department from this college');
    const QRY_COLUMNS = `tchr_prfl_id AS "id", user_id AS "userId", college_id AS "collegeId", emp_cd AS "employeeCode", dept_id AS "departmentId", dsgntn_tx AS "designation",
                       qlfctn_tx AS "qualification", i_ts AS "createdAt", u_ts AS "updatedAt", crte_usr_id AS "createdBy", updte_usr_id AS "updatedBy",
                       a_in AS "activeIndicator", d_ts AS "deletedAt"`;
    const before = await db.one(`SELECT ${QRY_COLUMNS} FROM tchr_prfl_dtl_t WHERE user_id = $1`, [id]);
    const after = await db.one(
        `INSERT INTO tchr_prfl_dtl_t (tchr_prfl_id, user_id, college_id, emp_cd, dept_id, dsgntn_tx, qlfctn_tx, crte_usr_id)
         VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET emp_cd = $3, dept_id = $4, dsgntn_tx = $5, qlfctn_tx = $6, a_in = 1, updte_usr_id = $7
         RETURNING ${QRY_COLUMNS}`,
        [id, collegeId, data.employeeCode, data.departmentId, data.designation, data.qualification, identity.id]);
    return { before, after };
}
