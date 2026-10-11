import { PaginatedTable, PaginatedItems } from '../components/Pagination';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, ClipboardCheck, Plus } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { QuestionBank } from '../components/QuestionBank';
import { ASSESSMENT_TYPES, AssessmentEditor, AssessmentForm, emptyAssessment } from '../components/AssessmentEditor';
import { ExamPlayer } from '../components/ExamPlayer';

const when = value => new Date(value).toLocaleString();

// Editors (assessments update permission) build and grade; everyone else takes assessments.
export function AssessmentsPage() {
    const { can } = useWorkspace();
    return can('assessments', 'update') ? <EditorView/> : <StudentView/>;
}

function EditorView() {
    const { api, college } = useWorkspace();
    const [params, setParams] = useSearchParams();
    const [tab, setTab] = useState('assessments');
    const [list, setList] = useState(null);
    const [options, setOptions] = useState({ courses: [], cohorts: [], codingProblems: [] });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const openId = params.get('assessment');
    async function load() {
        try {
            const [rows, opts] = await Promise.all([api('/assessments'), api('/assessments/options')]);
            setList(rows); setOptions(opts);
        }
        catch (loadError) { setError(loadError.message); }
    }
    useEffect(() => { load(); }, [college?.id, openId]);
    const open = id => setParams(id ? { assessment: id } : {});
    if (openId) return <AssessmentEditor id={openId} options={options} onBack={() => open(null)}/>;
    return <>
        <div className="challenge-tabs page-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'assessments'} onClick={() => setTab('assessments')}>Assessments</button>
            <button role="tab" aria-selected={tab === 'bank'} onClick={() => setTab('bank')}>Question bank</button>
        </div>
        {error && <div role="alert" className="alert">{error}</div>}
        {tab === 'bank' ? <QuestionBank courses={options.courses} codingProblems={options.codingProblems}/> : <section className="panel">
            <div className="section-title"><div><h2>Assessments</h2><p className="muted">Build from the question bank, set windows, publish, then review results.</p></div>{!creating && <button className="primary" onClick={() => setCreating(true)}><Plus size={16}/>New assessment</button>}</div>
            {creating && <AssessmentForm initial={emptyAssessment} courses={options.courses} submitLabel="Create and add questions" onSubmit={async body => { const created = await api('/assessments', 'POST', body); setCreating(false); open(created.id); }}/>}
            {!list ? <div className="loading">Loading...</div> : !list.length ? <div className="empty"><h3>No assessments yet</h3><p>Create a quiz, assignment or exam.</p></div> : <div className="table-wrap"><PaginatedTable>
                <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Questions</th><th>Marks</th><th>Windows</th><th>Attempts</th></tr></thead>
                <tbody>{list.map(a => <tr key={a.id} className="audit-row" onClick={() => open(a.id)}>
                    <td><button className="text-button problem-link" onClick={() => open(a.id)}>{a.title}</button></td>
                    <td>{ASSESSMENT_TYPES[a.assessmentType]}</td>
                    <td><span className={`status-pill ${a.status.toLowerCase()}`}>{a.status.toLowerCase()}</span></td>
                    <td>{a.questionCount}</td><td>{a.totalMarks}</td><td>{a.windows.length}</td><td>{a._count.attempts}</td>
                </tr>)}</tbody>
            </PaginatedTable></div>}
        </section>}
    </>;
}

const STATE = { OPEN: 'Open now', IN_PROGRESS: 'In progress', UPCOMING: 'Upcoming', CLOSED: 'Closed', USED_UP: 'All attempts used' };

function StudentView() {
    const { api, college } = useWorkspace();
    const [params, setParams] = useSearchParams();
    const [list, setList] = useState(null);
    const [error, setError] = useState('');
    const attemptId = params.get('attempt');
    useEffect(() => { if (!attemptId) api('/assessments/mine').then(setList, e => setError(e.message)); }, [college?.id, attemptId]);
    async function start(a) {
        if (a.state === 'OPEN' && !window.confirm(`Start "${a.title}"?${a.durationMin ? ` You will have ${a.durationMin} minutes.` : ''} Attempt ${a.attempts.length + 1} of ${a.maxAttempts}.`)) return;
        try { const attempt = await api(`/assessments/${a.id}/attempts`, 'POST'); setParams({ attempt: attempt.id }); }
        catch (startError) { setError(startError.message); }
    }
    if (attemptId) return <ExamPlayer attemptId={attemptId} onExit={() => setParams({})}/>;
    if (error) return <div role="alert" className="alert">{error}</div>;
    if (!list) return <div className="loading">Loading...</div>;
    if (!list.length) return <div className="empty"><h3>No assessments yet</h3><p>Quizzes and exams your teachers publish for you appear here.</p></div>;
    return <PaginatedItems className="assessment-cards">{list.map(a => <article key={a.id} className="challenge-card assessment-card">
        <div className="stat-icon"><ClipboardCheck size={20}/></div>
        <div>
            <h3>{a.title}</h3>
            <p>{ASSESSMENT_TYPES[a.assessmentType]} · {a.questionCount} questions · {a.totalMarks} marks · {a.durationMin ? `${a.durationMin} min` : 'no time limit'} · attempts {a.attempts.length}/{a.maxAttempts}</p>
            {a.window && <p><CalendarClock size={13}/> {when(a.window.opensAt)} - {when(a.window.closesAt)}</p>}
            {a.attempts.filter(t => t.status !== 'IN_PROGRESS').map(t => <p key={t.id} className="attempt-line">
                Attempt {t.attemptNo}: {t.score !== undefined && t.score !== null ? <strong>{t.score}/{t.maxScore}{t.needsGrading ? ' (grading pending)' : t.isPassed ? ' · passed' : ' · not passed'}</strong> : 'results not released yet'}
                {' '}<button className="text-button" onClick={() => setParams({ attempt: t.id })}>View</button>
            </p>)}
        </div>
        <span className={`status-pill ${a.state.toLowerCase()}`}>{STATE[a.state]}</span>
        {a.state === 'IN_PROGRESS' && <button className="primary solve-button" onClick={() => setParams({ attempt: a.inProgressId })}>Resume</button>}
        {a.state === 'OPEN' && <button className="primary solve-button" onClick={() => start(a)}>{a.attempts.length ? 'Try again' : 'Start'}</button>}
    </article>)}</PaginatedItems>;
}
