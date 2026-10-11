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
        await db.auditLog.create({ data: {
            collegeId: collegeId !== undefined ? collegeId : req.collegeId ?? null,
            actorId: actorId !== undefined ? actorId : req.identity?.id ?? null,
            actingAsSuperAdmin: req.actingAsSuperAdmin ? 1 : 0,
            action, entityType, entityId: entityId === null ? null : String(entityId),
            before: clean(before), after: clean(after),
            ipAddress: req.ip ?? null, userAgent: req.get('user-agent')?.slice(0, 300) ?? null, requestId: req.id ?? null,
        } });
    }
    catch (error) {
        log.error('Audit write failed', { action, entityType, entityId, requestId: req.id, error: error.message });
    }
}
