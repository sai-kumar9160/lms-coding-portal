import { db } from '../../../../config/db.config.js';
import { Role, UserStatus } from '../../../utils/enums.js';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { nextId } from '../../../utils/ids.js';
import { fail } from '../../../utils/http-error.js';

export const RESET_LINK_MINUTES = 30;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const invalidLink = () => fail(400, 'This reset link is invalid or has expired. Request a new one.');

export const authMdl = {
    college(slug) {
        return db.one(`SELECT c.id, c.name, c.slug, c.active, c.i_ts AS "createdAt", c.u_ts AS "updatedAt", c.crte_usr_id AS "createdBy",
            c.updte_usr_id AS "updatedBy", c.a_in AS "activeIndicator", c.d_ts AS "deletedAt" FROM "College" c WHERE c.slug = $1 AND c.active = true AND c.a_in = 1`, [slug]);
    },
    branches(collegeId) {
        return db.many(`SELECT c.chrt_id AS "id", c.chrt_nm AS "name" FROM chrt_lst_t c WHERE c.college_id = $1 AND c.a_in = 1 AND c.archived_in = 0 ORDER BY c.chrt_nm ASC`, [collegeId]);
    },
    // A college login matches the college's users; without a college only platform accounts (Super Admin, Vendor) match.
    loginUser(email, collegeId) {
        return db.one(
            `SELECT u.id, u.name, u.email, u.mobile_no AS "mobileNo", u.password, u.role, u.role_id AS "roleId", u.status,
            u."collegeId", u.i_ts AS "createdAt", u.u_ts AS "updatedAt", u.crte_usr_id AS "createdBy",
            u.updte_usr_id AS "updatedBy", u.a_in AS "activeIndicator", u.d_ts AS "deletedAt"
             FROM "User" u JOIN role_t r ON r.role_id = u.role_id
             WHERE u.email = $1 AND u.a_in = 1 AND r.a_in = 1
               AND ${collegeId ? 'u."collegeId" = $2' : `u."collegeId" IS NULL AND u.role IN ('SUPER_ADMIN', 'VENDOR')`}
             LIMIT 1`,
            collegeId ? [email, collegeId] : [email]);
    },
    async register(input) {
        const role = await db.one('SELECT role_id AS id FROM role_t WHERE role_code = $1 AND a_in = 1', [input.role]);
        if (!role) fail(400, 'Registration role unavailable');
        // Teachers can author content, so self-registered teachers wait for College Admin approval.
        const status = input.role === Role.TEACHER ? UserStatus.PENDING : UserStatus.ACTIVE;
        const { branchGroupId, ...data } = input;
        const password = await bcrypt.hash(input.password, 12);
        return db.transaction(async tx => {
            const id = await nextId(tx, '"User"', 'id');
            if (input.role === Role.STUDENT && (!branchGroupId || !await tx.one('SELECT 1 FROM chrt_lst_t WHERE chrt_id = $1 AND college_id = $2 AND a_in = 1 AND archived_in = 0', [branchGroupId, input.collegeId])))
                fail(400, 'Choose an active branch group of your college');
            const user = await tx.one(
                `INSERT INTO "User" (id, name, email, mobile_no, password, role, role_id, status, "collegeId", crte_usr_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $1)
                 RETURNING id AS "id", name AS "name", email AS "email", mobile_no AS "mobileNo", password AS "password", role AS "role", role_id AS "roleId",
                           status AS "status", "collegeId" AS "collegeId", i_ts AS "createdAt", u_ts AS "updatedAt", crte_usr_id AS "createdBy",
                           updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`,
                [id, data.name, data.email, data.mobileNo, password, data.role, role.id, status, data.collegeId]);
            if (input.role === Role.STUDENT)
                await tx.run(
                    `INSERT INTO chrt_mbr_rel_t (chrt_mbr_id, college_id, chrt_id, user_id, crte_usr_id) VALUES (DEFAULT, $1, $2, $3, $3)`,
                    [input.collegeId, branchGroupId, id]);
            return user;
        });
    },
    // Creates a one-time reset token and returns it (it is stored only as a hash).
    // Returns null when a link was already sent in the last minute, so the email cannot be flooded.
    async createPasswordReset(user, requestIp) {
        if (await db.one('SELECT 1 FROM pwd_rst_tkn_dtl_t WHERE user_id = $1 AND i_ts > $2', [user.id, new Date(Date.now() - 60000)]))
            return null;
        const token = randomBytes(32).toString('base64url');
        await db.transaction(async tx => {
            // A new link replaces any earlier unused one.
            await tx.run('UPDATE pwd_rst_tkn_dtl_t SET a_in = 0, updte_usr_id = $1 WHERE user_id = $1 AND used_ts IS NULL AND a_in = 1', [user.id]);
            await tx.run(
                `INSERT INTO pwd_rst_tkn_dtl_t (rst_tkn_id, user_id, tkn_hash_tx, expires_ts, rqst_ip_tx, crte_usr_id) VALUES (DEFAULT, $1, $2, $3, $4, $1)`,
                [user.id, hashToken(token), new Date(Date.now() + RESET_LINK_MINUTES * 60000), requestIp]);
        });
        return token;
    },
    // Sets the new password, uses up the link, and signs the account out on every device.
    async resetPassword(token, password) {
        const reset = await db.one(
            `SELECT r.rst_tkn_id AS id, r.user_id AS "userId", u."collegeId", u.a_in AS "userActive"
             FROM pwd_rst_tkn_dtl_t r JOIN "User" u ON u.id = r.user_id
             WHERE r.tkn_hash_tx = $1 AND r.used_ts IS NULL AND r.a_in = 1 AND r.expires_ts > $2`,
            [hashToken(token), new Date()]);
        if (!reset || reset.userActive !== 1)
            invalidLink();
        const hash = await bcrypt.hash(password, 12);
        await db.transaction(async tx => {
            // Claiming the link inside the transaction makes it single-use even with simultaneous requests.
            const claimed = await tx.run('UPDATE pwd_rst_tkn_dtl_t SET used_ts = $2, updte_usr_id = $3 WHERE rst_tkn_id = $1 AND used_ts IS NULL', [reset.id, new Date(), reset.userId]);
            if (!claimed)
                invalidLink();
            await tx.run('UPDATE "User" SET password = $2, updte_usr_id = $1 WHERE id = $1', [reset.userId, hash]);
            await tx.run('DELETE FROM "Session" WHERE "userId" = $1', [reset.userId]);
        });
        return { userId: reset.userId, collegeId: reset.collegeId };
    },
};
