import { db } from '../../config/db.config.js';
import { buildTree } from '../utils/tree.js';
import { fail, notFound } from '../utils/http-error.js';

// Permission flags in app_rle_mnu_itm_rel_t (slct_in, insrt_in, updt_in, dlte_in, exprt_in).
const flagColumns = { view: 'canView', create: 'canCreate', update: 'canUpdate', delete: 'canDelete', export: 'canExport' };
export const permissionActions = Object.keys(flagColumns);
const toFlags = row => Object.fromEntries(permissionActions.map(action => [action, row?.[flagColumns[action]] === 1]));
const active = { activeIndicator: 1 };

// Permissions are checked on every protected request, so each role's set is cached briefly.
// Saving permissions clears the cache; other server processes pick up changes within CACHE_MS.
const CACHE_MS = 60000;
const cache = new Map();

async function rolePermissionRows(roleCode) {
    return db.roleMenuPermission.findMany({ where: { ...active, role: { code: roleCode, ...active }, menuItem: active }, include: { menuItem: true } });
}

export const accessModel = {
    // { [menuItemCode]: { view, create, update, delete, export } } for one role.
    async permissions(roleCode) {
        const cached = cache.get(roleCode);
        if (cached && cached.expires > Date.now())
            return cached.permissions;
        const permissions = Object.fromEntries((await rolePermissionRows(roleCode)).map(row => [row.menuItem.code, toFlags(row)]));
        cache.set(roleCode, { permissions, expires: Date.now() + CACHE_MS });
        return permissions;
    },
    // Sidebar tree for a role. Headers are shown when at least one child is visible.
    async menu(roleCode) {
        const [rows, headers] = await Promise.all([rolePermissionRows(roleCode), db.menuItem.findMany({ where: { ...active, header: 1, showInMenu: 1 } })]);
        const node = (item, permissions) => ({ id: item.id, parentId: item.parentId, code: item.code, name: item.name, icon: item.icon, url: item.url, sequence: item.sequence, header: item.header === 1, permissions });
        const visible = rows.filter(row => row.canView === 1 && row.menuItem.showInMenu === 1 && row.menuItem.header === 0 && row.menuItem.url);
        const tree = buildTree([...headers.map(item => node(item, toFlags(null))), ...visible.map(row => node(row.menuItem, toFlags(row)))]);
        return {
            menu: tree.filter(item => !item.header || item.children.length),
            permissions: Object.fromEntries(rows.map(row => [row.menuItem.code, toFlags(row)])),
        };
    },
    roles() {
        return db.roleMaster.findMany({ where: active, orderBy: { id: 'asc' }, select: { id: true, code: true, name: true } });
    },
    // Every active menu item with this role's flags, in sidebar order (parents before children).
    async rolePermissions(roleId) {
        if (!await db.roleMaster.findFirst({ where: { id: roleId, ...active } })) notFound('Role');
        const items = await db.menuItem.findMany({ where: active, include: { permissions: { where: { roleId, ...active } } } });
        const flatten = nodes => nodes.flatMap(node => [node, ...flatten(node.children)]);
        const tree = buildTree(items.map(item => ({ id: item.id, parentId: item.parentId, sequence: item.sequence, item })));
        return flatten(tree).map(({ item }) => ({ menuItemId: item.id, code: item.code, name: item.name, description: item.description, parentId: item.parentId, header: item.header === 1, showInMenu: item.showInMenu === 1, ...toFlags(item.permissions[0]) }));
    },
    async saveRolePermissions(identity, roleId, entries) {
        const role = await db.roleMaster.findFirst({ where: { id: roleId, ...active } });
        if (!role) notFound('Role');
        const items = await db.menuItem.findMany({ where: { id: { in: entries.map(entry => entry.menuItemId) }, ...active } });
        if (items.length !== new Set(entries.map(entry => entry.menuItemId)).size)
            fail(400, 'Unknown or inactive menu item');
        // Keep at least one role able to manage access control.
        const accessControl = items.find(item => item.code === 'access-control');
        const ownEntry = accessControl && entries.find(entry => entry.menuItemId === accessControl.id);
        if (role.code === 'SUPER_ADMIN' && ownEntry && !(ownEntry.view && ownEntry.update))
            fail(400, 'Super Admin must keep view and update access to Access control');
        await db.$transaction(entries.map(entry => {
            const flags = Object.fromEntries(permissionActions.map(action => [flagColumns[action], entry[action] ? 1 : 0]));
            return db.roleMenuPermission.upsert({
                where: { roleId_menuItemId: { roleId, menuItemId: entry.menuItemId } },
                create: { roleId, menuItemId: entry.menuItemId, ...flags, createdBy: identity.id },
                update: { ...flags, activeIndicator: 1, updatedBy: identity.id },
            });
        }));
        cache.clear();
        return { success: true };
    },
};
