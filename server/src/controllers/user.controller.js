import { z } from 'zod';
import { userModel } from '../models/user.model.js';
import { publicUser } from '../services/session.service.js';
import { audit } from '../services/audit.service.js';
import { mobileSchema } from './auth.controller.js';

const createSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().transform(v => v.toLowerCase()), password: z.string().min(10).max(100), mobileNo: mobileSchema, role: z.enum(['TEACHER', 'STUDENT', 'COLLEGE_ADMIN']) });
const optionalText = (max) => z.string().trim().max(max).nullish().transform(value => value || null);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').transform(value => new Date(`${value}T00:00:00Z`));
const profileSchemas = {
    STUDENT: z.object({
        rollNumber: z.string().trim().min(1).max(30), batchId: z.string().uuid().nullish().transform(value => value ?? null),
        admissionYear: z.number().int().min(1990).max(2100).nullish().transform(value => value ?? null),
        dateOfBirth: isoDate.nullish().transform(value => value ?? null), gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullish().transform(value => value ?? null),
        guardianPhone: mobileSchema.nullish().transform(value => value || null),
    }),
    TEACHER: z.object({
        employeeCode: z.string().trim().min(1).max(30), departmentId: z.string().uuid().nullish().transform(value => value ?? null),
        designation: optionalText(100), qualification: optionalText(200),
    }),
};

export async function listUsers(req, res) { res.json(await userModel.list(req.identity, req.collegeId)); }
export async function branchOptions(req, res) { res.json(await userModel.branchOptions(req.collegeId)); }
export async function saveBranches(req, res) {
    const { branchGroupIds } = z.object({ branchGroupIds: z.array(z.number().int().positive().max(2147483647)).max(100).refine(ids => new Set(ids).size === ids.length, 'Duplicate branches') }).strict().parse(req.body);
    const result = await userModel.saveBranches(req.identity, req.collegeId, req.params.id, branchGroupIds);
    await audit(req, { action: 'update', entityType: 'student_branch', entityId: req.params.id, before: { branchGroupIds: result.before }, after: { branchGroupIds } });
    res.json({ branches: result.branches, branchGroupIds });
}
export async function createUser(req, res) {
    const user = await publicUser(await userModel.create(req.identity, req.collegeId, createSchema.parse(req.body)));
    await audit(req, { action: 'create', entityType: 'user', entityId: user.id, after: user });
    res.status(201).json(user);
}
export async function approveUser(req, res) {
    const result = await userModel.approve(req.identity, req.collegeId, req.params.id);
    await audit(req, { action: 'approve', entityType: 'user', entityId: req.params.id, before: { status: 'PENDING' }, after: { status: 'ACTIVE' } });
    res.json(result);
}
export async function deactivateUser(req, res) {
    const result = await userModel.deactivate(req.identity, req.collegeId, req.params.id);
    await audit(req, { action: 'deactivate', entityType: 'user', entityId: req.params.id, after: { active: false } });
    res.json(result);
}
// PUT /api/users/:id/profile: student profile for students, teacher profile for teachers.
export async function saveProfile(req, res) {
    const role = await userModel.managedRole(req.collegeId, req.params.id);
    const { before, after } = await userModel.saveProfile(req.identity, req.collegeId, req.params.id, role, profileSchemas[role].parse(req.body));
    await audit(req, { action: before ? 'update' : 'create', entityType: role === 'STUDENT' ? 'student_profile' : 'teacher_profile', entityId: req.params.id, before, after });
    res.json(after);
}
