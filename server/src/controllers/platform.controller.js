import { z } from 'zod';
import { platformModel } from '../models/platform.model.js';
import { publicUser } from '../services/session.service.js';
import { audit } from '../services/audit.service.js';
import { mobileSchema } from './auth.controller.js';
import { fail } from '../utils/http-error.js';

const collegeSchema = z.object({ name: z.string().trim().min(2).max(100), slug: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/), adminName: z.string().trim().min(2), adminEmail: z.string().trim().email().transform(v => v.toLowerCase()), adminPassword: z.string().min(10).max(100) });

export async function health(_req, res) { await platformModel.ping(); res.json({ status: 'ok' }); }
export async function me(req, res) { const { user, college } = await platformModel.profile(req.identity.id); res.json({ user: await publicUser(user), college }); }
export async function listColleges(_req, res) { res.json(await platformModel.listColleges()); }
export async function collegeMembers(req, res) {
    const id = z.coerce.number().int().positive().max(2147483647).parse(req.params.id);
    const role = z.enum(['COLLEGE_ADMIN', 'TEACHER', 'STUDENT']).parse(req.query.role);
    res.json(await platformModel.collegeMembers(id, role));
}
export async function updateCollegeMember(req, res) {
    if (req.identity.role !== 'SUPER_ADMIN') fail(403, 'Only Super Admin can edit college members here');
    const collegeId = z.coerce.number().int().positive().max(2147483647).parse(req.params.id);
    const id = z.string().uuid().parse(req.params.userId);
    const input = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().transform(value => value.toLowerCase()), mobileNo: z.union([z.literal(''), z.null(), mobileSchema]).transform(value => value || null) }).strict().parse(req.body);
    const { before, after } = await platformModel.updateCollegeMember(req.identity, collegeId, id, input);
    await audit(req, { action: 'update', entityType: 'user', entityId: id, collegeId, before, after });
    res.json(after);
}
export async function createCollege(req, res) {
    const college = await platformModel.createCollege(req.identity, collegeSchema.parse(req.body));
    await audit(req, { action: 'create', entityType: 'college', entityId: college.id, after: college, collegeId: college.id });
    res.status(201).json(college);
}
export async function updateCollege(req, res) {
    const input = collegeSchema.pick({ name: true, slug: true }).extend({ active: z.boolean() }).partial().strict()
        .refine(value => Object.keys(value).length > 0, 'Provide college details to update').parse(req.body);
    const id = z.coerce.number().int().positive().max(2147483647).parse(req.params.id);
    const { before, after } = await platformModel.updateCollege(req.identity, id, input);
    const action = input.active !== undefined && input.active !== before.active ? (input.active ? 'reactivate' : 'suspend') : 'update';
    await audit(req, { action, entityType: 'college', entityId: id, before, after, collegeId: id });
    res.json(after);
}
