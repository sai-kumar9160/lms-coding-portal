import { db } from '../../../../config/db.config.js';
import { buildTree } from '../../../utils/tree.js';
import { fail, notFound } from '../../../utils/http-error.js';

// Permission flags in app_rle_mnu_itm_rel_t (slct_in, insrt_in, updt_in, dlte_in, exprt_in).
const flagColumns = { view: 'canView', create: 'canCreate', update: 'canUpdate', delete: 'canDelete', export: 'canExport' };
export const permissionActions = Object.keys(flagColumns);
const toFlags = row => Object.fromEntries(permissionActions.map(action => [action, row?.[flagColumns[action]] === 1]));
const flags = Object.values(flagColumns);
const menuFields = ['id', 'parentId', 'code', 'name', 'icon', 'url', 'sequence', 'header', 'showInMenu'];

// Permissions are checked on every protected request, so each role's set is cached briefly.
// Saving permissions clears the cache; other server processes pick up changes within CACHE_MS.
const CACHE_MS = 60000;
const cache = new Map();

// Every active permission row of a role, with its active menu item: { canView, ..., menuItem: { id, code, ... } }.
async function rolePermissionRows(roleCode) {
    const rows = await db.many(
        `SELECT p.slct_in AS "canView", p.insrt_in AS "canCreate", p.updt_in AS "canUpdate", p.dlte_in AS "canDelete", p.exprt_in AS "canExport",
            m.mnu_itm_id AS "id", m.prnt_mnu_itm_id AS "parentId", m.mnu_itm_cd AS "code", m.mnu_itm_nm AS "name", m.mnu_itm_icn_tx AS "icon", m.mnu_itm_url_tx AS "url",
            m.sqnce_id AS "sequence", m.hdr_in AS "header", m.shw_in AS "showInMenu"
         FROM app_rle_mnu_itm_rel_t p
         JOIN role_t r ON r.role_id = p.role_id
         JOIN app_mnu_itm_lst_t m ON m.mnu_itm_id = p.mnu_itm_id
         WHERE p.a_in = 1 AND r.role_code = $1 AND r.a_in = 1 AND m.a_in = 1`, [roleCode]);
    return rows.map(row => ({ ...Object.fromEntries(flags.map(flag => [flag, row[flag]])), menuItem: Object.fromEntries(menuFields.map(field => [field, row[field]])) }));
}

export const accessMdl = {
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
        const [rows, headers] = await Promise.all([
            rolePermissionRows(roleCode),
            db.many(`SELECT m.mnu_itm_id AS "id", m.prnt_mnu_itm_id AS "parentId", m.mnu_itm_cd AS "code", m.mnu_itm_nm AS "name", m.mnu_itm_icn_tx AS "icon", m.mnu_itm_url_tx AS "url",
            m.sqnce_id AS "sequence", m.hdr_in AS "header", m.shw_in AS "showInMenu"
             FROM app_mnu_itm_lst_t m WHERE m.a_in = 1 AND m.hdr_in = 1 AND m.shw_in = 1`),
        ]);
        const node = (item, permissions) => ({ id: item.id, parentId: item.parentId, code: item.code, name: item.name, icon: item.icon, url: item.url, sequence: item.sequence, header: item.header === 1, permissions });
        const visible = rows.filter(row => row.canView === 1 && row.menuItem.showInMenu === 1 && row.menuItem.header === 0 && row.menuItem.url);
        const tree = buildTree([...headers.map(item => node(item, toFlags(null))), ...visible.map(row => node(row.menuItem, toFlags(row)))]);
        return {
            menu: tree.filter(item => !item.header || item.children.length),
            permissions: Object.fromEntries(rows.map(row => [row.menuItem.code, toFlags(row)])),
        };
    },
    roles() {
        return db.many(`SELECT r.role_id AS "id", r.role_code AS "code", r.role_name AS "name" FROM role_t r WHERE r.a_in = 1 ORDER BY r.role_id ASC`);
    },
    // Every active menu item with this role's flags, in sidebar order (parents before children).
    async rolePermissions(roleId) {
        if (!await db.one('SELECT 1 FROM role_t WHERE role_id = $1 AND a_in = 1', [roleId])) notFound('Role');
        const items = await db.many(
            `SELECT m.mnu_itm_id AS "id", m.prnt_mnu_itm_id AS "parentId", m.mnu_itm_cd AS "code", m.mnu_itm_nm AS "name", m.mnu_itm_icn_tx AS "icon", m.mnu_itm_url_tx AS "url",
            m.sqnce_id AS "sequence", m.hdr_in AS "header", m.shw_in AS "showInMenu", m.mnu_dscn_tx AS "description",
                    p.slct_in AS "canView", p.insrt_in AS "canCreate", p.updt_in AS "canUpdate", p.dlte_in AS "canDelete", p.exprt_in AS "canExport"
             FROM app_mnu_itm_lst_t m
             LEFT JOIN app_rle_mnu_itm_rel_t p ON p.mnu_itm_id = m.mnu_itm_id AND p.role_id = $1 AND p.a_in = 1
             WHERE m.a_in = 1`, [roleId]);
        const flatten = nodes => nodes.flatMap(node => [node, ...flatten(node.children)]);
        const tree = buildTree(items.map(item => ({ id: item.id, parentId: item.parentId, sequence: item.sequence, item })));
        return flatten(tree).map(({ item }) => ({ menuItemId: item.id, code: item.code, name: item.name, description: item.description, parentId: item.parentId, header: item.header === 1, showInMenu: item.showInMenu === 1, ...toFlags(item) }));
    },
    async saveRolePermissions(identity, roleId, entries) {
        const role = await db.one(`SELECT r.role_id AS "id", r.role_code AS "code" FROM role_t r WHERE r.role_id = $1 AND r.a_in = 1`, [roleId]);
        if (!role) notFound('Role');
        const items = await db.many(`SELECT m.mnu_itm_id AS "id", m.mnu_itm_cd AS "code" FROM app_mnu_itm_lst_t m WHERE m.mnu_itm_id = ANY($1::int[]) AND m.a_in = 1`, [entries.map(entry => entry.menuItemId)]);
        if (items.length !== new Set(entries.map(entry => entry.menuItemId)).size)
            fail(400, 'Unknown or inactive menu item');
        // Keep at least one role able to manage access control.
        const accessControl = items.find(item => item.code === 'access-control');
        const ownEntry = accessControl && entries.find(entry => entry.menuItemId === accessControl.id);
        if (role.code === 'SUPER_ADMIN' && ownEntry && !(ownEntry.view && ownEntry.update))
            fail(400, 'Super Admin must keep view and update access to Access control');
        await db.transaction(async tx => {
            for (const entry of entries) {
                const [view, create, update, remove, exported] = permissionActions.map(action => entry[action] ? 1 : 0);
                await tx.run(
                    `INSERT INTO app_rle_mnu_itm_rel_t (role_id, mnu_itm_id, slct_in, insrt_in, updt_in, dlte_in, exprt_in, crte_usr_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (role_id, mnu_itm_id) DO UPDATE
                     SET slct_in = $3, insrt_in = $4, updt_in = $5, dlte_in = $6, exprt_in = $7, a_in = 1, updte_usr_id = $8`,
                    [roleId, entry.menuItemId, view, create, update, remove, exported, identity.id]);
            }
        });
        cache.clear();
        return { success: true };
    },
};
