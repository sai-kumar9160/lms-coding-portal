import { z } from 'zod';
import { platformMdl } from '../models/platformMdl.js';
import { publicUser } from '../../../services/session.service.js';
import { audit } from '../../../services/audit.service.js';
import { mobileSchema } from '../../auth/controllers/authCtrl.js';
import { fail } from '../../../utils/http-error.js';
import { idSchema } from '../../../utils/ids.js';

const collegeSchema = z.object({ name: z.string().trim().min(2).max(100), slug: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/), adminName: z.string().trim().min(2), adminEmail: z.string().trim().email().transform(v => v.toLowerCase()), adminPassword: z.string().min(10).max(100) });

export async function healthCtrl(_req, res) { await platformMdl.ping(); res.json({ status: 'ok' }); }
export async function meCtrl(req, res) { const { user, college } = await platformMdl.profile(req.identity.id); res.json({ user: await publicUser(user), college }); }
export async function listCollegesCtrl(_req, res) { res.json(await platformMdl.listColleges()); }
export async function collegeMembersCtrl(req, res) {
    const id = z.coerce.number().int().positive().max(2147483647).parse(req.params.id);
    const role = z.enum(['COLLEGE_ADMIN', 'TEACHER', 'STUDENT']).parse(req.query.role);
    res.json(await platformMdl.collegeMembers(id, role));
}
export async function updateCollegeMemberCtrl(req, res) {
    if (req.identity.role !== 'SUPER_ADMIN') fail(403, 'Only Super Admin can edit college members here');
    const collegeId = z.coerce.number().int().positive().max(2147483647).parse(req.params.id);
    const id = idSchema.parse(req.params.userId);
    const input = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().transform(value => value.toLowerCase()), mobileNo: z.union([z.literal(''), z.null(), mobileSchema]).transform(value => value || null) }).strict().parse(req.body);
    const { before, after } = await platformMdl.updateCollegeMember(req.identity, collegeId, id, input);
    await audit(req, { action: 'update', entityType: 'user', entityId: id, collegeId, before, after });
    res.json(after);
}
export async function createCollegeCtrl(req, res) {
    const college = await platformMdl.createCollege(req.identity, collegeSchema.parse(req.body));
    await audit(req, { action: 'create', entityType: 'college', entityId: college.id, after: college, collegeId: college.id });
    res.status(201).json(college);
}
export async function updateCollegeCtrl(req, res) {
    const input = collegeSchema.pick({ name: true, slug: true }).extend({ active: z.boolean() }).partial().strict()
        .refine(value => Object.keys(value).length > 0, 'Provide college details to update').parse(req.body);
    const id = z.coerce.number().int().positive().max(2147483647).parse(req.params.id);
    const { before, after } = await platformMdl.updateCollege(req.identity, id, input);
    const action = input.active !== undefined && input.active !== before.active ? (input.active ? 'reactivate' : 'suspend') : 'update';
    await audit(req, { action, entityType: 'college', entityId: id, before, after, collegeId: id });
    res.json(after);
}

// Vendors are platform accounts: the Super Admin creates them and gives them their login; there is no self-registration.
const vendorSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().transform(v => v.toLowerCase()), mobileNo: mobileSchema, password: z.string().min(10).max(100) }).strict();
export async function listVendorsCtrl(_req, res) { res.json(await platformMdl.listVendors()); }
export async function createVendorCtrl(req, res) {
    if (req.identity.role !== 'SUPER_ADMIN') fail(403, 'Only Super Admin can add vendors');
    const vendor = await platformMdl.createVendor(req.identity, vendorSchema.parse(req.body));
    await audit(req, { action: 'create', entityType: 'vendor', entityId: vendor.id, after: vendor, collegeId: null });
    res.status(201).json(vendor);
}
export async function deactivateVendorCtrl(req, res) {
    if (req.identity.role !== 'SUPER_ADMIN') fail(403, 'Only Super Admin can remove vendors');
    const vendor = await platformMdl.deactivateVendor(req.identity, idSchema.parse(req.params.id));
    await audit(req, { action: 'deactivate', entityType: 'vendor', entityId: vendor.id, before: vendor, collegeId: null });
    res.json({ success: true });
}
