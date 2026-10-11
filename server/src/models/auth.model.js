import { db } from '../../config/db.config.js';
import { Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { fail } from '../utils/http-error.js';

export const RESET_LINK_MINUTES = 30;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const invalidLink = () => fail(400, 'This reset link is invalid or has expired. Request a new one.');

export const authModel = {
    college(slug) { return db.college.findFirst({ where: { slug, active: true, activeIndicator: 1 } }); },
    branches(collegeId) {
        return db.cohort.findMany({ where: { collegeId, activeIndicator: 1, archived: 0 }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
    },
    loginUser(email, collegeId) {
        return db.user.findFirst({ where: { email, collegeId, activeIndicator: 1, roleDefinition: { activeIndicator: 1 }, ...(collegeId ? {} : { role: Role.SUPER_ADMIN }) } });
    },
    async register(input) {
        const role = await db.roleMaster.findFirst({ where: { code: input.role, activeIndicator: 1 } });
        if (!role) fail(400, 'Registration role unavailable');
        const id = randomUUID();
        // Teachers can author content, so self-registered teachers wait for College Admin approval.
        const status = input.role === Role.TEACHER ? UserStatus.PENDING : UserStatus.ACTIVE;
        const { branchGroupId, ...data } = input;
        const password = await bcrypt.hash(input.password, 12);
        return db.$transaction(async tx => {
            if (input.role === Role.STUDENT && (!branchGroupId || !await tx.cohort.findFirst({ where: { id: branchGroupId, collegeId: input.collegeId, activeIndicator: 1, archived: 0 } })))
                fail(400, 'Choose an active branch group of your college');
            const user = await tx.user.create({ data: { ...data, roleId: role.id, id, status, createdBy: id, password } });
            if (input.role === Role.STUDENT)
                await tx.cohortMember.create({ data: { collegeId: input.collegeId, cohortId: branchGroupId, userId: id, createdBy: id } });
            return user;
        });
    },
    // Creates a one-time reset token and returns it (it is stored only as a hash).
    // Returns null when a link was already sent in the last minute, so the email cannot be flooded.
    async createPasswordReset(user, requestIp) {
        if (await db.passwordReset.findFirst({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60000) } } }))
            return null;
        const token = randomBytes(32).toString('base64url');
        await db.$transaction([
            // A new link replaces any earlier unused one.
            db.passwordReset.updateMany({ where: { userId: user.id, usedAt: null, activeIndicator: 1 }, data: { activeIndicator: 0, updatedBy: user.id } }),
            db.passwordReset.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_LINK_MINUTES * 60000), requestIp, createdBy: user.id } }),
        ]);
        return token;
    },
    // Sets the new password, uses up the link, and signs the account out on every device.
    async resetPassword(token, password) {
        const reset = await db.passwordReset.findFirst({ where: { tokenHash: hashToken(token), usedAt: null, activeIndicator: 1, expiresAt: { gt: new Date() } }, include: { user: true } });
        if (!reset || reset.user.activeIndicator !== 1)
            invalidLink();
        const hash = await bcrypt.hash(password, 12);
        await db.$transaction(async transaction => {
            // Claiming the link inside the transaction makes it single-use even with simultaneous requests.
            const claimed = await transaction.passwordReset.updateMany({ where: { id: reset.id, usedAt: null }, data: { usedAt: new Date(), updatedBy: reset.userId } });
            if (!claimed.count)
                invalidLink();
            await transaction.user.update({ where: { id: reset.userId }, data: { password: hash, updatedBy: reset.userId } });
            await transaction.session.deleteMany({ where: { userId: reset.userId } });
        });
        return { userId: reset.userId, collegeId: reset.user.collegeId };
    },
};
