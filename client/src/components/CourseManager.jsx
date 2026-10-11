import { useState } from 'react';
import { Plus, Pencil, RefreshCw, Save, Trash2, Upload, UserPlus, X } from 'lucide-react';
import { request, uploadFile } from '../api';
import { useWorkspace } from '../workspace';
import { LessonForm } from './LessonForm';

const statuses = { DRAFT: 'Draft', PUBLISHED: 'Published', ARCHIVED: 'Archived' };
const levels = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };
const typeLabels = { TEXT: 'Text', VIDEO: 'Video', DOCUMENT: 'PDF' };

// Owner and co-instructors. The owner and College Admins can add or remove co-instructors.
function Instructors({ course, onSaved, run, busy }) {
    const { user, users } = useWorkspace();
    const [teacherId, setTeacherId] = useState('');
    const canManage = user.role === 'COLLEGE_ADMIN' || course.instructors.some(i => i.userId === user.id && i.role === 'OWNER');
    const candidates = users.filter(u => u.role === 'TEACHER' && u.status === 'ACTIVE' && !course.instructors.some(i => i.userId === u.id));
    const add = () => run(async () => { await request(`/courses/${course.id}/instructors`, 'POST', { userId: teacherId }); setTeacherId(''); await onSaved(); }, 'Co-instructor added.');
    const remove = (instructor) => run(async () => { await request(`/courses/${course.id}/instructors/${instructor.userId}`, 'DELETE'); await onSaved(); }, 'Co-instructor removed.');
    return <section className="manager-module">
        <div className="section-title"><h3>Instructors</h3></div>
        {course.instructors.map(instructor => <div className="lesson-row" key={instructor.userId}><span>{instructor.user.name} <span className="tag">{instructor.role === 'OWNER' ? 'Owner' : 'Co-instructor'}</span></span>
            {canManage && instructor.role !== 'OWNER' && <button className="text-button danger" disabled={busy} onClick={() => remove(instructor)}><X size={15}/>Remove</button>}</div>)}
        {canManage && candidates.length > 0 && <div className="manager-actions">
            <select aria-label="Teacher to add" value={teacherId} onChange={event => setTeacherId(event.target.value)}><option value="">Choose a teacher…</option>{candidates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <button className="primary" disabled={busy || !teacherId} onClick={add}><UserPlus size={16}/>Add co-instructor</button>
        </div>}
    </section>;
}

export function CourseManager({ course, onSaved }) {
    const { user } = useWorkspace();
    // Sharing with every college is an admin decision (the server enforces it too).
    const canShare = user.role === 'COLLEGE_ADMIN' || user.role === 'SUPER_ADMIN';
    const [draft, setDraft] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [uploadPct, setUploadPct] = useState(null);
    async function run(action, success) {
        setBusy(true); setError(''); setNotice('');
        try { await action(); if (success) setNotice(success); }
        catch (actionError) { setError(actionError.message); }
        finally { setBusy(false); }
    }
    function edit(kind, item = {}, moduleId) {
        setError(''); setNotice('');
        setDraft({ kind, id: item.id, moduleId, lesson: kind === 'lesson' && item.id ? item : null, title: item.title || '', description: item.description || '', status: item.status || 'DRAFT', position: item.position ?? 0,
            code: item.code || '', level: item.level || '', durationHours: item.durationHours ?? '', objectives: item.objectives || '', outcomes: item.outcomes || '', syllabusFile: item.syllabusFile || null, shared: item.shared === 1 });
    }
    // The original syllabus / notes PDF is uploaded like a lesson file and linked on save.
    async function uploadSyllabus(event) {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        setError(''); setUploadPct(0);
        try { change('syllabusFile', await uploadFile(file, 'DOCUMENT', setUploadPct)); }
        catch (uploadError) { setError(uploadError.message); }
        finally { setUploadPct(null); }
    }
    function save(event) {
        event.preventDefault();
        const base = `/courses/${course.id}`;
        const data = draft.kind === 'course'
            ? { title: draft.title, description: draft.description, status: draft.status, code: draft.code, level: draft.level || null, durationHours: draft.durationHours === '' ? null : Number(draft.durationHours), objectives: draft.objectives, outcomes: draft.outcomes, syllabusFileId: draft.syllabusFile?.id ?? null, ...(canShare ? { shared: draft.shared } : {}) }
            : { title: draft.title, position: Number(draft.position), description: draft.description };
        const path = draft.kind === 'course' ? base : `${base}/modules${draft.id ? `/${draft.id}` : ''}`;
        run(async () => { await request(path, draft.id || draft.kind === 'course' ? 'PATCH' : 'POST', data); await onSaved(); setDraft(null); }, 'Saved successfully.');
    }
    function remove(kind, path, title) {
        const warning = kind === 'module' ? 'Its lessons will be hidden from students.' : 'Students will no longer see it.';
        if (window.confirm(`Delete ${kind} "${title}"? ${warning}`))
            run(async () => { await request(`/courses/${course.id}${path}`, 'DELETE'); await onSaved(); }, `${kind === 'module' ? 'Module' : 'Lesson'} deleted.`);
    }
    async function lessonDone(saved) {
        if (saved) { await onSaved(); setNotice('Lesson saved.'); }
        setDraft(null);
    }
    // Re-converts the linked PDF with the current converter and replaces all units and lessons.
    function rebuild() {
        if (!window.confirm(`Rebuild all lessons of "${course.title}" from ${course.syllabusFile.originalName}?\n\nCurrent units and lessons (including manual edits and student progress on them) are replaced. This can take a minute.`))
            return;
        run(async () => { const result = await request(`/courses/${course.id}/rebuild-from-pdf`, 'POST'); await onSaved(); setNotice(`Rebuilt: ${result.units} unit${result.units !== 1 ? 's' : ''}, ${result.lessons} lessons, ${result.images} figures.`); }, '');
    }
    const change = (field, value) => setDraft(current => ({ ...current, [field]: value }));
    const nextPosition = (items) => Math.max(-1, ...items.map(item => item.position)) + 1;
    return <>
        <span className="eyebrow">COURSE MANAGEMENT</span><h2>{course.title} <span className="tag">{statuses[course.status]}</span></h2>
        {error && <div role="alert" className="alert">{error}</div>}{notice && <div role="status" className="success">{notice}</div>}
        {draft?.kind === 'lesson' ? <LessonForm course={course} moduleId={draft.moduleId} lesson={draft.lesson} onDone={lessonDone}/>
        : draft ? <form onSubmit={save}>
            <h3>{draft.id ? 'Edit' : 'Add'} {draft.kind}</h3>
            <label>Title<input required minLength={draft.kind === 'course' ? 3 : 2} maxLength={150} value={draft.title} onChange={event => change('title', event.target.value)}/></label>
            {draft.kind === 'course' && <>
                <label>Description<textarea required minLength={5} maxLength={2000} rows={3} value={draft.description} onChange={event => change('description', event.target.value)}/></label>
                <div className="field-row">
                    <label>Course code<input maxLength={20} placeholder="e.g. PY101" value={draft.code} onChange={event => change('code', event.target.value)}/></label>
                    <label>Level<select value={draft.level} onChange={event => change('level', event.target.value)}><option value="">Not set</option>{Object.entries(levels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                </div>
                <div className="field-row">
                    <label>Duration (hours)<input type="number" min={1} max={2000} value={draft.durationHours} onChange={event => change('durationHours', event.target.value)}/></label>
                    <label>Status<select value={draft.status} onChange={event => change('status', event.target.value)}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                </div>
                <label>Learning objectives (one per line)<textarea maxLength={5000} rows={4} value={draft.objectives} onChange={event => change('objectives', event.target.value)}/></label>
                <label>Learning outcomes (one per line)<textarea maxLength={5000} rows={3} value={draft.outcomes} onChange={event => change('outcomes', event.target.value)}/></label>
                <div className="upload-box">
                    {draft.syllabusFile ? <span>Syllabus PDF: <strong>{draft.syllabusFile.originalName}</strong></span> : <span className="muted">Syllabus / course notes PDF (optional)</span>}
                    {uploadPct !== null ? <span className="upload-progress"><progress max={100} value={uploadPct}/> {uploadPct}%</span> : <span className="row-actions">
                        <label className="text-button file-button"><Upload size={15}/>{draft.syllabusFile ? 'Replace PDF' : 'Upload PDF'}<input type="file" accept="application/pdf" onChange={uploadSyllabus} hidden/></label>
                        {draft.syllabusFile && <button type="button" className="text-button danger" onClick={() => change('syllabusFile', null)}>Remove</button>}
                    </span>}
                </div>
                {canShare && <label className="check"><input type="checkbox" checked={draft.shared} onChange={event => change('shared', event.target.checked)}/>Shared with all colleges (read-only for other colleges once published)</label>}
                <p className="muted">Students see published courses only. Archived courses are hidden from students but kept.</p>
            </>}
            {draft.kind === 'module' && <>
                <label>Unit description (optional)<textarea maxLength={2000} rows={2} value={draft.description} onChange={event => change('description', event.target.value)}/></label>
                <label>Order (0 is first)<input required type="number" min={0} max={10000} value={draft.position} onChange={event => change('position', event.target.value)}/></label>
            </>}
            <div className="manager-actions"><button className="primary" disabled={busy || uploadPct !== null}><Save size={16}/>{busy ? 'Saving…' : 'Save'}</button><button className="text-button" type="button" disabled={busy} onClick={() => setDraft(null)}>Cancel</button></div>
        </form> : <>
            <div className="manager-actions"><button aria-label="Edit course" title="Edit course" className="primary" onClick={() => edit('course', course)}><Pencil size={16} aria-hidden="true"/></button><button className="primary" onClick={() => edit('module', { position: nextPosition(course.modules) })}><Plus size={16}/>Add module</button>
                {course.syllabusFile && <button className="text-button" disabled={busy} onClick={rebuild}><RefreshCw size={15}/>{busy ? 'Working…' : 'Rebuild lessons from the course PDF'}</button>}</div>
            {course.modules.map(module => <section className="manager-module" key={module.id}>
                <div className="section-title"><h3>{module.title}</h3><span className="row-actions"><button aria-label="Edit module" title="Edit module" className="text-button" onClick={() => edit('module', module)}><Pencil size={15} aria-hidden="true"/></button><button className="text-button danger" disabled={busy} onClick={() => remove('module', `/modules/${module.id}`, module.title)}><Trash2 size={15}/>Delete module</button></span></div>
                {module.lessons.map(lesson => <div className="lesson-row" key={lesson.id}>
                    <span>{lesson.title} <span className="tag">{typeLabels[lesson.lessonType]}</span>{lesson.published !== 1 && <span className="tag pending">Hidden</span>}</span>
                    <span className="row-actions"><button aria-label="Edit lesson" title="Edit lesson" className="text-button" onClick={() => edit('lesson', lesson, module.id)}><Pencil size={15} aria-hidden="true"/></button><button className="text-button danger" disabled={busy} onClick={() => remove('lesson', `/modules/${module.id}/lessons/${lesson.id}`, lesson.title)}><Trash2 size={15}/>Delete</button></span>
                </div>)}
                <button className="text-button" onClick={() => edit('lesson', { position: nextPosition(module.lessons) }, module.id)}><Plus size={15}/>Add lesson</button>
            </section>)}
            <Instructors course={course} onSaved={onSaved} run={run} busy={busy}/>
        </>}
    </>;
}
