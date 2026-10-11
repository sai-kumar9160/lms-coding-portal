import { z } from 'zod';
import { accessModel, permissionActions } from '../models/access.model.js';
import { audit } from '../services/audit.service.js';

const roleId = z.coerce.number().int().positive();
const flags = Object.fromEntries(permissionActions.map(action => [action, z.boolean()]));
const saveSchema = z.object({ permissions: z.array(z.object({ menuItemId: z.number().int().positive(), ...flags })).min(1).max(500) });

export async function menu(req, res) { res.json(await accessModel.menu(req.identity.role)); }
export async function listRoles(_req, res) { res.json(await accessModel.roles()); }
export async function rolePermissions(req, res) { res.json(await accessModel.rolePermissions(roleId.parse(req.params.roleId))); }
// Permission changes are audited with each changed menu item's flags before and after.
export async function saveRolePermissions(req, res) {
    const id = roleId.parse(req.params.roleId);
    const { permissions } = saveSchema.parse(req.body);
    const previous = await accessModel.rolePermissions(id);
    const result = await accessModel.saveRolePermissions(req.identity, id, permissions);
    const flagsOf = row => Object.fromEntries(permissionActions.map(action => [action, Boolean(row?.[action])]));
    const changed = permissions.map(entry => ({ entry, old: previous.find(row => row.menuItemId === entry.menuItemId) }))
        .filter(({ entry, old }) => JSON.stringify(flagsOf(entry)) !== JSON.stringify(flagsOf(old)));
    if (changed.length)
        await audit(req, { action: 'update', entityType: 'role_permissions', entityId: id, collegeId: null,
            before: Object.fromEntries(changed.map(({ entry, old }) => [old?.code ?? entry.menuItemId, flagsOf(old)])),
            after: Object.fromEntries(changed.map(({ entry, old }) => [old?.code ?? entry.menuItemId, flagsOf(entry)])) });
    res.json(result);
}
