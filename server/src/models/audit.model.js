import { db } from '../../config/db.config.js';

export const auditModel = {
    // Newest first, paged with a cursor (the last item's id). collegeId null = every college (Super Admin, no college chosen).
    async list(collegeId, { entityType, action, actorId, from, to, cursor, limit }) {
        const where = {
            ...(collegeId ? { collegeId } : {}),
            ...(entityType ? { entityType } : {}),
            ...(action ? { action } : {}),
            ...(actorId ? { actorId } : {}),
            ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
        };
        const rows = await db.auditLog.findMany({ where, orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }], take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
        const page = rows.slice(0, limit);
        // The log keeps plain IDs (rows outlive users and colleges); names are looked up for display.
        const [actors, colleges] = await Promise.all([
            db.user.findMany({ where: { id: { in: [...new Set(page.map(row => row.actorId).filter(Boolean))] } }, select: { id: true, name: true, email: true } }),
            db.college.findMany({ where: { id: { in: [...new Set(page.map(row => row.collegeId).filter(Boolean))] } }, select: { id: true, name: true } }),
        ]);
        const actorById = new Map(actors.map(actor => [actor.id, actor]));
        const collegeById = new Map(colleges.map(college => [college.id, college.name]));
        return {
            items: page.map(row => ({ ...row, actor: actorById.get(row.actorId) ?? null, collegeName: collegeById.get(row.collegeId) ?? null })),
            nextCursor: rows.length > limit ? page.at(-1).id : null,
        };
    },
};
