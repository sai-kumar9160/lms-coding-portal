import { PaginatedTable } from './Pagination';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { QUESTION_TYPES } from './QuestionBank';

export const ASSESSMENT_TYPES = { QUIZ: 'Quiz', ASSIGNMENT: 'Assignment', EXAM: 'Exam' };
const VISIBILITY = { IMMEDIATE: 'Right after submitting', AFTER_CLOSE: 'After the window closes', MANUAL: 'When I publish them' };
const when = value => value ? new Date(value).toLocaleString() : '-';
// ISO time <-> <input type="datetime-local"> value (local time).
const toLocalInput = value => { const d = new Date(value); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export const emptyAssessment = { title: '', assessmentType: 'QUIZ', instructions: '', courseId: '', durationMin: 30, passPct: 40, maxAttempts: 1, attemptStrategy: 'BEST', shuffleQuestions: false, shuffleOptions: false, resultVisibility: 'IMMEDIATE' };
const toBody = f => ({ ...f, courseId: f.courseId || null, durationMin: f.durationMin === '' || f.durationMin === null ? null : Number(f.durationMin), passPct: Number(f.passPct), maxAttempts: Number(f.maxAttempts), shuffleQuestions: Boolean(f.shuffleQuestions), shuffleOptions: Boolean(f.shuffleOptions) });

export function AssessmentForm({ initial, courses, submitLabel, onSubmit }) {
    const [form, setForm] = useState(initial);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const field = name => ({ value: form[name] ?? '', onChange: event => setForm({ ...form, [name]: event.target.value }) });
    const check = name => ({ checked: Boolean(form[name]), onChange: event => setForm({ ...form, [name]: event.target.checked }) });
    async function save(event) {
        event.preventDefault();
        setSaving(true); setError('');
        try { await onSubmit(toBody(form)); }
        catch (saveError) { setError(saveError.message); }
        finally { setSaving(false); }
    }
    return <form className="academic-form" onSubmit={save}>
        {error && <div role="alert" className="alert">{error}</div>}
        <div className="academic-fields">
            <label>Title<input required minLength={3} {...field('title')}/></label>
            <label>Type<select {...field('assessmentType')}>{Object.entries(ASSESSMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Course (optional)<select {...field('courseId')}><option value="">No course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
            <label>Time limit (minutes, empty = none)<input type="number" min="1" max="600" {...field('durationMin')}/></label>
            <label>Pass mark (%)<input type="number" min="0" max="100" required {...field('passPct')}/></label>
            <label>Attempts allowed<input type="number" min="1" max="20" required {...field('maxAttempts')}/></label>
            <label>Score that counts<select {...field('attemptStrategy')}><option value="BEST">Best attempt</option><option value="LATEST">Latest attempt</option></select></label>
            <label>Show results<select {...field('resultVisibility')}>{Object.entries(VISIBILITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        </div>
        <label>Instructions for students<textarea rows={3} {...field('instructions')}/></label>
        <div className="check-row"><label className="check"><input type="checkbox" {...check('shuffleQuestions')}/>Shuffle question order</label><label className="check"><input type="checkbox" {...check('shuffleOptions')}/>Shuffle answer options</label></div>
        <div className="manager-actions"><button className="primary" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button></div>
    </form>;
}

function QuestionsTab({ assessment, codingProblems, onChanged }) {
    const { api } = useWorkspace();
    const [items, setItems] = useState(assessment.questions.map(l => ({ questionId: l.questionId, marksOverride: l.marksOverride ?? '', question: l.question })));
    const [bank, setBank] = useState([]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [problemId, setProblemId] = useState('');
    const [problemSearch, setProblemSearch] = useState('');
    const [problemMarks, setProblemMarks] = useState(10);
    const [addingProblem, setAddingProblem] = useState(false);
    const locked = assessment._count.attempts > 0;
    useEffect(() => { api('/assessments/questions').then(setBank, e => setError(e.message)); }, []);
    const move = (i, step) => { const next = [...items]; [next[i], next[i + step]] = [next[i + step], next[i]]; setItems(next); };
    const chosen = new Set(items.map(i => i.questionId));
    const selectedProblemIds = new Set(items.filter(item => item.question.questionType === 'CODING').map(item => item.question.codingProblemId));
    const availableProblems = (codingProblems ?? []).filter(problem => !selectedProblemIds.has(problem.id) && `${problem.title} ${problem.difficulty}`.toLowerCase().includes(problemSearch.trim().toLowerCase()));
    async function addProblem(event) {
        event.preventDefault(); setError('');
        const problem = (codingProblems ?? []).find(problem => problem.id === problemId);
        if (!problem || selectedProblemIds.has(problem.id)) return;
        setAddingProblem(true);
        try {
            let question = bank.find(question => question.questionType === 'CODING' && question.codingProblemId === problem.id);
            if (!question) {
                question = await api('/assessments/questions', 'POST', { questionType: 'CODING', codingProblemId: problem.id, stem: problem.title, difficulty: problem.difficulty, marks: Number(problemMarks), negativeMarks: 0, courseId: assessment.courseId ?? null });
                setBank(current => [...current, question]);
            }
            setItems(current => [...current, { questionId: question.id, marksOverride: Number(problemMarks), question }]);
            setProblemId('');
        } catch (error) { setError(error.message); }
        finally { setAddingProblem(false); }
    }
    async function save() {
        setSaving(true); setError('');
        try { await api(`/assessments/${assessment.id}/questions`, 'PUT', { items: items.map(i => ({ questionId: i.questionId, marksOverride: i.marksOverride === '' ? null : Number(i.marksOverride) })) }); onChanged(); }
        catch (saveError) { setError(saveError.message); }
        finally { setSaving(false); }
    }
    const total = items.reduce((n, i) => n + (i.marksOverride === '' ? i.question.marks : Number(i.marksOverride)), 0);
    return <>
        {locked && <div className="alert">Students have attempted this assessment, so its questions are locked.</div>}
        {error && <div role="alert" className="alert">{error}</div>}
        <div className="section-title"><h3>In this assessment ({items.length} questions, {total} marks)</h3>{!locked && <button className="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save questions'}</button>}</div>
        {!items.length ? <p className="muted">Add questions from the bank below.</p> : <div className="table-wrap"><PaginatedTable>
            <thead><tr><th>#</th><th>Question</th><th>Type</th><th>Marks</th><th></th></tr></thead>
            <tbody>{items.map((item, i) => <tr key={item.questionId}>
                <td>{i + 1}</td><td className="question-cell">{item.question.stem}</td><td>{QUESTION_TYPES[item.question.questionType]}</td>
                <td><input className="marks-input" type="number" min="0.25" step="0.25" placeholder={String(item.question.marks)} value={item.marksOverride} disabled={locked} onChange={event => setItems(items.map((x, j) => j === i ? { ...x, marksOverride: event.target.value } : x))} aria-label="Marks in this assessment"/></td>
                <td>{!locked && <span className="row-actions">
                    <button className="icon-button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14}/></button>
                    <button className="icon-button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14}/></button>
                    <button className="icon-button" aria-label="Remove" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 size={14}/></button>
                </span>}</td>
            </tr>)}</tbody>
        </PaginatedTable></div>}
        {!locked && <>
            <form className="academic-form" onSubmit={addProblem}>
                <h3>Select an existing coding problem</h3>
                <p className="muted">Choose a published problem available for assessments. Add it here, then click Save questions to attach your selection to this assessment.</p>
                <div className="academic-fields">
                    <label>Search coding problems<input value={problemSearch} onChange={event => { setProblemSearch(event.target.value); setProblemId(''); }} placeholder="Search by title or difficulty"/></label>
                    <label>Coding problem<select required value={problemId} onChange={event => setProblemId(event.target.value)}><option value="">Choose an existing problem</option>{availableProblems.map(problem => <option key={problem.id} value={problem.id}>{problem.title} ({problem.difficulty.toLowerCase()})</option>)}</select></label>
                    <label>Marks<input type="number" required min="0.25" max="100" step="0.25" value={problemMarks} onChange={event => setProblemMarks(event.target.value)}/></label>
                </div>
                {!availableProblems.length && <p className="muted">No matching problems available. Problems must be published and allow assessment use.</p>}
                <button className="primary" disabled={addingProblem || !problemId}>{addingProblem ? 'Adding...' : 'Add coding question'}</button>
            </form>
            <h3 className="subheading">Question bank</h3>
            {!bank.filter(q => !chosen.has(q.id)).length ? <p className="muted">{bank.length ? 'Every bank question is already added.' : 'No questions in the bank yet.'} Select a coding problem above or create other question types in the Question bank tab.</p> : <div className="table-wrap"><PaginatedTable>
                <tbody>{bank.filter(q => !chosen.has(q.id)).map(q => <tr key={q.id}>
                    <td className="question-cell">{q.stem}</td><td>{QUESTION_TYPES[q.questionType]}</td><td>{q.marks} marks</td>
                    <td><button className="text-button" onClick={() => setItems([...items, { questionId: q.id, marksOverride: '', question: q }])}><Plus size={14}/>Add</button></td>
                </tr>)}</tbody>
            </PaginatedTable></div>}
        </>}
    </>;
}

function WindowsTab({ assessment, cohorts, onChanged }) {
    const { api } = useWorkspace();
    const start = new Date(); start.setMinutes(0, 0, 0); start.setHours(start.getHours() + 1);
    const [form, setForm] = useState({ cohortId: '', opensAt: toLocalInput(start), closesAt: toLocalInput(start.getTime() + 7 * 86400000), extraTimeMin: 0 });
    const [audience, setAudience] = useState('group');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    async function add(event) {
        event.preventDefault(); setError('');
        if (audience === 'group' && !form.cohortId) return setError('Choose a branch group.');
        if (new Date(form.closesAt) <= new Date(form.opensAt)) return setError('Closing time must be after opening time.');
        setSaving(true);
        try {
            await api(`/assessments/${assessment.id}/windows`, 'POST', { cohortId: audience === 'group' ? Number(form.cohortId) : null, opensAt: new Date(form.opensAt).toISOString(), closesAt: new Date(form.closesAt).toISOString(), extraTimeMin: Number(form.extraTimeMin) || 0 });
            onChanged();
        }
        catch (saveError) { setError(saveError.message); }
        finally { setSaving(false); }
    }
    async function remove(w) {
        if (!window.confirm('Remove this window?')) return;
        try { await api(`/assessments/${assessment.id}/windows/${w.id}`, 'DELETE'); onChanged(); }
        catch (removeError) { setError(removeError.message); }
    }
    return <>
        <p className="muted">A window says who may attempt and when. Students outside every window cannot start.</p>
        {assessment.windows.some(w => !w.cohortId) && <div role="status" className="alert">This assessment has an all-students window. Remove that window if you want access limited to selected branch groups.</div>}
        {error && <div role="alert" className="alert">{error}</div>}
        {assessment.windows.length > 0 && <div className="table-wrap"><PaginatedTable>
            <thead><tr><th>Who</th><th>Opens</th><th>Closes</th><th>Extra time</th><th></th></tr></thead>
            <tbody>{assessment.windows.map(w => <tr key={w.id}>
                <td>{w.cohort?.name ?? 'All students of the college'}</td><td>{when(w.opensAt)}</td><td>{when(w.closesAt)}</td><td>{w.extraTimeMin} min</td>
                <td><button className="text-button danger" onClick={() => remove(w)}><Trash2 size={14}/>Remove</button></td>
            </tr>)}</tbody>
        </PaginatedTable></div>}
        <form className="academic-form" onSubmit={add}>
            <div className="academic-fields">
                <label>Audience<select value={audience} onChange={event => setAudience(event.target.value)}><option value="group">Specific branch group</option><option value="all">All students of the college</option></select></label>
                {audience === 'group' && <label>Who — branch group<select required value={form.cohortId} onChange={event => setForm({ ...form, cohortId: event.target.value })}><option value="">Choose a branch group</option>{cohorts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.members} students)</option>)}</select></label>}
                <label>Opens<input type="datetime-local" required value={form.opensAt} onChange={event => setForm({ ...form, opensAt: event.target.value })}/></label>
                <label>Closes<input type="datetime-local" required value={form.closesAt} onChange={event => setForm({ ...form, closesAt: event.target.value })}/></label>
                <label>Extra time (minutes)<input type="number" min="0" max="600" value={form.extraTimeMin} onChange={event => setForm({ ...form, extraTimeMin: event.target.value })}/></label>
            </div>
            {audience === 'group' && !cohorts.length && <p className="muted">Create a branch group and add its students in Academics → Branch groups, then reopen this assessment.</p>}
            {audience === 'group' && form.cohortId && <p className="muted">Only members of {cohorts.find(c => String(c.id) === String(form.cohortId))?.name} qualify through this window. Other saved windows can grant additional access.</p>}
            <div className="manager-actions"><button className="primary" disabled={saving || (audience === 'group' && !form.cohortId)}><Plus size={15}/>{saving ? 'Saving...' : 'Save window'}</button></div>
        </form>
    </>;
}

function answerText(q, answer) {
    if (!answer) return <em className="muted">Not answered</em>;
    if (answer.code !== undefined) return <><span className="tag">{answer.language}</span><pre className="review-code">{answer.code}</pre></>;
    if (answer.optionId) return q.options.find(o => o.id === answer.optionId)?.text ?? '?';
    if (answer.optionIds) return answer.optionIds.map(id => q.options.find(o => o.id === id)?.text ?? '?').join(', ');
    if (answer.value !== undefined) return String(answer.value);
    return answer.text;
}
function correctText(q) {
    if (q.questionType === 'CODING') return `Judged by the test cases of "${q.codingProblem?.title ?? 'the problem'}" (best submission counts)`;
    if (q.options.length) return q.options.filter(o => o.isCorrect === 1).map(o => o.text).join(', ');
    if (q.questionType === 'NUMERIC') return `${q.answerKey.value}${q.answerKey.tolerance ? ` ± ${q.answerKey.tolerance}` : ''}`;
    return q.answerKey?.accepted?.length ? q.answerKey.accepted.join(' / ') : 'Graded by the teacher';
}

function AttemptReview({ attemptId, onBack }) {
    const { api } = useWorkspace();
    const [review, setReview] = useState(null);
    const [marks, setMarks] = useState({});
    const [error, setError] = useState('');
    async function load() {
        try {
            const data = await api(`/attempts/${attemptId}/review`);
            setReview(data);
            setMarks(Object.fromEntries(data.questions.map(q => [q.id, { marks: q.response?.marksAwarded ?? '', feedback: q.response?.feedback ?? '' }])));
        }
        catch (loadError) { setError(loadError.message); }
    }
    useEffect(() => { load(); }, [attemptId]);
    async function grade(q) {
        setError('');
        try { await api(`/attempts/${attemptId}/answers/${q.id}/grade`, 'PUT', { marks: Number(marks[q.id].marks), feedback: marks[q.id].feedback }); load(); }
        catch (gradeError) { setError(gradeError.message); }
    }
    if (!review) return error ? <div role="alert" className="alert">{error}</div> : <div className="loading">Loading...</div>;
    return <div>
        <button className="text-button" onClick={onBack}><ArrowLeft size={14}/>All attempts</button>
        <div className="section-title"><div><h3>{review.student?.name} - attempt {review.attemptNo}</h3><p className="muted">{review.student?.email} · {review.status.replace('_', ' ').toLowerCase()} {when(review.submittedAt)}</p></div>
            <strong className="review-score">{review.score ?? '-'} / {review.maxScore}{review.needsGrading ? ' (grading pending)' : review.isPassed ? ' · Passed' : review.isPassed === 0 ? ' · Not passed' : ''}</strong></div>
        {error && <div role="alert" className="alert">{error}</div>}
        {review.questions.map((q, i) => <div key={q.id} className={`review-question${q.response?.marksAwarded === null || q.response?.marksAwarded === undefined ? ' pending' : ''}`}>
            <p><strong>{i + 1}. {q.stem}</strong> <span className="muted">({q.points} marks)</span></p>
            <p>Answer: {answerText(q, q.response?.answer)}</p>
            <p className="muted">Correct: {correctText(q)}</p>
            <div className="grade-row">
                <label>Marks<input type="number" step="0.25" min={-q.negativeMarks} max={q.points} value={marks[q.id]?.marks ?? ''} onChange={event => setMarks({ ...marks, [q.id]: { ...marks[q.id], marks: event.target.value } })}/></label>
                <label>Feedback<input value={marks[q.id]?.feedback ?? ''} onChange={event => setMarks({ ...marks, [q.id]: { ...marks[q.id], feedback: event.target.value } })}/></label>
                <button className="secondary small" disabled={review.status === 'IN_PROGRESS' || marks[q.id]?.marks === ''} onClick={() => grade(q)}>Save mark</button>
            </div>
        </div>)}
    </div>;
}

function ResultsTab({ assessment, onChanged }) {
    const { api } = useWorkspace();
    const [attempts, setAttempts] = useState(null);
    const [open, setOpen] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => { if (!open) api(`/assessments/${assessment.id}/attempts`).then(setAttempts, e => setError(e.message)); }, [open]);
    async function publish(published) {
        try { await api(`/assessments/${assessment.id}/results`, 'POST', { published }); onChanged(); }
        catch (publishError) { setError(publishError.message); }
    }
    if (open) return <AttemptReview attemptId={open} onBack={() => setOpen(null)}/>;
    return <>
        {assessment.resultVisibility === 'MANUAL' && <div className="manager-actions">
            {assessment.resultsPublished ? <><span className="tag">Results published</span><button className="secondary small" onClick={() => publish(false)}>Hide results</button></> : <button className="primary" onClick={() => publish(true)}>Publish results to students</button>}
        </div>}
        {error && <div role="alert" className="alert">{error}</div>}
        {!attempts ? <div className="loading">Loading...</div> : !attempts.length ? <div className="empty"><h3>No attempts yet</h3></div> : <div className="table-wrap"><PaginatedTable>
            <thead><tr><th>Student</th><th>Attempt</th><th>Status</th><th>Submitted</th><th>Score</th><th>Result</th><th></th></tr></thead>
            <tbody>{attempts.map(a => <tr key={a.id}>
                <td><strong>{a.student?.name}</strong><br/><small className="muted">{a.student?.studentProfile?.rollNumber ?? a.student?.email}</small></td>
                <td>{a.attemptNo}</td><td>{a.status.replace('_', ' ').toLowerCase()}</td><td>{when(a.submittedAt)}</td>
                <td>{a.score ?? '-'} / {a.maxScore}</td>
                <td>{a.needsGrading ? <span className="tag pending">Needs grading</span> : a.isPassed === 1 ? <span className="solved">Passed</span> : a.isPassed === 0 ? <span className="text-danger">Not passed</span> : '-'}</td>
                <td>{a.status !== 'IN_PROGRESS' && <button className="text-button" onClick={() => setOpen(a.id)}>{a.needsGrading ? 'Grade' : 'Review'}</button>}</td>
            </tr>)}</tbody>
        </PaginatedTable></div>}
    </>;
}

export function AssessmentEditor({ id, options, onBack }) {
    const { api } = useWorkspace();
    const [assessment, setAssessment] = useState(null);
    const [tab, setTab] = useState('questions');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    async function load() {
        try { setAssessment(await api(`/assessments/${id}`)); }
        catch (loadError) { setError(loadError.message); }
    }
    useEffect(() => { load(); }, [id]);
    async function setStatus(status) {
        setError(''); setNotice('');
        try { await api(`/assessments/${id}/status`, 'POST', { status }); setNotice(`Status changed to ${status.toLowerCase()}.`); load(); }
        catch (statusError) { setError(statusError.message); }
    }
    async function remove() {
        if (!window.confirm('Delete this assessment?')) return;
        try { await api(`/assessments/${id}`, 'DELETE'); onBack(); }
        catch (removeError) { setError(removeError.message); }
    }
    if (!assessment) return error ? <div role="alert" className="alert">{error}</div> : <div className="loading">Loading...</div>;
    const settings = { ...emptyAssessment, ...Object.fromEntries(Object.keys(emptyAssessment).map(k => [k, assessment[k] ?? emptyAssessment[k]])), courseId: assessment.courseId ?? '', durationMin: assessment.durationMin ?? '', shuffleQuestions: assessment.shuffleQuestions === 1, shuffleOptions: assessment.shuffleOptions === 1 };
    return <section className="panel">
        <button className="text-button" onClick={onBack}><ArrowLeft size={14}/>All assessments</button>
        <div className="section-title assessment-head">
            <div><h2>{assessment.title}</h2><p className="muted">{ASSESSMENT_TYPES[assessment.assessmentType]} · {assessment.questions.length} questions · {assessment.totalMarks} marks · {assessment.durationMin ? `${assessment.durationMin} min` : 'no time limit'} · {assessment._count.attempts} attempts</p></div>
            <div className="row-actions">
                <span className={`status-pill ${assessment.status.toLowerCase()}`}>{assessment.status.toLowerCase()}</span>
                {assessment.status !== 'PUBLISHED' && <button className="primary small" onClick={() => setStatus('PUBLISHED')}>{assessment.status === 'CLOSED' ? 'Reopen' : 'Publish'}</button>}
                {assessment.status === 'PUBLISHED' && <button className="secondary small" onClick={() => setStatus('CLOSED')}>Close</button>}
                {assessment.status !== 'DRAFT' && !assessment._count.attempts && <button className="secondary small" onClick={() => setStatus('DRAFT')}>Back to draft</button>}
                {!assessment._count.attempts && <button className="text-button danger" onClick={remove}><Trash2 size={14}/>Delete</button>}
            </div>
        </div>
        {error && <div role="alert" className="alert">{error}</div>}
        {notice && <div className="success">{notice}</div>}
        <div className="challenge-tabs" role="tablist">
            {[['questions', 'Questions'], ['windows', 'Windows'], ['settings', 'Settings'], ['results', 'Results & grading']].map(([key, label]) =>
                <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{label}</button>)}
        </div>
        {tab === 'questions' && <QuestionsTab key={assessment.questions.map(q => q.questionId).join()} assessment={assessment} codingProblems={options.codingProblems} onChanged={() => { setNotice('Questions saved.'); load(); }}/>}
        {tab === 'windows' && <WindowsTab assessment={assessment} cohorts={options.cohorts} onChanged={load}/>}
        {tab === 'settings' && <AssessmentForm initial={settings} courses={options.courses} submitLabel="Save settings" onSubmit={async body => { await api(`/assessments/${id}`, 'PATCH', body); setNotice('Settings saved.'); load(); }}/>}
        {tab === 'results' && <ResultsTab assessment={assessment} onChanged={load}/>}
    </section>;
}
