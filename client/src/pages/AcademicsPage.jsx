import { PaginatedTable } from '../components/Pagination';
import { useEffect, useState } from 'react';
import { Pencil, Plus, Save, Trash2, Users, X } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { CohortMembers } from '../components/CohortMembers';

const day = value => value ? value.slice(0, 10) : '';
const batchLabel = b => `${b.name}${b.section ? ` · ${b.section}` : ''}`;

// One configuration per academic resource: table columns, form fields, and how a row fills the form.
const tabs = [
    { key: 'academic-years', label: 'Academic years', singular: 'academic year',
        columns: [['Name', r => r.name], ['Starts', r => day(r.startDate)], ['Ends', r => day(r.endDate)], ['Current', r => r.isCurrent ? <span className="tag">Current</span> : ''], ['Batches', r => r._count.batches]],
        fields: [{ name: 'name', label: 'Name (e.g. 2026-27)' }, { name: 'startDate', label: 'Start date', type: 'date' }, { name: 'endDate', label: 'End date', type: 'date' }, { name: 'isCurrent', label: 'Current academic year', type: 'checkbox' }],
        toForm: r => ({ name: r.name, startDate: day(r.startDate), endDate: day(r.endDate), isCurrent: r.isCurrent === 1 }) },
    { key: 'departments', label: 'Departments', singular: 'department',
        columns: [['Code', r => r.code], ['Name', r => r.name], ['Head', r => r.hod?.name || '—'], ['Programmes', r => r._count.programs], ['Teachers', r => r._count.teachers]],
        fields: [{ name: 'code', label: 'Code (e.g. CSE)' }, { name: 'name', label: 'Name' }, { name: 'hodUserId', label: 'Head of department', type: 'select', options: 'teachers', optional: true }],
        toForm: r => ({ code: r.code, name: r.name, hodUserId: r.hodUserId || '' }) },
    { key: 'programs', label: 'Programmes', singular: 'programme',
        columns: [['Code', r => r.code], ['Name', r => r.name], ['Department', r => r.department.name], ['Years', r => r.durationYears], ['Batches', r => r._count.batches]],
        fields: [{ name: 'departmentId', label: 'Department', type: 'select', options: 'departments' }, { name: 'code', label: 'Code (e.g. BTECH-CSE)' }, { name: 'name', label: 'Name' }, { name: 'durationYears', label: 'Duration (years)', type: 'number', min: 1, max: 10 }],
        toForm: r => ({ departmentId: r.departmentId, code: r.code, name: r.name, durationYears: r.durationYears }) },
    { key: 'batches', label: 'Batches', singular: 'batch',
        columns: [['Batch', r => batchLabel(r)], ['Programme', r => r.program.name], ['Academic year', r => r.academicYear.name], ['Students', r => r._count.students], ['Cohorts', r => r._count.cohorts]],
        fields: [{ name: 'programId', label: 'Programme', type: 'select', options: 'programs' }, { name: 'academicYearId', label: 'Academic year', type: 'select', options: 'academic-years' }, { name: 'name', label: 'Batch name (e.g. CSE 2026)' }, { name: 'section', label: 'Section (optional)', optional: true }],
        toForm: r => ({ programId: r.programId, academicYearId: r.academicYearId, name: r.name, section: r.section }) },
    { key: 'cohorts', label: 'Branch groups', singular: 'branch group',
        columns: [['Name', r => r.name], ['Batch', r => r.batch ? batchLabel(r.batch) : '—'], ['Members', r => r._count.members], ['Status', r => r.archived ? <span className="tag pending">Archived</span> : <span className="tag">Active</span>]],
        fields: [{ name: 'name', label: 'Branch group name (e.g. CSE, ECE, Mechanical)' }, { name: 'batchId', label: 'Batch (optional)', type: 'select', options: 'batches', optional: true }, { name: 'description', label: 'Description', type: 'textarea', optional: true }, { name: 'archived', label: 'Archived (members can no longer change)', type: 'checkbox' }],
        toForm: r => ({ name: r.name, batchId: r.batchId || '', description: r.description, archived: r.archived === 1 }) },
];

function Field({ field, value, onChange, options }) {
    if (field.type === 'checkbox')
        return <label className="check"><input type="checkbox" checked={Boolean(value)} onChange={event => onChange(event.target.checked)}/>{field.label}</label>;
    const input = field.type === 'select'
        ? <select required={!field.optional} value={value ?? ''} onChange={event => onChange(event.target.value)}><option value="">{field.optional ? 'None' : 'Choose…'}</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        : field.type === 'textarea' ? <textarea rows={2} maxLength={500} value={value ?? ''} onChange={event => onChange(event.target.value)}/>
        : <input required={!field.optional} type={field.type || 'text'} min={field.min} max={field.max} value={value ?? ''} onChange={event => onChange(event.target.value)}/>;
    return <label>{field.label}{input}</label>;
}

// Academic years, departments, programmes, batches and cohorts of the current college (spec section 7).
export function AcademicsPage() {
    const { api, act, busy, setNotice, users, can, inCollege } = useWorkspace();
    const [tab, setTab] = useState(tabs[0].key);
    const [data, setData] = useState({});
    const [draft, setDraft] = useState(null);
    const [membersOf, setMembersOf] = useState(null);
    const load = () => Promise.all(tabs.map(t => api(`/academics/${t.key}`))).then(lists => setData(Object.fromEntries(tabs.map((t, i) => [t.key, lists[i]]))));
    useEffect(() => { if (inCollege) load().catch(() => {}); }, [inCollege]);
    if (!inCollege)
        return <div className="empty"><Users size={36}/><h3>Choose a college</h3><p>Pick a college in “Working in” at the top to manage its academic structure.</p></div>;
    const config = tabs.find(t => t.key === tab);
    const rows = data[tab] || [];
    const options = {
        teachers: users.filter(u => u.role === 'TEACHER' && u.status === 'ACTIVE').map(u => ({ value: u.id, label: u.name })),
        departments: (data.departments || []).map(d => ({ value: d.id, label: `${d.code} · ${d.name}` })),
        programs: (data.programs || []).map(p => ({ value: p.id, label: `${p.code} · ${p.name}` })),
        'academic-years': (data['academic-years'] || []).map(y => ({ value: y.id, label: y.name })),
        batches: (data.batches || []).map(b => ({ value: b.id, label: `${batchLabel(b)} (${b.academicYear.name})` })),
    };
    const blank = () => Object.fromEntries(config.fields.map(f => [f.name, f.type === 'checkbox' ? false : '']));
    function save(event) {
        event.preventDefault();
        const body = Object.fromEntries(config.fields.map(f => [f.name, f.type === 'number' ? Number(draft.values[f.name]) : f.type === 'select' && !draft.values[f.name] ? null : draft.values[f.name]]));
        act(async () => { await api(`/academics/${tab}${draft.id ? `/${draft.id}` : ''}`, draft.id ? 'PATCH' : 'POST', body); await load(); setDraft(null); setNotice(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} saved.`); });
    }
    function remove(row) {
        if (window.confirm(`Remove this ${config.singular}? It is kept in the audit log.`))
            act(async () => { await api(`/academics/${tab}/${row.id}`, 'DELETE'); await load(); setNotice(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} removed.`); });
    }
    return <section className="panel">
        <div className="auth-tabs academic-tabs">{tabs.map(t => <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => { setTab(t.key); setDraft(null); setMembersOf(null); }}>{t.label}</button>)}</div>
        <div className="section-title"><h2>{config.label}</h2>{can('academics', 'create') && !draft && <button className="primary" onClick={() => setDraft({ values: blank() })}><Plus size={16}/>Add {config.singular}</button>}</div>
        {tab === 'cohorts' && <p className="muted">Create a group for each branch, then use Members to add its students. Select this group in an assessment's Windows tab to make that assessment available only to those members. Linking a batch alone does not add students; use Members to add them.</p>}
        {draft && <form className="academic-form" onSubmit={save}>
            <h3>{draft.id ? 'Edit' : 'Add'} {config.singular}</h3>
            <div className="academic-fields">{config.fields.map(f => <Field key={f.name} field={f} value={draft.values[f.name]} options={options[f.options] || []} onChange={value => setDraft(current => ({ ...current, values: { ...current.values, [f.name]: value } }))}/>)}</div>
            <div className="manager-actions"><button className="primary" disabled={busy}><Save size={16}/>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="text-button" onClick={() => setDraft(null)}><X size={15}/>Cancel</button></div>
        </form>}
        {!rows.length ? <p className="muted">No {config.label.toLowerCase()} yet.</p> : <div className="table-wrap"><PaginatedTable>
            <thead><tr>{config.columns.map(([label]) => <th key={label}>{label}</th>)}<th>Action</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.id}>
                {config.columns.map(([label, value]) => <td key={label}>{value(row)}</td>)}
                <td><span className="row-actions">
                    {tab === 'cohorts' && <button className="text-button" onClick={() => setMembersOf(membersOf?.id === row.id ? null : row)}><Users size={15}/>Members</button>}
                    {can('academics', 'update') && <button aria-label="Edit" title="Edit" className="text-button" onClick={() => setDraft({ id: row.id, values: config.toForm(row) })}><Pencil size={15} aria-hidden="true"/></button>}
                    {can('academics', 'delete') && <button className="text-button danger" disabled={busy} onClick={() => remove(row)}><Trash2 size={15}/>Remove</button>}
                </span></td>
            </tr>)}</tbody>
        </PaginatedTable></div>}
        {membersOf && <CohortMembers cohort={rows.find(r => r.id === membersOf.id) || membersOf} onChanged={load} onClose={() => setMembersOf(null)}/>}
    </section>;
}
