import { useState } from 'react';
import { useWorkspace } from '../workspace';
import { PasswordInput } from './PasswordInput';
import { PdfCourseForm } from './PdfCourseForm';

function SourceTabs({ source, onChange }) {
    return <div className="auth-tabs source-tabs">
        <button type="button" aria-pressed={source === 'blank'} onClick={() => onChange('blank')}>Start blank</button>
        <button type="button" aria-pressed={source === 'pdf'} onClick={() => onChange('pdf')}>From a PDF</button>
    </div>;
}

const forms = {
    college: { title: 'Add a new college', path: '/colleges', fields: [['name', 'College name'], ['slug', 'College code'], ['adminName', 'Admin name'], ['adminEmail', 'Admin email'], ['adminPassword', 'Admin password']] },
    user: { title: 'Add a student or teacher', path: '/users', fields: [['name', 'Full name'], ['email', 'Email'], ['mobileNo', 'Mobile number'], ['password', 'Password']] },
    course: { title: 'Create your course', path: '/courses', fields: [['title', 'Course title'], ['description', 'Description'], ['moduleTitle', 'First module title'], ['lessonTitle', 'First lesson title'], ['content', 'Lesson content']] },
};

function Field({ name }) {
    if (name === 'content' || name === 'description')
        return <textarea name={name} required minLength={name === 'content' ? 10 : 5} rows={name === 'content' ? 6 : 2}/>;
    if (name.toLowerCase().includes('password'))
        return <PasswordInput name={name} required minLength={10} maxLength={100} autoComplete="new-password"/>;
    return <input name={name} required type={name.toLowerCase().includes('email') ? 'email' : 'text'}/>;
}

export function CreateForm({ kind }) {
    const { api, act, busy, reload, setModal, setNotice, college, isSuper } = useWorkspace();
    // Courses can start blank or be built from a PDF of course notes.
    const [source, setSource] = useState('blank');
    const form = kind === 'user' && isSuper ? { ...forms.user, title: 'Add a college member' } : forms[kind];
    if (kind === 'course' && source === 'pdf')
        return <><span className="eyebrow">BUILD YOUR CAMPUS</span><h2>{form.title}</h2><SourceTabs source={source} onChange={setSource}/><PdfCourseForm/></>;
    function submit(event) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        act(async () => { await api(form.path, 'POST', data); await reload(); setModal(''); setNotice(kind === 'user' ? `${data.role === 'COLLEGE_ADMIN' ? 'College admin' : data.role === 'TEACHER' ? 'Teacher' : 'Student'} added to ${college.name}.` : 'Created successfully.'); });
    }
    return <>
        <span className="eyebrow">BUILD YOUR CAMPUS</span><h2>{form.title}</h2>
        {kind === 'course' && <SourceTabs source={source} onChange={setSource}/>}
        <form onSubmit={submit}>
            {kind === 'user' && <p className="muted">College: <strong>{college?.name}</strong> ({college?.slug})</p>}
            {form.fields.map(([name, label]) => <label key={name}>{label}<Field name={name}/></label>)}
            {kind === 'user' && <label>Role<select name="role"><option value="STUDENT">Student</option><option value="TEACHER">Teacher</option>{isSuper && <option value="COLLEGE_ADMIN">College Admin</option>}</select></label>}
            <button disabled={busy} className="primary full">{busy ? 'Saving…' : 'Create'}</button>
        </form>
    </>;
}
