import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useWorkspace } from '../workspace';

const day = value => value ? value.slice(0, 10) : '';

// Student profile (roll number, batch, …) or teacher profile (employee code, department, …) for one person.
export function ProfileForm({ person }) {
    const { api, act, busy, reload, setModal, setNotice } = useWorkspace();
    const student = person.role === 'STUDENT';
    const profile = (student ? person.studentProfile : person.teacherProfile) || {};
    const [choices, setChoices] = useState([]);
    const [form, setForm] = useState(student
        ? { rollNumber: profile.rollNumber || '', batchId: profile.batchId || '', admissionYear: profile.admissionYear ?? '', dateOfBirth: day(profile.dateOfBirth), gender: profile.gender || '', guardianPhone: profile.guardianPhone || '' }
        : { employeeCode: profile.employeeCode || '', departmentId: profile.departmentId || '', designation: profile.designation || '', qualification: profile.qualification || '' });
    useEffect(() => { api(`/academics/${student ? 'batches' : 'departments'}`).then(setChoices).catch(() => setChoices([])); }, [student]);
    const change = (field) => (event) => setForm(current => ({ ...current, [field]: event.target.value }));
    function save(event) {
        event.preventDefault();
        // Empty optional fields are sent as null.
        const body = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value === '' ? null : key === 'admissionYear' ? Number(value) : value]));
        act(async () => { await api(`/users/${person.id}/profile`, 'PUT', body); await reload(); setModal(''); setNotice(`Profile of ${person.name} saved.`); });
    }
    return <>
        <span className="eyebrow">{student ? 'STUDENT PROFILE' : 'TEACHER PROFILE'}</span><h2>{person.name}</h2>
        <form onSubmit={save}>
            {student ? <>
                <div className="field-row"><label>Roll number<input required maxLength={30} value={form.rollNumber} onChange={change('rollNumber')}/></label>
                    <label>Batch<select value={form.batchId} onChange={change('batchId')}><option value="">Not assigned</option>{choices.map(b => <option key={b.id} value={b.id}>{b.name}{b.section ? ` · ${b.section}` : ''} ({b.academicYear.name})</option>)}</select></label></div>
                <div className="field-row"><label>Admission year<input type="number" min={1990} max={2100} value={form.admissionYear} onChange={change('admissionYear')}/></label>
                    <label>Date of birth<input type="date" value={form.dateOfBirth} onChange={change('dateOfBirth')}/></label></div>
                <div className="field-row"><label>Gender<select value={form.gender} onChange={change('gender')}><option value="">Not specified</option><option value="FEMALE">Female</option><option value="MALE">Male</option><option value="OTHER">Other</option></select></label>
                    <label>Guardian phone<input type="tel" maxLength={25} value={form.guardianPhone} onChange={change('guardianPhone')} placeholder="e.g. +919876543210"/></label></div>
            </> : <>
                <div className="field-row"><label>Employee code<input required maxLength={30} value={form.employeeCode} onChange={change('employeeCode')}/></label>
                    <label>Department<select value={form.departmentId} onChange={change('departmentId')}><option value="">Not assigned</option>{choices.map(d => <option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}</select></label></div>
                <div className="field-row"><label>Designation<input maxLength={100} value={form.designation} onChange={change('designation')} placeholder="e.g. Assistant Professor"/></label>
                    <label>Qualification<input maxLength={200} value={form.qualification} onChange={change('qualification')} placeholder="e.g. M.Tech"/></label></div>
            </>}
            <button className="primary full" disabled={busy}><Save size={16}/>{busy ? 'Saving…' : 'Save profile'}</button>
        </form>
    </>;
}
