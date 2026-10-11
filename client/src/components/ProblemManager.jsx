import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { CodeEditor } from './CodeEditor';
import { verdictLabel } from './JudgeResult';

const CHECKERS = { TRIMMED: 'Trimmed (ignore trailing spaces)', EXACT: 'Exact', TOKEN: 'Tokens (any spacing)', CASE_INSENSITIVE: 'Case-insensitive', NUMERIC: 'Numbers within epsilon', UNORDERED: 'Lines in any order' };
const SCORING = { WEIGHTED: 'Weighted (partial marks per case)', GROUP: 'Groups (all cases in a group)', BINARY: 'All or nothing' };
const VISIBILITY = { PRACTICE: 'Practice only', SHARED: 'Practice and assessments', ASSESSMENT: 'Assessments only' };
const blank = { title: '', difficulty: 'EASY', topic: '', statement: '', inputFormat: '', outputFormat: '', constraints: '', timeLimitMs: 2000, memoryLimitMb: 256, visibility: 'PRACTICE', languages: [], checker: 'TRIMMED', epsilon: 0.000001, scoring: 'WEIGHTED', maxScore: 100, referenceLanguage: 'python', referenceSolution: '' };
const blankCase = { input: '', expectedOutput: '', isSample: false, weight: 1, group: '', explanation: '' };
const when = value => value ? new Date(value).toLocaleString() : '-';

function DetailsForm({ problem, languages, onSaved }) {
    const { api } = useWorkspace();
    const [form, setForm] = useState(() => problem ? Object.fromEntries(Object.keys(blank).map(k => [k, problem[k] ?? blank[k]])) : blank);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [previewInput, setPreviewInput] = useState('');
    const [preview, setPreview] = useState(null);
    const [running, setRunning] = useState(false);
    async function runPreview() {
        setRunning(true); setPreview(null); setError('');
        try {
            setPreview(await api('/coding/preview', 'POST', { language: form.referenceLanguage, code: form.referenceSolution, input: previewInput, timeLimitMs: Number(form.timeLimitMs), memoryLimitMb: Number(form.memoryLimitMb) }));
        } catch (runError) { setError(runError.message); }
        finally { setRunning(false); }
    }
    const field = name => ({ value: form[name] ?? '', onChange: event => setForm({ ...form, [name]: event.target.value }) });
    const allowed = form.languages ?? [];
    async function save(event) {
        event.preventDefault();
        setSaving(true); setError('');
        try {
            const body = { ...form, timeLimitMs: Number(form.timeLimitMs), memoryLimitMb: Number(form.memoryLimitMb), maxScore: Number(form.maxScore), epsilon: Number(form.epsilon), languages: allowed.length ? allowed : null };
            onSaved(await api(problem ? `/coding/manage/${problem.id}` : '/coding/manage', problem ? 'PATCH' : 'POST', body));
        }
        catch (saveError) { setError(saveError.message); }
        finally { setSaving(false); }
    }
    return <form className="academic-form" onSubmit={save}>
        {error && <div role="alert" className="alert">{error}</div>}
        <div className="academic-fields">
            <label>Title<input required minLength={3} {...field('title')}/></label>
            <label>Difficulty<select {...field('difficulty')}><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></label>
            <label>Topic<input {...field('topic')} placeholder="e.g. Arrays"/></label>
            <label>Where it appears<select {...field('visibility')}>{Object.entries(VISIBILITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        </div>
        <label>Problem statement (Markdown)<textarea rows={6} required minLength={10} {...field('statement')}/></label>
        <div className="field-row">
            <label>Input format<textarea rows={2} {...field('inputFormat')}/></label>
            <label>Output format<textarea rows={2} {...field('outputFormat')}/></label>
        </div>
        <label>Constraints<textarea rows={2} {...field('constraints')}/></label>
        <div className="academic-fields">
            <label>Time limit per test (ms)<input type="number" min="500" max="10000" step="100" {...field('timeLimitMs')}/></label>
            <label>Memory limit (MB, Judge0)<input type="number" min="64" max="1024" {...field('memoryLimitMb')}/></label>
            <label>Output comparison<select {...field('checker')}>{Object.entries(CHECKERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            {form.checker === 'NUMERIC' && <label>Epsilon<input type="number" step="any" min="0" {...field('epsilon')}/></label>}
            <label>Scoring<select {...field('scoring')}>{Object.entries(SCORING).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Maximum score<input type="number" min="1" max="1000" {...field('maxScore')}/></label>
        </div>
        <fieldset className="language-picks">
            <legend>Allowed languages <small className="muted">(none ticked = all)</small></legend>
            {languages.map(l => <label key={l.id} className="check"><input type="checkbox" checked={allowed.includes(l.id)} onChange={event => setForm({ ...form, languages: event.target.checked ? [...allowed, l.id] : allowed.filter(id => id !== l.id) })}/>{l.label}</label>)}
        </fieldset>
        <div className="reference-head">
            <strong>Reference solution</strong>
            <select aria-label="Reference language" value={form.referenceLanguage ?? 'python'} onChange={event => setForm({ ...form, referenceLanguage: event.target.value })}>{languages.filter(l => l.available).map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
            <small className="muted">Must pass every test case before the problem can be published. Never shown to students.</small>
        </div>
        <div className="reference-editor"><CodeEditor value={form.referenceSolution ?? ''} onChange={value => setForm({ ...form, referenceSolution: value })} language={form.referenceLanguage}/></div>
        <section className="reference-preview">
            <label>Custom input<textarea rows={3} value={previewInput} onChange={event => setPreviewInput(event.target.value)} placeholder="Enter input for your reference solution"/></label>
            <button type="button" className="secondary" disabled={running || saving || !form.referenceSolution?.trim() || !languages.some(language => language.id === form.referenceLanguage && language.available)} onClick={runPreview}>{running ? 'Running...' : 'Run code'}</button>
            <p className="muted">Try your code before saving. This run does not create a problem or validate its test cases.</p>
            {preview && <div role="status" className="reference-preview-result">
                <strong>{preview.compileError ? 'Compilation failed' : preview.results[0]?.status === 'PASSED' ? 'Run completed' : verdictLabel(preview.results[0]?.status)}</strong>
                {preview.compileError ? <pre>{preview.compileError}</pre> : preview.results.map((result, index) => <div key={index}><small className="muted">{result.timeMs} ms</small><h4>Output</h4><pre>{result.stdout || '(No output)'}</pre>{result.stderr && <><h4>Error output</h4><pre>{result.stderr}</pre></>}</div>)}
            </div>}
        </section>
        <div className="manager-actions"><button className="primary" disabled={saving || running}>{saving ? 'Saving...' : problem ? 'Save details' : 'Create problem'}</button>
            {problem && <small className="muted">Changing limits, comparison, scoring, languages or the reference solution sends the problem back to draft.</small>}</div>
    </form>;
}

function TestCasesForm({ problem, onSaved }) {
    const { api } = useWorkspace();
    const [cases, setCases] = useState(() => problem.testCases.length ? problem.testCases.map(c => ({ input: c.input, expectedOutput: c.expectedOutput, isSample: c.isSample === 1, weight: c.weight, group: c.group, explanation: c.explanation })) : [{ ...blankCase, isSample: true }]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const set = (i, change) => setCases(cases.map((c, j) => j === i ? { ...c, ...change } : c));
    // Bulk add: pick several files named 1.in, 1.out, 2.in, 2.out ...
    async function addFiles(event) {
        const files = [...event.target.files];
        const byStem = new Map();
        for (const file of files) {
            const match = file.name.match(/^(.+)\.(in|out)$/i);
            if (!match) continue;
            const entry = byStem.get(match[1]) ?? {};
            entry[match[2].toLowerCase()] = await file.text();
            byStem.set(match[1], entry);
        }
        const added = [...byStem.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).filter(([, e]) => e.in !== undefined && e.out !== undefined).map(([, e]) => ({ ...blankCase, input: e.in, expectedOutput: e.out }));
        if (!added.length) setError('Choose pairs of files named like 1.in and 1.out.');
        else { setError(''); setCases([...cases.filter(c => c.input || c.expectedOutput), ...added]); }
        event.target.value = '';
    }
    async function save() {
        setSaving(true); setError('');
        try { onSaved(await api(`/coding/manage/${problem.id}/test-cases`, 'PUT', { cases: cases.map(c => ({ ...c, weight: Number(c.weight) || 0 })) })); }
        catch (saveError) { setError(saveError.message); }
        finally { setSaving(false); }
    }
    return <div>
        <p className="muted">Samples are shown to students and run with Run Code. Hidden cases carry the marks: cover the smallest and largest inputs, boundaries and a case that defeats a wrong approach. Saving sends the problem back to draft.</p>
        {error && <div role="alert" className="alert">{error}</div>}
        {cases.map((c, i) => <div key={i} className={`case-editor${c.isSample ? ' sample' : ''}`}>
            <div className="case-editor-head">
                <strong>Test case {i}</strong>
                <label className="check"><input type="checkbox" checked={c.isSample} onChange={event => set(i, { isSample: event.target.checked })}/>Sample (visible)</label>
                <label className="inline-field">Weight<input type="number" min="0" step="0.5" value={c.weight} onChange={event => set(i, { weight: event.target.value })}/></label>
                <label className="inline-field">Group<input value={c.group} onChange={event => set(i, { group: event.target.value })} placeholder="optional"/></label>
                <button type="button" className="icon-button" aria-label="Remove test case" disabled={cases.length === 1} onClick={() => setCases(cases.filter((_, j) => j !== i))}><Trash2 size={14}/></button>
            </div>
            <div className="field-row">
                <label>Input<textarea rows={3} className="mono" value={c.input} onChange={event => set(i, { input: event.target.value })}/></label>
                <label>Expected output<textarea rows={3} className="mono" value={c.expectedOutput} onChange={event => set(i, { expectedOutput: event.target.value })}/></label>
            </div>
            {c.isSample && <label>Explanation (shown with the sample)<input value={c.explanation} onChange={event => set(i, { explanation: event.target.value })}/></label>}
        </div>)}
        <div className="manager-actions">
            <button type="button" className="secondary" onClick={() => setCases([...cases, blankCase])}><Plus size={15}/>Add test case</button>
            <label className="secondary file-button"><Upload size={15}/>Add .in/.out files<input type="file" multiple accept=".in,.out,.txt" hidden onChange={addFiles}/></label>
            <button type="button" className="primary" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save test cases'}</button>
        </div>
    </div>;
}

function ProblemEditor({ id, languages, onBack, onChanged }) {
    const { api } = useWorkspace();
    const [problem, setProblem] = useState(null);
    const [tab, setTab] = useState('details');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [validation, setValidation] = useState(null);
    const [busy, setBusy] = useState(false);
    async function load() {
        try { setProblem(await api(`/coding/manage/${id}`)); }
        catch (loadError) { setError(loadError.message); }
    }
    useEffect(() => { load(); }, [id]);
    async function publish() {
        setBusy(true); setError(''); setNotice(''); setValidation(null);
        try {
            const result = await api(`/coding/manage/${id}/publish`, 'POST');
            setValidation(result);
            if (result.published) { setNotice(`Published. The reference solution passed every test case (slowest ${result.slowestMs} ms).`); onChanged(); }
            load();
        }
        catch (publishError) { setError(publishError.message); }
        finally { setBusy(false); }
    }
    async function unpublish() {
        try { await api(`/coding/manage/${id}/unpublish`, 'POST'); setNotice('Moved back to draft.'); load(); onChanged(); }
        catch (unpublishError) { setError(unpublishError.message); }
    }
    if (!problem) return error ? <div role="alert" className="alert">{error}</div> : <div className="loading">Loading...</div>;
    return <section className="panel">
        <button className="text-button" onClick={onBack}><ArrowLeft size={14}/>All my problems</button>
        <div className="section-title assessment-head">
            <div><h2>{problem.title}</h2><p className="muted">{VISIBILITY[problem.visibility]} · {problem.testCases.length} test cases ({problem.testCases.filter(c => c.isSample === 1).length} samples) · validated {when(problem.validatedAt)}</p></div>
            <div className="row-actions">
                <span className={`status-pill ${problem.status === 'PUBLISHED' ? 'published' : 'draft'}`}>{problem.status.toLowerCase()}</span>
                <button className="primary small" disabled={busy} onClick={publish}><CheckCircle2 size={15}/>{busy ? 'Validating...' : problem.status === 'PUBLISHED' ? 'Validate again' : 'Validate & publish'}</button>
                {problem.status === 'PUBLISHED' && <button className="secondary small" onClick={unpublish}>Unpublish</button>}
            </div>
        </div>
        {error && <div role="alert" className="alert">{error}</div>}
        {notice && <div className="success">{notice}</div>}
        {validation && !validation.published && <div className="alert"><strong>Not published:</strong> the reference solution failed {validation.failures.length} test case(s).
            <ul>{validation.failures.slice(0, 5).map(f => <li key={f.index}>Test case {f.index}: {verdictLabel(f.status)}{f.detail ? ` - ${f.detail.slice(0, 200)}` : f.stdout ? ` - printed "${f.stdout.slice(0, 80)}"` : ''}</li>)}</ul>
            Fix the expected outputs or the reference solution, then validate again.</div>}
        <div className="challenge-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'details'} onClick={() => setTab('details')}>Details & reference</button>
            <button role="tab" aria-selected={tab === 'cases'} onClick={() => setTab('cases')}>Test cases</button>
        </div>
        {tab === 'details' ? <DetailsForm key={problem.updatedAt ?? problem.createdAt} problem={problem} languages={languages} onSaved={() => { setNotice('Saved.'); load(); onChanged(); }}/>
            : <TestCasesForm key={problem.testCases.map(c => c.id).join()} problem={problem} onSaved={() => { setNotice('Test cases saved. Validate to publish again.'); load(); onChanged(); }}/>}
    </section>;
}

// Teachers manage the problems they wrote; College Admins every problem of the college.
export function ProblemManager({ languages, onChanged, initiallyCreating = false }) {
    const { api, isSuper } = useWorkspace();
    const [rows, setRows] = useState(null);
    const [open, setOpen] = useState(null);
    const [creating, setCreating] = useState(initiallyCreating);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const query = search.trim().toLowerCase();
    const filteredRows = (rows || []).filter(row => !query || `${row.title} ${row.topic} ${row.difficulty} ${row.status} ${VISIBILITY[row.visibility]}`.toLowerCase().includes(query));
    const total = filteredRows.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, pageCount);
    const start = (currentPage - 1) * pageSize;
    const pageRows = filteredRows.slice(start, start + pageSize);
    useEffect(() => { setPage(current => Math.min(current, pageCount)); }, [pageCount]);
    async function load() {
        try { setRows(await api('/coding/manage')); }
        catch (loadError) { setError(loadError.message); }
    }
    useEffect(() => { if (!open) load(); }, [open]);
    async function remove(row) {
        if (!window.confirm(`Delete "${row.title}"?`)) return;
        try { await api(`/coding/manage/${row.id}`, 'DELETE'); load(); onChanged(); }
        catch (removeError) { setError(removeError.message); }
    }
    if (open) return <ProblemEditor id={open} languages={languages} onBack={() => setOpen(null)} onChanged={onChanged}/>;
    if (creating) return <section className="panel">
        <button type="button" className="text-button" onClick={() => setCreating(false)}><ArrowLeft size={16}/> Back to problems</button>
        <h2>Add problem</h2>
        <p className="muted">{isSuper ? 'This problem will be available to every college after publishing.' : 'This problem will be available to your college after publishing.'}</p>
        <DetailsForm languages={languages} onSaved={created => { setCreating(false); setOpen(created.id); }}/>
    </section>;
    return <section className="panel">
        <div className="section-title"><div><h2>{isSuper ? 'Shared problem library' : 'College coding problems'}</h2><p className="muted">{isSuper ? 'Published problems are available to every college.' : 'Published problems are available only to your college.'} Add a statement, test cases, and a reference solution, then validate and publish.</p></div>{!creating && <button className="primary" onClick={() => setCreating(true)}><Plus size={16}/>Add problem</button>}</div>
        {error && <div role="alert" className="alert">{error}</div>}
        <div className="problem-library-search"><label htmlFor="problem-library-search">Search problems</label><div><Search size={17} aria-hidden="true"/><input id="problem-library-search" type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search by name, topic, difficulty or status"/></div><span className="muted" role="status">{rows ? `${total} problem${total === 1 ? '' : 's'} found` : 'Loading problems...'}</span></div>
        {!rows ? <div className="loading">Loading...</div> : !rows.length ? <div className="empty"><h3>No problems yet</h3><p>The platform library is always available; create your own for your students.</p></div> : <div className="table-wrap"><table>
            <thead><tr><th>Problem</th><th>Where</th><th>Status</th><th>Test cases</th><th>Submissions</th><th></th></tr></thead>
            <tbody>{total === 0 && <tr><td colSpan={6}>No problems match your search.</td></tr>}{pageRows.map(row => <tr key={row.id}>
                <td><button className="text-button problem-link" onClick={() => setOpen(row.id)}>{row.title}</button><br/><small className="muted">{row.difficulty.toLowerCase()}{row.topic ? ` · ${row.topic}` : ''}</small></td>
                <td>{VISIBILITY[row.visibility]}</td>
                <td><span className={`status-pill ${row.status === 'PUBLISHED' ? 'published' : 'draft'}`}>{row.status.toLowerCase()}</span></td>
                <td>{row._count.testCases}</td><td>{row._count.submissions}</td>
                <td><span className="row-actions"><button aria-label="Edit" title="Edit" className="text-button" onClick={() => setOpen(row.id)}><Pencil size={14} aria-hidden="true"/></button><button className="text-button danger" onClick={() => remove(row)}><Trash2 size={14}/>Delete</button></span></td>
            </tr>)}</tbody>
        </table></div>}
        {total > 0 && <div className="problem-pagination">
            <div className="pagination-summary"><label>Rows per page<select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{[10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></label><span>Showing {start + 1}–{Math.min(start + pageSize, total)} of {total} problems</span></div>
            <nav aria-label="Problem library pagination" className="pagination-navigation">
                <button type="button" className="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).filter(number => number === 1 || number === pageCount || Math.abs(number - currentPage) <= 1).map((number, index, visible) => <span key={number} className="pagination-page">{index > 0 && number - visible[index - 1] > 1 && <span aria-hidden="true">…</span>}<button type="button" className={number === currentPage ? 'primary' : 'secondary'} aria-label={`Page ${number}`} aria-current={number === currentPage ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button></span>)}
                <button type="button" className="secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button>
            </nav>
        </div>}
    </section>;
}
