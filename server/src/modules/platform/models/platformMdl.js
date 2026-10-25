import { db } from '../../../../config/db.config.js';
import bcrypt from 'bcryptjs';
import { Role } from '../../../utils/enums.js';
import { notFound } from '../../../utils/http-error.js';

// Members a Super Admin may edit in a college: admins, teachers and students whose role is still active.
const MEMBER = `u.id = $1 AND u."collegeId" = $2 AND u.a_in = 1 AND u.role IN ('COLLEGE_ADMIN', 'TEACHER', 'STUDENT')
    AND EXISTS (SELECT 1 FROM role_t r WHERE r.role_id = u.role_id AND r.a_in = 1)`;

export const platformMdl = {
    ping() { return db.query('SELECT 1'); },
    async profile(userId) {
        const user = await db.one(`SELECT u.id, u.name, u.email, u.mobile_no AS "mobileNo", u.password, u.role, u.role_id AS "roleId", u.status,
            u."collegeId", u.i_ts AS "createdAt", u.u_ts AS "updatedAt", u.crte_usr_id AS "createdBy",
            u.updte_usr_id AS "updatedBy", u.a_in AS "activeIndicator", u.d_ts AS "deletedAt" FROM "User" u WHERE u.id = $1`, [userId]);
        if (!user) notFound('User');
        return { user, college: user.collegeId ? await db.one(`SELECT c.id, c.name, c.slug, c.active FROM "College" c WHERE c.id = $1`, [user.collegeId]) : null };
    },
    // College a Super Admin may work in through the college switcher (suspended colleges included, deleted ones not).
    switchableCollege(id) {
        return db.one(`SELECT c.id FROM "College" c WHERE c.id = $1 AND c.a_in = 1`, [id]);
    },
    async listColleges() {
        const [colleges, groups] = await Promise.all([
            db.many(
                `SELECT c.id, c.name, c.slug, c.active, c.i_ts AS "createdAt", c.u_ts AS "updatedAt", c.crte_usr_id AS "createdBy",
            c.updte_usr_id AS "updatedBy", c.a_in AS "activeIndicator", c.d_ts AS "deletedAt",
                        (SELECT COUNT(*) FROM "User" u WHERE u."collegeId" = c.id) AS users,
                        (SELECT COUNT(*) FROM "Course" k WHERE k."collegeId" = c.id) AS courses
                 FROM "College" c WHERE c.a_in = 1 ORDER BY c.i_ts DESC`),
            db.many(
                `SELECT u."collegeId", u.role, COUNT(*) AS total
                 FROM "User" u JOIN role_t r ON r.role_id = u.role_id
                 WHERE u.a_in = 1 AND r.a_in = 1 AND u."collegeId" IS NOT NULL
                 GROUP BY u."collegeId", u.role`),
        ]);
        return colleges.map(({ users, courses, ...college }) => ({
            ...college, _count: { users, courses },
            memberCounts: Object.fromEntries(groups.filter(group => group.collegeId === college.id).map(group => [group.role, group.total])),
        }));
    },
    async collegeMembers(id, role) {
        if (!await db.one('SELECT 1 FROM "College" WHERE id = $1 AND a_in = 1', [id])) notFound('College');
        return db.many(
            `SELECT u.id AS "id", u.name AS "name", u.email AS "email", u.mobile_no AS "mobileNo"
             FROM "User" u JOIN role_t r ON r.role_id = u.role_id
             WHERE u."collegeId" = $1 AND u.role = $2 AND u.a_in = 1 AND r.a_in = 1
             ORDER BY u.name ASC, u.id ASC`, [id, role]);
    },
    async createCollege(identity, input) {
        const password = await bcrypt.hash(input.adminPassword, 12);
        return db.transaction(async tx => {
            const college = await tx.one(
                `INSERT INTO "College" (name, slug, crte_usr_id) VALUES ($1, $2, $3)
                 RETURNING id AS "id", name AS "name", slug AS "slug", active AS "active", i_ts AS "createdAt", u_ts AS "updatedAt",
                           crte_usr_id AS "createdBy", updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`,
                [input.name, input.slug, identity.id]);
            await tx.run(
                `INSERT INTO "User" (id, name, email, password, role, "collegeId", crte_usr_id) VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)`,
                [input.adminName, input.adminEmail, password, Role.COLLEGE_ADMIN, college.id, identity.id]);
            return college;
        });
    },
    updateCollegeMember(identity, collegeId, id, input) {
        return db.transaction(async tx => {
            if (!await tx.one('SELECT 1 FROM "College" WHERE id = $1 AND a_in = 1', [collegeId])) notFound('College');
            const before = await tx.one(`SELECT u.id AS "id", u.name AS "name", u.email AS "email", u.mobile_no AS "mobileNo" FROM "User" u WHERE ${MEMBER}`, [id, collegeId]);
            if (!before) notFound('User');
            const after = await tx.one(
                `UPDATE "User" u SET name = $3, email = $4, mobile_no = $5, updte_usr_id = $6 WHERE ${MEMBER}
                 RETURNING u.id AS "id", u.name AS "name", u.email AS "email", u.mobile_no AS "mobileNo"`, [id, collegeId, input.name, input.email, input.mobileNo, identity.id]);
            return { before, after };
        });
    },
    // ---- Vendors: platform-level partner accounts (no college). Only the Super Admin creates them. ----
    listVendors() {
        return db.many(
            `SELECT u.id AS "id", u.name AS "name", u.email AS "email", u.mobile_no AS "mobileNo", u.status AS "status", u.i_ts AS "createdAt",
                    (SELECT COUNT(*) FROM cdng_prblm_lst_t p WHERE p.crte_usr_id = u.id AND p.a_in = 1) AS "problems"
             FROM "User" u WHERE u.role = 'VENDOR' AND u."collegeId" IS NULL AND u.a_in = 1 ORDER BY u.i_ts DESC`);
    },
    async createVendor(identity, input) {
        return db.one(
            `INSERT INTO "User" (id, name, email, mobile_no, password, role, crte_usr_id) VALUES (DEFAULT, $1, $2, $3, $4, 'VENDOR', $5)
             RETURNING id AS "id", name AS "name", email AS "email", mobile_no AS "mobileNo", status AS "status", i_ts AS "createdAt"`,
            [input.name, input.email, input.mobileNo, await bcrypt.hash(input.password, 12), identity.id]);
    },
    // Turns a vendor's login off and signs them out; the problems they published stay in the library.
    async deactivateVendor(identity, id) {
        return db.transaction(async tx => {
            const vendor = await tx.one(`SELECT u.id AS "id", u.name AS "name", u.email AS "email" FROM "User" u WHERE u.id = $1 AND u.role = 'VENDOR' AND u."collegeId" IS NULL AND u.a_in = 1`, [id]);
            if (!vendor) notFound('Vendor');
            await tx.run('UPDATE "User" SET a_in = 0, updte_usr_id = $2 WHERE id = $1', [id, identity.id]);
            await tx.run('DELETE FROM "Session" WHERE "userId" = $1', [id]);
            return vendor;
        });
    },
    async setCollegeActive(identity, id, active) {
        const college = await db.one(
            `UPDATE "College" SET active = $2, updte_usr_id = $3 WHERE id = $1 AND a_in = 1
             RETURNING id AS "id", name AS "name", slug AS "slug", active AS "active", i_ts AS "createdAt", u_ts AS "updatedAt",
                       crte_usr_id AS "createdBy", updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`,
            [id, active, identity.id]);
        if (!college) notFound('College');
        return college;
    },
    updateCollege(identity, id, data) {
        return db.transaction(async tx => {
            const before = await tx.one(`SELECT c.id, c.name, c.slug, c.active, c.i_ts AS "createdAt", c.u_ts AS "updatedAt", c.crte_usr_id AS "createdBy",
            c.updte_usr_id AS "updatedBy", c.a_in AS "activeIndicator", c.d_ts AS "deletedAt" FROM "College" c WHERE c.id = $1 AND c.a_in = 1`, [id]);
            if (!before) notFound('College');
            // Only the fields that were sent change; COALESCE keeps the current value for the others.
            const after = await tx.one(
                `UPDATE "College" SET name = COALESCE($2, name), slug = COALESCE($3, slug), active = COALESCE($4, active), updte_usr_id = $5 WHERE id = $1
                 RETURNING id AS "id", name AS "name", slug AS "slug", active AS "active", i_ts AS "createdAt", u_ts AS "updatedAt",
                           crte_usr_id AS "createdBy", updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`,
                [id, data.name ?? null, data.slug ?? null, data.active ?? null, identity.id]);
            return { before, after };
        });
    },
};
