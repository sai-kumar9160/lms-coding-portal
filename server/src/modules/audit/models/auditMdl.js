import { db, params } from '../../../../config/db.config.js';

export const auditMdl = {
    // Newest first, paged with a cursor (the last item's id). collegeId null = every college (Super Admin, no college chosen).
    async list(collegeId, { entityType, action, actorId, from, to, cursor, limit }) {
        const q = params();
        const where = [];
        if (collegeId) where.push(`a.college_id = ${q.add(collegeId)}`);
        if (entityType) where.push(`a.entity_type_cd = ${q.add(entityType)}`);
        if (action) where.push(`a.action_cd = ${q.add(action)}`);
        if (actorId) where.push(`a.actor_usr_id = ${q.add(actorId)}`);
        if (from) where.push(`a.occurred_ts >= ${q.add(from)}`);
        if (to) where.push(`a.occurred_ts < ${q.add(to)}`);
        // Keyset paging: continue after the cursor row in (occurred_ts DESC, id DESC) order.
        if (cursor) where.push(`(a.occurred_ts, a.adt_log_id) < (SELECT occurred_ts, adt_log_id FROM adt_log_dtl_t WHERE adt_log_id = ${q.add(cursor)})`);
        const rows = await db.many(
            `SELECT a.adt_log_id AS "id", a.college_id AS "collegeId", a.actor_usr_id AS "actorId", a.acting_as_sa_in AS
            "actingAsSuperAdmin", a.action_cd AS "action", a.entity_type_cd AS "entityType", a.entity_id AS
            "entityId", a.before_json AS "before", a.after_json AS "after", a.ip_addr_tx AS "ipAddress",
            a.user_agent_tx AS "userAgent", a.request_id AS "requestId", a.occurred_ts AS "occurredAt" FROM adt_log_dtl_t a
             ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
             ORDER BY a.occurred_ts DESC, a.adt_log_id DESC LIMIT ${q.add(limit + 1)}`, q.values);
        const page = rows.slice(0, limit);
        // The log keeps plain IDs (rows outlive users and colleges); names are looked up for display.
        const [actors, colleges] = await Promise.all([
            db.many(`SELECT u.id, u.name, u.email FROM "User" u WHERE u.id = ANY($1::int[])`, [[...new Set(page.map(row => row.actorId).filter(Boolean))]]),
            db.many(`SELECT c.id, c.name FROM "College" c WHERE c.id = ANY($1::int[])`, [[...new Set(page.map(row => row.collegeId).filter(Boolean))]]),
        ]);
        const actorById = new Map(actors.map(actor => [actor.id, actor]));
        const collegeById = new Map(colleges.map(college => [college.id, college.name]));
        return {
            items: page.map(row => ({ ...row, actor: actorById.get(row.actorId) ?? null, collegeName: collegeById.get(row.collegeId) ?? null })),
            nextCursor: rows.length > limit ? page.at(-1).id : null,
        };
    },
};
