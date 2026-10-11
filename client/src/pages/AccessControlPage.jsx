import { PaginatedTable } from '../components/Pagination';
import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useWorkspace } from '../workspace';

const actions = ['view', 'create', 'update', 'delete', 'export'];

// Edits app_rle_mnu_itm_rel_t: which menus each role sees and what it may do there.
export function AccessControlPage() {
    const { api, act, busy, reload, setNotice, setError, user } = useWorkspace();
    const [roles, setRoles] = useState([]);
    const [roleId, setRoleId] = useState(null);
    const [rows, setRows] = useState([]);
    const [dirty, setDirty] = useState(false);
    useEffect(() => { api('/access/roles').then(list => { setRoles(list); setRoleId(list[0]?.id ?? null); }).catch(e => setError(e.message)); }, []);
    useEffect(() => {
        if (roleId)
            api(`/access/roles/${roleId}/permissions`).then(list => { setRows(list); setDirty(false); }).catch(e => setError(e.message));
    }, [roleId]);
    function toggle(menuItemId, action) {
        setRows(current => current.map(row => row.menuItemId === menuItemId ? { ...row, [action]: !row[action] } : row));
        setDirty(true);
    }
    function chooseRole(id) {
        if (dirty && !window.confirm('Discard unsaved permission changes?'))
            return;
        setRoleId(id);
    }
    const save = () => act(async () => {
        const permissions = rows.filter(row => !row.header).map(({ menuItemId, view, create, update, delete: remove, export: exportFlag }) => ({ menuItemId, view, create, update, delete: remove, export: exportFlag }));
        await api(`/access/roles/${roleId}/permissions`, 'PUT', { permissions });
        setDirty(false);
        setNotice('Permissions saved. They apply to this role in every college.');
        // Refresh this user's own sidebar when their role changed.
        if (roles.find(role => role.id === roleId)?.code === user.role)
            await reload();
    });
    return <section className="panel">
        <div className="section-title">
            <h2>Menu permissions</h2>
            <label className="inline-field">Role<select value={roleId ?? ''} onChange={event => chooseRole(Number(event.target.value))}>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
        </div>
        <p className="muted">View shows the menu in the sidebar. Create, update and delete control the actions on that page. Header rows appear when any item under them is visible.</p>
        <div className="table-wrap"><PaginatedTable>
            <thead><tr><th>Menu item</th>{actions.map(action => <th key={action}>{action[0].toUpperCase() + action.slice(1)}</th>)}</tr></thead>
            <tbody>{rows.map(row => row.header
                ? <tr key={row.menuItemId}><td colSpan={actions.length + 1}><strong>{row.name}</strong></td></tr>
                : <tr key={row.menuItemId}>
                    <td style={{ paddingLeft: row.parentId ? 32 : undefined }}><strong>{row.name}</strong>{!row.showInMenu && <span className="tag pending">not in sidebar</span>}<br/><small className="muted">{row.description}</small></td>
                    {actions.map(action => <td key={action}><input type="checkbox" aria-label={`${row.name} ${action}`} checked={row[action]} onChange={() => toggle(row.menuItemId, action)}/></td>)}
                </tr>)}</tbody>
        </PaginatedTable></div>
        <div className="manager-actions"><button className="primary" disabled={busy || !dirty} onClick={save}><Save size={16}/>{busy ? 'Saving…' : 'Save permissions'}</button></div>
    </section>;
}
