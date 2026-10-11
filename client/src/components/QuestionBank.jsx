import { PaginatedTable } from './Pagination';
import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useWorkspace } from '../workspace';

export const QUESTION_TYPES = { SINGLE_CHOICE: 'Single choice', MULTIPLE_CHOICE: 'Multiple choice', TRUE_FALSE: 'True / False', NUMERIC: 'Numeric', SHORT_ANSWER: 'Short answer', CODING: 'Coding' };
const blank = { questionType: 'SINGLE_CHOICE', stem: '', explanation: '', difficulty: 'MEDIUM', marks: 1, negativeMarks: 0, topic: '', courseId: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }], correct: true, value: '', tolerance: 0, accepted: '', caseSensitive: false, codingProblemId: '' };

// Server question -> form state.
function toForm(q) {
    return {
        ...blank, questionType: q.questionType, stem: q.stem, explanation: q.explanation, difficulty: q.difficulty, marks: q.marks, negativeMarks: q.negativeMarks, topic: q.topic, courseId: q.courseId ?? '',
        options: q.options.length && q.questionType !== 'TRUE_FALSE' ? q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect === 1 })) : blank.options,
        correct: q.questionType === 'TRUE_FALSE' ? q.options.find(o => o.text === 'True')?.isCorrect === 1 : true,
        value: q.answerKey?.value ?? '', tolerance: q.answerKey?.tolerance ?? 0,
        accepted: (q.answerKey?.accepted ?? []).join('\n'), caseSensitive: q.answerKey?.caseSensitive ?? false, codingProblemId: q.codingProblemId ?? '',
    };
}
// Form state -> API body.
function toBody(f) {
    const body = { questionType: f.questionType, stem: f.stem, explanation: f.explanation, difficulty: f.difficulty, marks: Number(f.marks), negativeMarks: Number(f.negativeMarks), topic: f.topic, courseId: f.courseId || null };
    if (f.questionType === 'SINGLE_CHOICE' || f.questionType === 'MULTIPLE_CHOICE') body.options = f.options.filter(o => o.text.trim());
    if (f.questionType === 'TRUE_FALSE') body.correct = f.correct;
    if (f.questionType === 'NUMERIC') body.answerKey = { value: Number(f.value), tolerance: Number(f.tolerance) || 0 };
    if (f.questionType === 'CODING') body.codingProblemId = f.codingProblemId || null;
    if (f.questionType === 'SHORT_ANSWER') body.answerKey = { accepted: f.accepted.split('\n').map(a => a.trim()).filter(Boolean), caseSensitive: f.caseSensitive };
    return body;
}

function QuestionForm({ question, courses, codingProblems, onSaved, onCancel }) {
    const { api } = useWorkspace();
    const [form, setForm] = useState(question ? toForm(question) : blank);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const set = (field, value) => setForm(current => ({ ...current, [field]: value }));
    const field = name => ({ value: form[name], onChange: event => set(name, event.target.value) });
    const choice = form.questionType === 'SINGLE_CHOICE' || form.questionType === 'MULTIPLE_CHOICE';
    function setOption(index, change) {
        set('options', form.options.map((o, i) => {
            if (i === index) return { ...o, ...change };
            // Single choice: marking one correct unmarks the others.
            return change.isCorrect && form.questionType === 'SINGLE_CHOICE' ? { ...o, isCorrect: false } : o;
        }));
    }
    async function save(event) {
        event.preventDefault();
        setSaving(true); setError('');
        try {
            await api(question ? `/assessments/questions/${question.id}` : '/assessments/questions', question ? 'PATCH' : 'POST', toBody(form));
            onSaved();
        }
        catch (saveError) { setError(saveError.message); }
        finally { setSaving(false); }
    }
    return <form className="academic-form question-form" onSubmit={save}>
        <div className="section-title"><h2>{question ? 'Edit question' : 'New question'}</h2><button type="button" className="icon-button" aria-label="Close" onClick={onCancel}><X size={16}/></button></div>
        {error && <div role="alert" className="alert">{error}</div>}
        <div className="academic-fields">
            <label>Type<select {...field('questionType')}>{Object.entries(QUESTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Difficulty<select {...field('difficulty')}><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></label>
            <label>Marks<input type="number" min="0.25" step="0.25" required {...field('marks')}/></label>
            <label>Negative marks (wrong answer)<input type="number" min="0" step="0.25" {...field('negativeMarks')}/></label>
            <label>Topic<input {...field('topic')} placeholder="e.g. Loops"/></label>
            <label>Course (optional)<select {...field('courseId')}><option value="">No course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code ? `${c.code} - ` : ''}{c.title}</option>)}</select></label>
        </div>
        <label>Question<textarea rows={3} required minLength={3} {...field('stem')}/></label>
        {choice && <div className="option-editor">
            <small className="eyebrow">OPTIONS - MARK {form.questionType === 'SINGLE_CHOICE' ? 'THE' : 'EVERY'} CORRECT ANSWER</small>
            {form.options.map((o, i) => <div key={i} className="option-row">
                <input type={form.questionType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'} name="correct-option" checked={o.isCorrect} onChange={event => setOption(i, { isCorrect: event.target.checked })} aria-label={`Option ${i + 1} is correct`}/>
                <input value={o.text} onChange={event => setOption(i, { text: event.target.value })} placeholder={`Option ${i + 1}`}/>
                <button type="button" className="icon-button" aria-label="Remove option" disabled={form.options.length <= 2} onClick={() => set('options', form.options.filter((_, j) => j !== i))}><Trash2 size={14}/></button>
            </div>)}
            {form.options.length < 10 && <button type="button" className="text-button" onClick={() => set('options', [...form.options, { text: '', isCorrect: false }])}><Plus size={14}/>Add option</button>}
        </div>}
        {form.questionType === 'TRUE_FALSE' && <div className="check-row">
            <label className="check"><input type="radio" name="tf" checked={form.correct} onChange={() => set('correct', true)}/>True</label>
            <label className="check"><input type="radio" name="tf" checked={!form.correct} onChange={() => set('correct', false)}/>False</label>
        </div>}
        {form.questionType === 'NUMERIC' && <div className="field-row">
            <label>Correct answer<input type="number" step="any" required {...field('value')}/></label>
            <label>Allowed difference (±)<input type="number" step="any" min="0" {...field('tolerance')}/></label>
        </div>}
        {form.questionType === 'CODING' && <label>Coding problem (students solve it in the exam; marks scale with the test cases passed)<select required {...field('codingProblemId')}><option value="">Choose a problem</option>{codingProblems.map(p => <option key={p.id} value={p.id}>{p.collegeId ? 'Your college' : 'Library'} - {p.title} ({p.difficulty.toLowerCase()})</option>)}</select></label>}
        {form.questionType === 'SHORT_ANSWER' && <>
            <label>Accepted answers (one per line; leave empty to grade by hand)<textarea rows={3} {...field('accepted')}/></label>
            <label className="check"><input type="checkbox" checked={form.caseSensitive} onChange={event => set('caseSensitive', event.target.checked)}/>Case sensitive</label>
        </>}
        <label>Explanation (shown with the results)<textarea rows={2} {...field('explanation')}/></label>
        <div className="manager-actions"><button className="primary" disabled={saving}>{saving ? 'Saving...' : 'Save question'}</button><button type="button" className="secondary" onClick={onCancel}>Cancel</button></div>
    </form>;
}

export function QuestionBank({ courses, codingProblems = [] }) {
    const { api } = useWorkspace();
    const [questions, setQuestions] = useState(null);
    const [filter, setFilter] = useState({ type: '', search: '' });
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');
    async function load() {
        try {
            const query = new URLSearchParams(Object.entries(filter).filter(([, v]) => v));
            setQuestions(await api(`/assessments/questions?${query}`));
        }
        catch (loadError) { setError(loadError.message); }
    }
    useEffect(() => { load(); }, [filter.type]);
    async function remove(q) {
        if (!window.confirm('Delete this question? Assessments that already use it keep it.')) return;
        try { await api(`/assessments/questions/${q.id}`, 'DELETE'); load(); }
        catch (removeError) { setError(removeError.message); }
    }
    return <section className="panel">
        <div className="section-title"><div><h2>Question bank</h2><p className="muted">Reusable questions for quizzes, assignments and exams.</p></div>{!editing && <button className="primary" onClick={() => setEditing('new')}><Plus size={16}/>New question</button>}</div>
        {editing && <QuestionForm key={editing === 'new' ? 'new' : editing.id} question={editing === 'new' ? null : editing} courses={courses} codingProblems={codingProblems} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }}/>}
        {error && <div role="alert" className="alert">{error}</div>}
        <form className="audit-filters" onSubmit={event => { event.preventDefault(); load(); }}>
            <label>Search<input value={filter.search} onChange={event => setFilter({ ...filter, search: event.target.value })} placeholder="Question text"/></label>
            <label>Type<select value={filter.type} onChange={event => setFilter({ ...filter, type: event.target.value })}><option value="">All types</option>{Object.entries(QUESTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <button className="secondary">Search</button>
        </form>
        {!questions ? <div className="loading">Loading...</div> : !questions.length ? <div className="empty"><h3>No questions yet</h3><p>Create your first question.</p></div> : <div className="table-wrap"><PaginatedTable>
            <thead><tr><th>Question</th><th>Type</th><th>Marks</th><th>Difficulty</th><th>Used in</th><th></th></tr></thead>
            <tbody>{questions.map(q => <tr key={q.id}>
                <td className="question-cell">{q.stem}{q.topic && <small className="muted"> · {q.topic}</small>}</td>
                <td><span className="tag">{QUESTION_TYPES[q.questionType]}</span></td>
                <td>{q.marks}{q.negativeMarks ? ` / -${q.negativeMarks}` : ''}</td>
                <td>{q.difficulty.toLowerCase()}</td>
                <td>{q._count.assessments}</td>
                <td><span className="row-actions"><button aria-label="Edit" title="Edit" className="text-button" onClick={() => setEditing(q)}><Pencil size={14} aria-hidden="true"/></button><button className="text-button danger" onClick={() => remove(q)}><Trash2 size={14}/>Delete</button></span></td>
            </tr>)}</tbody>
        </PaginatedTable></div>}
    </section>;
}
