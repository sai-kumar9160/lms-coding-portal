import { PaginatedTable } from './Pagination';
import { Pencil, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../workspace';

const memberRoles = [['COLLEGE_ADMIN', 'College admins'], ['TEACHER', 'Teachers'], ['STUDENT', 'Students']];

export function CollegeDirectory() {
    const { api, act, busy, reload, colleges, can, setNotice, error, setError, setModal } = useWorkspace();
    const [editing, setEditing] = useState(null);
    const editDialog = useRef(null);
    useEffect(() => {
        if (editing && !editDialog.current?.open) editDialog.current?.showModal();
    }, [editing]);
    const [members, setMembers] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    function saveMember(event) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        act(async () => {
            const updated = await api(`/colleges/${members.college.id}/members/${editingMember.id}`, 'PATCH', data);
            setMembers(current => ({ ...current, rows: current.rows.map(person => person.id === updated.id ? updated : person) }));
            setEditingMember(null);
            await reload();
            setNotice('Member details updated successfully.');
        });
    }
    const membersDialog = useRef(null);
    useEffect(() => {
        if (members && !membersDialog.current?.open) membersDialog.current?.showModal();
    }, [members]);
    const showMembers = (college, role, label) => act(async () => {
        const rows = await api(`/colleges/${college.id}/members?role=${role}`);
        setEditingMember(null);
        setMembers({ college, label, rows });
    });
    const canEdit = can('colleges', 'update');
    function save(event) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        act(async () => {
            await api(`/colleges/${editing.id}`, 'PATCH', data);
            await reload();
            setEditing(null);
            setNotice('College details updated. Use the updated college code when signing in.');
        });
    }
    const toggle = (c) => act(async () => { await api(`/colleges/${c.id}`, 'PATCH', { active: !c.active }); await reload(); });
    return <section className="panel college-directory">
        <div className="section-title directory-heading"><div><span className="eyebrow">COLLEGE MANAGEMENT</span><h2>College directory</h2><p className="muted">Manage your colleges and explore their members.</p></div>{can('colleges', 'create') && <button className="primary directory-add-college" disabled={busy} onClick={() => { setError(''); setModal('college'); }}><Plus size={16}/> Add college</button>}</div>
        {members && <dialog ref={membersDialog} className="modal college-edit-dialog college-members-dialog" aria-labelledby="college-members-title" onCancel={() => setMembers(null)}>
            <button type="button" className="close" aria-label="Close member details" onClick={() => setMembers(null)}>×</button>
            <span className="eyebrow">COLLEGE MEMBERS</span>
            <h2 id="college-members-title">{members.label} <span className="directory-total">{members.rows.length}</span></h2>
            <p className="muted">{members.college.name} ({members.college.slug})</p>
            {error && <div className="alert" role="alert">{error}</div>}
            {editingMember && <form key={editingMember.id} onSubmit={saveMember} className="member-edit-form">
                <h3>Edit member</h3>
                <label>Full name<input name="name" required minLength={2} maxLength={100} defaultValue={editingMember.name}/></label>
                <label>Mobile number<input name="mobileNo" type="tel" maxLength={25} defaultValue={editingMember.mobileNo || ''}/></label>
                <label>Email<input name="email" type="email" required defaultValue={editingMember.email}/></label>
                <div className="row-actions"><button className="primary" disabled={busy}>Save changes</button><button type="button" className="text-button" disabled={busy} onClick={() => setEditingMember(null)}>Cancel</button></div>
            </form>}
            <div className="table-wrap directory-table-wrap"><PaginatedTable className="member-details-table"><thead><tr><th>Name</th><th>Mobile number</th><th>Email</th>{canEdit && <th>Action</th>}</tr></thead>
                <tbody>{members.rows.map(person => <tr key={person.id}><td>{person.name}</td><td>{person.mobileNo || 'Not provided'}</td><td>{person.email}</td>{canEdit && <td><button className="text-button edit-icon-button" aria-label={`Edit ${person.name}`} title="Edit member" disabled={busy} onClick={() => { setError(''); setEditingMember(person); }}><Pencil size={16} aria-hidden="true"/></button></td>}</tr>)}
                    {members.rows.length === 0 && <tr><td colSpan={canEdit ? 4 : 3}>No {members.label.toLowerCase()} in this college.</td></tr>}
                </tbody></PaginatedTable></div>
            <div className="member-dialog-actions"><button type="button" className="primary" onClick={() => setMembers(null)}>Close</button></div>
        </dialog>}
        {editing && <dialog ref={editDialog} className="modal college-edit-dialog" aria-labelledby="college-edit-title" onCancel={event => { if (busy) event.preventDefault(); else setEditing(null); }}>
            <button type="button" className="close" aria-label="Close edit college" disabled={busy} onClick={() => setEditing(null)}>×</button>
            <h3 id="college-edit-title">Edit college</h3>
            {error && <div className="alert" role="alert">{error}</div>}
            <form key={editing.id} onSubmit={save}>
            <label>College name<input name="name" required minLength={2} maxLength={100} defaultValue={editing.name}/></label>
            <label>College code<input name="slug" required pattern="[a-z][a-z0-9-]{1,40}" maxLength={41} defaultValue={editing.slug}/></label>
            <p className="muted">Use lowercase letters, numbers, or hyphens. Changing the code changes what members enter when signing in.</p>
            <div className="row-actions"><button className="primary" disabled={busy}>Save changes</button><button type="button" className="text-button" disabled={busy} onClick={() => setEditing(null)}>Cancel</button></div>
            </form>
        </dialog>}
        <div className="table-wrap directory-table-wrap"><PaginatedTable className="directory-table">
            <thead><tr><th rowSpan={2} scope="col">College</th><th rowSpan={2} scope="col">Code</th><th colSpan={3} scope="colgroup" className="members-group">Members</th><th rowSpan={2} scope="col">Status</th><th rowSpan={2} scope="col">Action</th></tr>
                <tr>{memberRoles.map(([role, label]) => <th key={role} scope="col" className="member-subheading">{label}</th>)}</tr></thead>
            <tbody>{colleges.map(c => <tr key={c.id}><td><strong>{c.name}</strong></td><td><span className="college-code-badge">{c.slug}</span></td>{memberRoles.map(([role, label]) => <td key={role} className="member-count-cell"><button className="member-count-button" disabled={busy || !c.memberCounts} onClick={() => showMembers(c, role, label)} aria-label={`${c.name}: ${label}, ${c.memberCounts?.[role] ?? 'unavailable'}`}>{c.memberCounts ? c.memberCounts[role] || 0 : '\u2014'}</button></td>)}<td><span className={`college-status ${c.active ? 'is-active' : 'is-suspended'}`}>{c.active ? 'Active' : 'Suspended'}</span></td><td>{canEdit && <span className="row-actions"><button disabled={busy} className="text-button edit-icon-button" aria-label={`Edit ${c.name}`} title="Edit college" onClick={() => { setError(''); setEditing(c); }}><Pencil size={16} aria-hidden="true"/></button><button disabled={busy} className="text-button" onClick={() => toggle(c)}>{c.active ? 'Suspend' : 'Reactivate'}</button></span>}</td></tr>)}</tbody>
        </PaginatedTable></div>
    </section>;
}
