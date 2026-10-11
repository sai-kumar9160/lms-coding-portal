import { z } from 'zod';
import { academicModel, academicResources } from '../models/academic.model.js';
import { audit } from '../services/audit.service.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').transform(value => new Date(`${value}T00:00:00Z`)).refine(date => !Number.isNaN(date.getTime()), 'Invalid date');
const code = z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,20}$/, 'Use 2-20 letters, digits or hyphens');
const ref = z.string().uuid();
const groupId = z.coerce.number().int().positive().max(2147483647);
const flag = z.boolean().default(false).transform(value => value ? 1 : 0);
// Items are saved as a whole (create and edit use the same fields).
const schemas = {
    'academic-years': z.object({ name: z.string().trim().min(2).max(50), startDate: isoDate, endDate: isoDate, isCurrent: flag })
        .refine(year => year.endDate > year.startDate, { message: 'End date must be after the start date', path: ['endDate'] }),
    departments: z.object({ code, name: z.string().trim().min(2).max(120), hodUserId: ref.nullish().transform(value => value ?? null) }),
    programs: z.object({ departmentId: ref, code, name: z.string().trim().min(2).max(120), durationYears: z.number().int().min(1).max(10) }),
    batches: z.object({ programId: ref, academicYearId: ref, name: z.string().trim().min(1).max(60), section: z.string().trim().max(10).default('') }),
    cohorts: z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(500).default(''), batchId: ref.nullish().transform(value => value ?? null), archived: flag }),
};
const resource = z.enum(Object.keys(academicResources));
const membersSchema = z.object({ userIds: z.array(z.string().uuid()).min(1).max(500) });

function target(req) {
    const name = resource.parse(req.params.resource);
    return { name, config: academicResources[name], schema: schemas[name] };
}

export async function list(req, res) {
    res.json(await academicModel.list(target(req).config, req.collegeId));
}
export async function create(req, res) {
    const { config, schema } = target(req);
    const { after } = await academicModel.create(req.identity, config, req.collegeId, schema.parse(req.body));
    await audit(req, { action: 'create', entityType: config.entity, entityId: after.id, after });
    res.status(201).json(after);
}
export async function update(req, res) {
    const { config, schema } = target(req);
    const { before, after } = await academicModel.update(req.identity, config, req.collegeId, config === academicResources.cohorts ? groupId.parse(req.params.id) : req.params.id, schema.parse(req.body));
    await audit(req, { action: 'update', entityType: config.entity, entityId: after.id, before, after });
    res.json(after);
}
export async function remove(req, res) {
    const { config } = target(req);
    const before = await academicModel.remove(req.identity, config, req.collegeId, config === academicResources.cohorts ? groupId.parse(req.params.id) : req.params.id);
    await audit(req, { action: 'delete', entityType: config.entity, entityId: before.id, before });
    res.json({ success: true });
}
export async function members(req, res) {
    res.json(await academicModel.members(req.collegeId, groupId.parse(req.params.id)));
}
export async function addMembers(req, res) {
    const { userIds } = membersSchema.parse(req.body);
    const result = await academicModel.addMembers(req.identity, req.collegeId, groupId.parse(req.params.id), userIds);
    await audit(req, { action: 'add_members', entityType: 'cohort', entityId: req.params.id, after: { userIds } });
    res.json(result);
}
export async function removeMember(req, res) {
    const result = await academicModel.removeMember(req.identity, req.collegeId, groupId.parse(req.params.id), req.params.userId);
    await audit(req, { action: 'remove_member', entityType: 'cohort', entityId: req.params.id, before: { userId: req.params.userId } });
    res.json(result);
}
