import { z } from 'zod';
import { auditModel } from '../models/audit.model.js';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(value => new Date(`${value}T00:00:00Z`));
const querySchema = z.object({
    entityType: z.string().regex(/^[a-z_]{2,40}$/).optional(),
    action: z.string().regex(/^[a-z_]{2,40}$/).optional(),
    actorId: z.string().uuid().optional(),
    from: day.optional(),
    // "to" is inclusive: the whole day is included.
    to: day.transform(date => new Date(date.getTime() + 86400000)).optional(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
});

// College Admins see their college; a Super Admin sees the chosen college, or every college when none is chosen.
export async function list(req, res) {
    res.json(await auditModel.list(req.collegeId ?? null, querySchema.parse(req.query)));
}
