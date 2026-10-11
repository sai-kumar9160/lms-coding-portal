import { PaginatedTable } from '../components/Pagination';
import { Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWorkspace } from '../workspace';

export function PeoplePage() {
    const { api, act, busy, reload, setNotice, setModal, user, users, can, inCollege, isSuper, colleges, college, switchCollege } = useWorkspace();
    const [branches, setBranches] = useState([]);
    const [branchEdit, setBranchEdit] = useState(null);
    const [branchError, setBranchError] = useState('');
    const manageBranches = can('people', 'update') && ['SUPER_ADMIN', 'COLLEGE_ADMIN'].includes(user.role);
    useEffect(() => {
        let cancelled = false;
        setBranchEdit(null); setBranches([]); setBranchError('');
        if (inCollege && can('people', 'update')) api('/users/branch-options').then(data => { if (!cancelled) setBranches(data); }, error => { if (!cancelled) setBranchError(error.message); });
        return () => { cancelled = true; };
    }, [college?.id, inCollege]);
    const saveBranches = event => {
        event.preventDefault();
        act(async () => {
            await api(`/users/${branchEdit.id}/branches`, 'PUT', { branchGroupIds: branchEdit.ids });
            await reload(); setBranchEdit(null); setNotice('Student branch groups updated.');
        });
    };
    const collegePicker = isSuper && <label className="people-college-picker">College
        <select value={college?.id || ''} disabled={busy} onChange={event => switchCollege(event.target.value)}>
            <option value="">Choose a college</option>
            {colleges.map(item => <option key={item.id} value={item.id}>{item.name} ({item.slug}){item.active ? '' : ' (suspended)'}</option>)}
        </select>
    </label>;
    if (!inCollege)
        return <section className="panel">
            <div className="section-title"><h2>Students and teachers</h2></div>
            <p className="muted">Choose a college to add students and teachers and manage its members.</p>
            {collegePicker}
            <div className="empty"><Users size={36}/><h3>Select a college to get started</h3><p>New members will belong to the college you select above.</p></div>
        </section>;
    const canApprove = can('people', 'update');
    const canDeactivate = can('people', 'delete');
    const isAdmin = canApprove || canDeactivate;
    const pending = users.filter(u => u.status === 'PENDING').length;
    const approve = (u) => act(async () => { await api(`/users/${u.id}/approve`, 'POST'); await reload(); setNotice(`${u.name} can now sign in as a teacher.`); });
    const deactivate = (u, verb) => {
        if (!window.confirm(`${verb} ${u.name}? They will be signed out and can no longer sign in.`))
            return;
        act(async () => { await api(`/users/${u.id}`, 'DELETE'); await reload(); setNotice(`${u.name} has been ${verb === 'Reject' ? 'rejected' : 'deactivated'}.`); });
    };
    return <section className="panel">
        <div className="section-title"><div><h2>Students and teachers</h2><p className="muted">{college?.name} / {users.length} members</p></div>
            {can('people', 'create') && <button className="primary" disabled={busy} onClick={() => setModal('user')}><Plus size={16}/> {isSuper ? 'Add college member' : 'Add student or teacher'}</button>}
        </div>
        {collegePicker}
        {branchError && <div role="alert" className="alert">{branchError}</div>}
        {branchEdit && <form className="academic-form" onSubmit={saveBranches}>
            <h3>Assign branches — {branchEdit.name}</h3>
            <p className="muted">Select the student's branch groups. Membership controls which group assessments they can access. Unchecking a group removes that membership.</p>
            {!branches.length && <p>Create branch groups in Academics first.</p>}
            <div className="check-row">{branches.map(branch => <label className="check" key={branch.id}><input type="checkbox" checked={branchEdit.ids.includes(branch.id)} onChange={event => setBranchEdit(current => ({ ...current, ids: event.target.checked ? [...current.ids, branch.id] : current.ids.filter(id => id !== branch.id) }))}/>{branch.name}</label>)}</div>
            <div className="manager-actions"><button className="primary" disabled={busy}>Save branches</button><button type="button" className="text-button" disabled={busy} onClick={() => setBranchEdit(null)}>Cancel</button></div>
        </form>}
        {isAdmin && pending > 0 && <div role="status" className="success">{pending} teacher registration{pending !== 1 ? 's' : ''} awaiting your approval.</div>}
        <div className="table-wrap"><PaginatedTable>
            <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Branch</th><th>Roll no. / Employee code</th><th>Batch / Department</th><th>Status</th>{isAdmin && <th>Action</th>}</tr></thead>
            <tbody>{users.length === 0 && <tr><td colSpan={isAdmin ? 9 : 8}>No members yet. Add a student or teacher to this college.</td></tr>}{users.map(u => {
                const manageable = isAdmin && ['TEACHER', 'STUDENT'].includes(u.role);
                const student = u.studentProfile, teacher = u.teacherProfile;
                return <tr key={u.id}>
                    <td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.mobileNo || 'Not provided'}</td>
                    <td><span className="tag">{u.role.replaceAll('_', ' ')}</span></td>
                    <td>{u.role === 'STUDENT' ? u.cohorts?.map(row => row.cohort.name).join(', ') || 'Not assigned' : '—'}</td>
                    <td>{student?.rollNumber || teacher?.employeeCode || '—'}</td>
                    <td>{student?.batch ? `${student.batch.name}${student.batch.section ? ` · ${student.batch.section}` : ''}` : teacher?.department?.name || '—'}</td>
                    <td><span className={`tag${u.status === 'PENDING' ? ' pending' : ''}`}>{u.status === 'PENDING' ? 'Awaiting approval' : 'Active'}</span></td>
                    {isAdmin && <td>{manageable && <span className="row-actions">
                        {manageBranches && u.role === 'STUDENT' && <button disabled={busy} className="text-button" onClick={() => setBranchEdit({ id: u.id, name: u.name, ids: u.cohorts?.map(row => row.cohort.id) ?? [] })}>Assign branch</button>}
                        {canApprove && u.status === 'PENDING' && <button disabled={busy} className="text-button" onClick={() => approve(u)}>Approve</button>}
                        {canApprove && u.status === 'ACTIVE' && <button disabled={busy} className="text-button" onClick={() => setModal(`profile:${u.id}`)}>Profile</button>}
                        {canDeactivate && <button disabled={busy} className="text-button danger" onClick={() => deactivate(u, u.status === 'PENDING' ? 'Reject' : 'Deactivate')}>{u.status === 'PENDING' ? 'Reject' : 'Deactivate'}</button>}
                    </span>}</td>}
                </tr>;
            })}</tbody>
        </PaginatedTable></div>
    </section>;
}
