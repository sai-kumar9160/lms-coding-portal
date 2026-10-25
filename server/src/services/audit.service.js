import { db } from '../../config/db.config.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('audit');
// Never stored in the audit log, at any depth.
const secretKey = /pass(word)?|token|secret|hash|checksum|storagekey/i;

function clean(value) {
    if (value === null || value === undefined)
        return undefined;
    return JSON.parse(JSON.stringify(value, (key, item) => (key && secretKey.test(key) ? undefined : item)));
}

// Records one write in adt_log_dtl_t: who (actor, Super Admin flag), where (college, IP, request ID), what (action,
// entity) and the before/after values. Called after the write succeeds; a failed audit write is logged but does not
// undo the user's action. Use options.collegeId / options.actorId when the request has no college or no signed-in user.
// An explicit collegeId: null records a platform-wide change even while a Super Admin has a college chosen.
export async function audit(req, { action, entityType, entityId = null, before = null, after = null, collegeId, actorId }) {
    try {
        await db.run(
            `INSERT INTO adt_log_dtl_t (adt_log_id, college_id, actor_usr_id, acting_as_sa_in, action_cd, entity_type_cd, entity_id, before_json, after_json, ip_addr_tx, user_agent_tx, request_id)
             VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11)`,
            [collegeId !== undefined ? collegeId : req.collegeId ?? null, actorId !== undefined ? actorId : req.identity?.id ?? null, req.actingAsSuperAdmin ? 1 : 0,
                action, entityType, entityId === null ? null : String(entityId), JSON.stringify(clean(before) ?? null), JSON.stringify(clean(after) ?? null),
                req.ip ?? null, req.get('user-agent')?.slice(0, 300) ?? null, req.id ?? null]);
    }
    catch (error) {
        log.error('Audit write failed', { action, entityType, entityId, requestId: req.id, error: error.message });
    }
}
