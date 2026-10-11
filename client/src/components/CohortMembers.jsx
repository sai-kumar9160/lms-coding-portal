import { PaginatedItems } from './Pagination';
import { useEffect, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { useWorkspace } from '../workspace';

// Members of one cohort: add individual students, or every student of the cohort's batch at once.
export function CohortMembers({ cohort, onChanged, onClose }) {
    const { api, act, busy, setNotice, users, can } = useWorkspace();
    const [members, setMembers] = useState([]);
    const [choice, setChoice] = useState('');
    const load = () => api(`/academics/cohorts/${cohort.id}/members`).then(setMembers);
    useEffect(() => { load().catch(() => {}); }, [cohort.id]);
    const memberIds = new Set(members.map(m => m.userId));
    const students = users.filter(u => u.role === 'STUDENT' && u.status === 'ACTIVE' && !memberIds.has(u.id));
    const batchStudents = cohort.batchId ? students.filter(u => u.studentProfile?.batchId === cohort.batchId) : [];
    const editable = can('academics', 'update') && !cohort.archived;
    const add = (userIds, message) => act(async () => { await api(`/academics/cohorts/${cohort.id}/members`, 'POST', { userIds }); setChoice(''); await Promise.all([load(), onChanged()]); setNotice(message); });
    const remove = (member) => act(async () => { await api(`/academics/cohorts/${cohort.id}/members/${member.userId}`, 'DELETE'); await Promise.all([load(), onChanged()]); setNotice(`${member.user.name} removed from ${cohort.name}.`); });
    return <section className="manager-module">
        <div className="section-title"><h3>{cohort.name}: members ({members.length})</h3><button className="text-button" onClick={onClose}><X size={15}/>Close</button></div>
        {cohort.archived ? <p className="muted">This cohort is archived, so its members cannot change.</p> : null}
        {editable && <div className="manager-actions">
            <select aria-label="Student to add" value={choice} onChange={event => setChoice(event.target.value)}><option value="">Choose a student…</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}{s.studentProfile?.rollNumber ? ` (${s.studentProfile.rollNumber})` : ''}</option>)}</select>
            <button className="primary" disabled={busy || !choice} onClick={() => add([choice], 'Student added.')}><UserPlus size={16}/>Add</button>
            {batchStudents.length > 0 && <button className="text-button" disabled={busy} onClick={() => add(batchStudents.map(s => s.id), `${batchStudents.length} students of the batch added.`)}>Add all {batchStudents.length} students of the batch</button>}
        </div>}
        <PaginatedItems>{members.map(member => <div className="lesson-row" key={member.userId}>
            <span>{member.user.name} <small className="muted">{member.user.studentProfile?.rollNumber || member.user.email}</small></span>
            {editable && <button className="text-button danger" disabled={busy} onClick={() => remove(member)}><X size={15}/>Remove</button>}
        </div>)}</PaginatedItems>
    </section>;
}
