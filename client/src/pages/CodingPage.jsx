import { PaginatedTable, PaginatedItems } from '../components/Pagination';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, CheckCircle2, CircleDot, Clock, Play, RotateCcw, Send, Shuffle, Plus } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { CodeEditor } from '../components/CodeEditor';
import { JudgeResult, VERDICTS, judgeCode, verdictLabel } from '../components/JudgeResult';
import { ProblemManager } from '../components/ProblemManager';
import { STARTERS, store } from '../components/codeStarters';

const DIFFICULTY = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' };
const StatusTag = ({ status, jobStatus }) => jobStatus && jobStatus !== 'DONE'
    ? <span className="code-status">{jobStatus === 'INTERNAL_ERROR' ? 'Not judged' : 'Judging...'}</span>
    : <span className={`code-status ${VERDICTS[status]?.tone ?? ''}`}>{verdictLabel(status)}</span>;
const when = value => new Date(value).toLocaleString();

export function CodingPage() {
    const { api, college, isSuper, inCollege } = useWorkspace();
    const [params, setParams] = useSearchParams();
    const [library, setLibrary] = useState(null);
    const [error, setError] = useState('');
    async function load() {
        try { setError(''); setLibrary(await api('/coding/problems')); }
        catch (loadError) { setError(loadError.message); }
    }
    useEffect(() => { load(); }, [college?.id]);
    const slug = params.get('problem');
    const open = (next) => setParams(next ? { problem: next } : {});
    if (error) return <div role="alert" className="alert">{error}</div>;
    if (!library) return <div className="loading">Loading problems...</div>;
    if (isSuper && !inCollege) return <ProblemManager languages={library.languages} onChanged={load}/>;
    const summary = slug && library.problems.find(p => p.slug === slug);
    if (slug && summary)
        return <ProblemWorkspace key={summary.id} summary={summary} library={library} onBack={() => open(null)} onSubmitted={load}/>;
    return <ProblemList library={library} onOpen={open} onChanged={load}/>;
}

function ProblemList({ library, onOpen, onChanged }) {
    const { can } = useWorkspace();
    const [tab, setTab] = useState('problems');
    const [addingProblem, setAddingProblem] = useState(false);
    const [filter, setFilter] = useState({ search: '', difficulty: '', topic: '', state: '' });
    const topics = useMemo(() => [...new Set(library.problems.map(p => p.topic))].sort(), [library]);
    const shown = library.problems.filter(p =>
        (!filter.search || `${p.title} ${p.topic}`.toLowerCase().includes(filter.search.toLowerCase()))
        && (!filter.difficulty || p.difficulty === filter.difficulty)
        && (!filter.topic || p.topic === filter.topic)
        && (!filter.state || p.state === filter.state));
    const count = state => library.problems.filter(p => p.state === state).length;
    const change = field => event => setFilter(current => ({ ...current, [field]: event.target.value }));
    const unsolved = library.problems.filter(p => p.state !== 'SOLVED');
    return <>
        <div className="page-heading"><div><h1>Coding practice</h1><p className="muted">Solve challenges and build your coding skills.</p></div>{can('coding', 'update') && can('coding', 'create') && <button className="primary" onClick={() => { setAddingProblem(true); setTab('manage'); }}><Plus size={16}/> Add problem</button>}</div>
        <div className="stats coding-stats">
            <div className="stat"><div className="stat-icon"><CheckCircle2 size={20}/></div><div><small>Solved</small><strong>{count('SOLVED')} / {library.problems.length}</strong></div></div>
            <div className="stat"><div className="stat-icon"><CircleDot size={20}/></div><div><small>Attempted</small><strong>{count('ATTEMPTED')}</strong></div></div>
            <div className="stat"><div className="stat-icon"><Play size={20}/></div><div><small>Languages ready</small><strong className="stat-text">{library.languages.filter(l => l.available).map(l => l.label).join(', ') || 'None'}</strong></div></div>
        </div>
        {!library.languages.some(l => l.available) && <div className="alert">Running code is turned off on this server. You can read the problems, but Run and Submit are unavailable.</div>}
        <div className="course-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'problems'} onClick={() => setTab('problems')}>Problems</button>
            <button role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>My submissions</button>
            {can('coding', 'update') && <button role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>College submissions</button>}
            {can('coding', 'update') && <button role="tab" aria-selected={tab === 'manage'} onClick={() => { setAddingProblem(false); setTab('manage'); }}>Manage problems</button>}
        </div>
        {tab === 'manage' ? <ProblemManager key={addingProblem ? 'add' : 'manage'} initiallyCreating={addingProblem} languages={library.languages} onChanged={onChanged}/>
            : tab !== 'problems' ? <Submissions everyone={tab === 'all'} onOpen={onOpen} problems={library.problems}/>
            : <section className="panel">
                <div className="audit-filters">
                    <label>Search<input value={filter.search} onChange={change('search')} placeholder="Problem name or topic"/></label>
                    <label>Difficulty<select value={filter.difficulty} onChange={change('difficulty')}><option value="">All</option>{Object.entries(DIFFICULTY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                    <label>Topic<select value={filter.topic} onChange={change('topic')}><option value="">All topics</option>{topics.map(t => <option key={t}>{t}</option>)}</select></label>
                    <label>Status<select value={filter.state} onChange={change('state')}><option value="">All</option><option value="NEW">Not started</option><option value="ATTEMPTED">Attempted</option><option value="SOLVED">Solved</option></select></label>
                    <button className="secondary" disabled={!unsolved.length} onClick={() => onOpen(unsolved[Math.floor(Math.random() * unsolved.length)].slug)}><Shuffle size={15}/>Random unsolved</button>
                </div>
                <PaginatedItems className="challenge-list">{shown.map(p => <article key={p.id} className="challenge-card">
                    <div>
                        <h3>{p.title}</h3>
                        <p><span className={`difficulty-text ${p.difficulty.toLowerCase()}`}>{DIFFICULTY[p.difficulty]}</span> · {p.topic}{p.collegeId ? ' · Your college' : ''} · {p.acceptance === null ? 'No submissions yet' : `Success rate ${p.acceptance}%`}</p>
                    </div>
                    {p.state === 'SOLVED' ? <span className="solved"><CheckCircle2 size={16}/>Solved</span> : p.state === 'ATTEMPTED' ? <span className="attempted"><CircleDot size={16}/>Attempted</span> : null}
                    <button className={p.state === 'SOLVED' ? 'secondary' : 'primary solve-button'} onClick={() => onOpen(p.slug)}>{p.state === 'SOLVED' ? 'Solve again' : p.state === 'ATTEMPTED' ? 'Try again' : 'Solve challenge'}</button>
                </article>)}</PaginatedItems>
                {!shown.length && <p className="muted">No problems match these filters.</p>}
            </section>}
    </>;
}

function Submissions({ everyone, problemId, problems = [], onOpen, onLoadCode, refresh }) {
    const { api } = useWorkspace();
    const [rows, setRows] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        const query = new URLSearchParams({ ...(problemId ? { problemId } : {}), ...(everyone ? { all: '1' } : {}) });
        api(`/coding/submissions?${query}`).then(setRows, loadError => setError(loadError.message));
    }, [everyone, problemId, refresh]);
    if (error) return <div role="alert" className="alert">{error}</div>;
    if (!rows) return <div className="loading">Loading submissions...</div>;
    if (!rows.length) return <div className="empty"><h3>No submissions yet</h3><p>Submitted solutions appear here.</p></div>;
    const slugOf = id => problems.find(p => p.id === id)?.slug;
    return <section className={problemId ? '' : 'panel'}><div className="table-wrap"><PaginatedTable>
        <thead><tr><th>When</th>{everyone && <th>Student</th>}{!problemId && <th>Problem</th>}<th>Language</th><th>Result</th><th>Score</th><th>Tests</th><th>Time</th>{onLoadCode && <th></th>}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}>
            <td>{when(row.createdAt)}</td>
            {everyone && <td><strong>{row.user?.name}</strong><br/><small className="muted">{row.user?.email}</small></td>}
            {!problemId && <td>{onOpen && slugOf(row.problemId) ? <button className="text-button" onClick={() => onOpen(slugOf(row.problemId))}>{row.problem.title}</button> : row.problem.title}</td>}
            <td>{row.language}</td>
            <td><StatusTag status={row.status} jobStatus={row.jobStatus}/></td>
            <td>{row.score ?? '-'} / {row.maxScore}</td>
            <td>{row.passedCount} / {row.totalCount}</td>
            <td>{row.runtimeMs} ms</td>
            {onLoadCode && <td><button className="text-button" onClick={() => onLoadCode(row)}>Load code</button></td>}
        </tr>)}</tbody>
    </PaginatedTable></div></section>;
}

// Problem statement on the left; editor, Run/Submit and results on the right.
export function CodingWorkbench({ problem, draftPrefix, runPath, submitPath, resultPath, onSubmitted, header }) {
    const { api } = useWorkspace();
    const allowed = problem.languages;
    const usable = allowed.filter(l => l.available);
    const [language, setLanguage] = useState(() => {
        const saved = store.get('lms-code-lang');
        return usable.some(l => l.id === saved) ? saved : usable[0]?.id ?? allowed[0]?.id ?? 'python';
    });
    const draftKey = `${draftPrefix}:${language}`;
    const [code, setCode] = useState(() => store.get(draftKey) ?? STARTERS[language] ?? '');
    const [useCustom, setUseCustom] = useState(false);
    const [customInput, setCustomInput] = useState(problem.samples[0]?.input ?? '');
    const [result, setResult] = useState(null);
    const [running, setRunning] = useState('');
    const [progress, setProgress] = useState('');
    const [error, setError] = useState('');
    const ready = usable.some(l => l.id === language);
    useEffect(() => { store.set(draftKey, code); }, [draftKey, code]);

    function switchLanguage(next) {
        setLanguage(next);
        store.set('lms-code-lang', next);
        setCode(store.get(`${draftPrefix}:${next}`) ?? STARTERS[next] ?? '');
        setResult(null); setError('');
    }
    function reset() {
        if (!window.confirm('Replace your code with the starting template?')) return;
        store.remove(draftKey);
        setCode(STARTERS[language] ?? '');
    }
    async function execute(kind) {
        setRunning(kind); setError(''); setResult(null); setProgress('QUEUED');
        try {
            const body = { language, code, ...(kind === 'run' && useCustom ? { customInput } : {}) };
            setResult(await judgeCode(api, kind === 'run' ? runPath : submitPath, body, resultPath, setProgress));
            if (kind === 'submit') onSubmitted?.();
        }
        catch (runError) { setError(runError.message); }
        finally { setRunning(''); setProgress(''); }
    }
    return <section className="coding-editor-panel">
        {header}
        <div className="editor-toolbar">
            <span className="editor-title">Code editor</span>
            <div className="editor-tools">
                <select aria-label="Language" value={language} onChange={event => switchLanguage(event.target.value)}>
                    {allowed.map(l => <option key={l.id} value={l.id} disabled={!l.available}>{l.label}{l.available ? '' : ' (not installed)'}</option>)}
                </select>
                <button className="icon-button" title="Reset to the starting template" aria-label="Reset code" onClick={reset}><RotateCcw size={15}/></button>
            </div>
        </div>
        {['java', 'csharp'].includes(language) && <p className="editor-hint">Keep the class name <code>Main</code>.</p>}
        <CodeEditor value={code} onChange={setCode} language={language}/>
        <div className="editor-footer">
            <label className="check"><input type="checkbox" checked={useCustom} onChange={event => setUseCustom(event.target.checked)}/>Test against custom input</label>
            <div className="editor-actions">
                <button className="secondary" onClick={() => execute('run')} disabled={!!running || !ready}><Play size={15}/>{running === 'run' ? 'Running...' : 'Run Code'}</button>
                <button className="primary submit-button" onClick={() => execute('submit')} disabled={!!running || !ready}><Send size={15}/>{running === 'submit' ? 'Submitting...' : 'Submit Code'}</button>
            </div>
        </div>
        {useCustom && <textarea className="custom-input" rows={4} value={customInput} onChange={event => setCustomInput(event.target.value)} aria-label="Custom input" spellCheck={false}/>}
        {!ready && <div className="alert">This language is not installed on the server yet. Choose another language, or ask your administrator to add it.</div>}
        {error && <div role="alert" className="alert">{error}</div>}
        {running && <div className="code-result running">{progress === 'RUNNING' ? 'Running your code against the test cases...' : 'Waiting in the judge queue...'}</div>}
        {result && <JudgeResult key={result.id} result={result}/>}
    </section>;
}

export function ProblemStatement({ problem }) {
    return <article className="problem-body">
        <div className="syllabus-tags"><span className="tag">{problem.topic || 'General'}</span><span className="tag"><Clock size={11}/> {problem.timeLimitMs / 1000}s per test</span></div>
        <ReactMarkdown>{problem.statement}</ReactMarkdown>
        {problem.inputFormat && <><h3>Input Format</h3><ReactMarkdown>{problem.inputFormat}</ReactMarkdown></>}
        {problem.constraints && <><h3>Constraints</h3><ReactMarkdown>{problem.constraints}</ReactMarkdown></>}
        {problem.outputFormat && <><h3>Output Format</h3><ReactMarkdown>{problem.outputFormat}</ReactMarkdown></>}
        {problem.samples.map((sample, i) => <div key={i} className="sample-case">
            <h3>Sample Input {i}</h3><pre>{sample.input || '(no input)'}</pre>
            <h3>Sample Output {i}</h3><pre>{sample.output}</pre>
            {sample.explanation && <><h3>Explanation {i}</h3><p>{sample.explanation}</p></>}
        </div>)}
        <p className="muted">Submitting also checks {problem.hiddenCount} hidden test cases.</p>
    </article>;
}

function ProblemWorkspace({ summary, onBack, onSubmitted }) {
    const { api } = useWorkspace();
    const [problem, setProblem] = useState(null);
    const [tab, setTab] = useState('problem');
    const [error, setError] = useState('');
    const [refresh, setRefresh] = useState(0);
    const [loaded, setLoaded] = useState(null);
    useEffect(() => { api(`/coding/problems/${summary.id}`).then(setProblem, loadError => setError(loadError.message)); }, [summary.id]);
    if (error) return <div role="alert" className="alert">{error}</div>;
    if (!problem) return <div className="loading">Loading...</div>;
    return <div className="coding-workspace">
        <div className="challenge-bar">
            <button className="text-button" onClick={onBack}><ArrowLeft size={15}/>All challenges</button>
            <h2>{summary.title}</h2>
            <span className={`difficulty ${summary.difficulty.toLowerCase()}`}>{DIFFICULTY[summary.difficulty]}</span>
            {summary.state === 'SOLVED' && <span className="solved"><CheckCircle2 size={16}/>Solved</span>}
        </div>
        <div className="coding-split">
            <section className="panel coding-statement">
                <div className="challenge-tabs" role="tablist">
                    <button role="tab" aria-selected={tab === 'problem'} onClick={() => setTab('problem')}>Problem</button>
                    <button role="tab" aria-selected={tab === 'submissions'} onClick={() => setTab('submissions')}>Submissions</button>
                </div>
                {tab === 'submissions'
                    ? <Submissions problemId={summary.id} refresh={refresh} onLoadCode={row => {
                        store.set(`lms-code:${summary.id}:${row.language}`, row.code);
                        store.set('lms-code-lang', row.language);
                        setLoaded(row.id); setTab('problem');
                    }}/>
                    : <ProblemStatement problem={problem}/>}
            </section>
            <CodingWorkbench key={loaded ?? 'draft'} problem={problem} draftPrefix={`lms-code:${summary.id}`}
                runPath={`/coding/problems/${summary.id}/run`} submitPath={`/coding/problems/${summary.id}/submit`}
                resultPath={id => `/coding/submissions/${id}`} onSubmitted={() => { setRefresh(n => n + 1); onSubmitted(); }}/>
        </div>
    </div>;
}
