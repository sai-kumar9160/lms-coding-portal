import { db } from '../../config/db.config.js';

// Writes one row to the audit trail (adt_log_dtl_t) for work done by a command-line script.
export function writeAuditLog({ collegeId, actorId, action, entityType, entityId, after }) {
    return db.run(
        `INSERT INTO adt_log_dtl_t (adt_log_id, college_id, actor_usr_id, action_cd, entity_type_cd, entity_id, after_json)
         VALUES (DEFAULT, $1, $2, $3, $4, $5, $6::jsonb)`,
        [collegeId, actorId, action, entityType, entityId, JSON.stringify(after)]);
}
