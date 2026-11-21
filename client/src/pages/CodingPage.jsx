import { PaginatedTable, PaginatedItems } from '../components/Pagination';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronRight, CircleDot, Clock, FileCode2, Gauge, Play, RotateCcw, Send, Shuffle, Plus } from 'lucide-react';
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

// Languages whose problems are checked against a fixed spec, so a custom input makes no sense.
const NO_CUSTOM_INPUT = ['sql', 'html', 'react', 'git', 'dockerfile', 'yaml'];

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
        return <ProblemWorkspace key={summary.id} summary={summary} library={library} onBack={() => setParams({ track: summary.track ?? 'General' })} onSubmitted={load}/>;
    // Back from a problem lands on that language's problem list, not the language chooser.
    return <ProblemList library={library} initialTrack={params.get('track') || ''} onOpen={open} onChanged={load}/>;
}

// One card per language / track on the practice home; clicking a card opens that track's problems.
const percent = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

const TRACK_LOOK = {
    Python: { badge: 'Py', color: '#2f6fb3', about: 'Basics, loops, strings, arrays and algorithms' },
    C: { badge: 'C', color: '#4a5d8a', about: 'Variables to pointers, structs and dynamic memory' },
    Java: { badge: 'Jv', color: '#c0562b', about: 'OOP, collections, threads, I/O and streams' },
    DSA: { badge: 'DS', color: '#7a4fa3', about: 'Lists, trees, graphs, stacks and sorting' },
    SQL: { badge: 'SQL', color: '#0f8a8a', about: 'SELECT, joins, grouping and filters' },
    'HTML & CSS': { badge: '</>', color: '#d4691f', about: 'Structure, forms, tables and styling' },
    React: { badge: 'Re', color: '#1d8fb0', about: 'Components, props, state and lists' },
    'Git & GitHub': { badge: 'Git', color: '#c8452f', about: 'Branches, merges, stash and pull requests' },
    DevOps: { badge: 'Ops', color: '#3a7d44', about: 'Shell, Docker, CI/CD and Kubernetes' },
    General: { badge: '#', color: '#5f6f66', about: 'Mixed practice problems' },
};

function TrackCards({ library, tracks, onPick }) {
    return <div className="track-grid">{tracks.map(track => {
        const items = library.problems.filter(p => (p.track ?? 'General') === track);
        const solved = items.filter(p => p.state === 'SOLVED').length;
        const look = TRACK_LOOK[track] ?? TRACK_LOOK.General;
        return <button key={track} type="button" className="track-card" style={{ '--track': look.color }} onClick={() => onPick(track)}>
            <span className="track-top">
                <span className="track-badge">{look.badge}</span>
                <span className="track-total">{items.length} problems</span>
                <ArrowRight className="track-go" size={16} aria-hidden="true"/>
            </span>
            <strong>{track}</strong>
            <span className="track-about">{look.about}</span>
            <span className="track-progress"><i style={{ width: `${percent(solved, items.length)}%` }}/></span>
            <span className="track-count">{solved} / {items.length} solved <b>{percent(solved, items.length)}%</b></span>
        </button>;
    })}</div>;
}

function ProblemList({ library, initialTrack = '', onOpen, onChanged }) {
    const { can } = useWorkspace();
    const [tab, setTab] = useState('problems');
    const [addingProblem, setAddingProblem] = useState(false);
    const [filter, setFilter] = useState({ search: '', difficulty: '', topic: '', state: '', track: library.problems.some(p => (p.track ?? 'General') === initialTrack) ? initialTrack : '' });
    const topics = useMemo(() => [...new Set(library.problems.filter(p => !filter.track || p.track === filter.track).map(p => p.topic))].sort(), [library, filter.track]);
    const shown = library.problems.filter(p =>
        (!filter.search || `${p.title} ${p.topic}`.toLowerCase().includes(filter.search.toLowerCase()))
        && (!filter.difficulty || p.difficulty === filter.difficulty)
        && (!filter.track || p.track === filter.track)
        && (!filter.topic || p.topic === filter.topic)
        && (!filter.state || p.state === filter.state));
    // Tracks (Python, C, Java, DSA, SQL, HTML & CSS) in a friendly order, with how many problems each has.
    const trackOrder = ['Python', 'C', 'Java', 'DSA', 'SQL', 'HTML & CSS', 'React', 'Git & GitHub', 'DevOps', 'General'];
    const tracks = useMemo(() => [...new Set(library.problems.map(p => p.track ?? 'General'))].sort((a, b) => (trackOrder.indexOf(a) + 1 || 99) - (trackOrder.indexOf(b) + 1 || 99)), [library]);
    const count = state => library.problems.filter(p => p.state === state).length;
    const change = field => event => setFilter(current => ({ ...current, [field]: event.target.value }));
    const unsolved = library.problems.filter(p => p.state !== 'SOLVED');
    // The top cards: Solved / Attempted list those problems across every language; Overall progress goes back to the language cards.
    const showState = state => { setTab('problems'); setFilter({ search: '', difficulty: '', topic: '', state, track: '' }); };
    return <>
        <div className="page-heading"><div><h1>Coding practice</h1><p className="muted">Solve challenges and build your coding skills.</p></div>{can('coding', 'update') && can('coding', 'create') && <button className="primary" onClick={() => { setAddingProblem(true); setTab('manage'); }}><Plus size={16}/> Add problem</button>}</div>
        <div className="stats coding-stats">
            <button type="button" className={`stat stat-link${filter.state === 'SOLVED' && !filter.track ? ' open' : ''}`} onClick={() => showState('SOLVED')}><div className="stat-icon"><CheckCircle2 size={20}/></div><div><small>Solved</small><strong>{count('SOLVED')} / {library.problems.length}</strong></div></button>
            <button type="button" className={`stat stat-link${filter.state === 'ATTEMPTED' && !filter.track ? ' open' : ''}`} onClick={() => showState('ATTEMPTED')}><div className="stat-icon"><CircleDot size={20}/></div><div><small>Attempted</small><strong>{count('ATTEMPTED')}</strong></div></button>
            <button type="button" className={`stat stat-link${!filter.state && !filter.track && !filter.search ? ' open' : ''}`} onClick={() => showState('')}><div className="stat-icon"><Gauge size={20}/></div><div><small>Overall progress</small><strong>{percent(count('SOLVED'), library.problems.length)}%</strong><span className="stat-bar"><i style={{ width: `${percent(count('SOLVED'), library.problems.length)}%` }}/></span></div></button>
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
            : !filter.track && !filter.search && !filter.state ? <section className="panel">
                <div className="track-intro"><h2>Choose a language</h2><label className="track-search"><input value={filter.search} onChange={change('search')} placeholder="Or search every problem by name or topic"/></label></div>
                <TrackCards library={library} tracks={tracks} onPick={track => setFilter(current => ({ ...current, track, topic: '' }))}/>
            </section>
            : <section className="panel">
                <div className="track-head">
                    <button type="button" className="text-button" onClick={() => setFilter({ search: '', difficulty: '', topic: '', state: '', track: '' })}><ArrowLeft size={14}/> All languages</button>
                    <h2>{filter.track || (filter.state === 'SOLVED' ? 'Solved problems' : filter.state === 'ATTEMPTED' ? 'Attempted problems' : 'Search results')}</h2>
                    <span className="muted">{shown.length} problem{shown.length === 1 ? '' : 's'}</span>
                </div>
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
    return <section className={problemId ? '' : 'panel'}><div className="table-wrap"><PaginatedTable className="sub-table">
        <thead><tr><th>When</th>{everyone && <th>Student</th>}{!problemId && <th>Problem</th>}<th>Language</th><th>Result</th><th>Score</th><th>Tests</th><th>Time</th>{onLoadCode && <th></th>}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}>
            <td className="sub-when">{when(row.createdAt)}</td>
            {everyone && <td><strong>{row.user?.name}</strong><br/><small className="muted">{row.user?.email}</small></td>}
            {!problemId && <td>{onOpen && slugOf(row.problemId) ? <button className="text-button" onClick={() => onOpen(slugOf(row.problemId))}>{row.problem.title}</button> : row.problem.title}</td>}
            <td><span className="lang-chip">{row.language}</span></td>
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
    // Python problems start with the input already read for you; other languages get the generic template.
    const starterOf = lang => problem.starters?.[lang] ?? STARTERS[lang] ?? '';
    const [code, setCode] = useState(() => store.get(draftKey) ?? starterOf(language));
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
        setCode(store.get(`${draftPrefix}:${next}`) ?? starterOf(next));
        setResult(null); setError('');
    }
    function reset() {
        if (!window.confirm('Replace your code with the starting template?')) return;
        store.remove(draftKey);
        setCode(starterOf(language));
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
            {!NO_CUSTOM_INPUT.includes(language) && <label className="check"><input type="checkbox" checked={useCustom} onChange={event => setUseCustom(event.target.checked)}/>Test against custom input</label>}
            <div className="editor-actions">
                <button className="secondary" onClick={() => execute('run')} disabled={!!running || !ready}><Play size={15}/>{running === 'run' ? 'Running...' : 'Run Code'}</button>
                <button className="primary submit-button" onClick={() => execute('submit')} disabled={!!running || !ready}><Send size={15}/>{running === 'submit' ? 'Submitting...' : 'Submit Code'}</button>
            </div>
        </div>
        {useCustom && !NO_CUSTOM_INPUT.includes(language) && <textarea className="custom-input" rows={4} value={customInput} onChange={event => setCustomInput(event.target.value)} aria-label="Custom input" spellCheck={false}/>}
        {!ready && <div className="alert">This language is not installed on the server yet. Choose another language, or ask your administrator to add it.</div>}
        {error && <div role="alert" className="alert">{error}</div>}
        {running && <div className="code-result running">{progress === 'RUNNING' ? 'Running your code against the test cases...' : 'Waiting in the judge queue...'}</div>}
        {result && <JudgeResult key={result.id} result={result}/>}
    </section>;
}

// A small "Pseudocode" toggle at the end of the statement: opens the pseudocode and a plain explanation of the solution.
// The explanation is text with "## Heading" lines; numbered steps and indented bullets keep their layout.
function PseudocodePanel({ problem }) {
    const [open, setOpen] = useState(false);
    if (!problem.pseudocode) return null;
    const sections = (problem.explanation ?? '').split(/\n\n(?=## )/).filter(Boolean);
    return <div className="pseudo-box">
        <button type="button" className="pseudo-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} <FileCode2 size={14}/> Pseudocode
        </button>
        {open && <div className="pseudo-body">
            <pre className="pseudo-code">{problem.pseudocode}</pre>
            {sections.map((section, i) => {
                const [title, ...rest] = section.split('\n');
                return <div key={i} className="pseudo-section"><h4>{title.replace(/^##\s*/, '')}</h4><div className="pseudo-text">{rest.join('\n')}</div></div>;
            })}
        </div>}
    </div>;
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
        <PseudocodePanel key={problem.id} problem={problem}/>
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
