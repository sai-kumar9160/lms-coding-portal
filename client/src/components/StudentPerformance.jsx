import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BookOpenCheck, ClipboardCheck, Code2, History, Search, TrendingDown, TrendingUp, Trophy, X } from 'lucide-react';
import { verdictLabel } from './JudgeResult';
import { PaginatedTable } from './Pagination';
import { useWorkspace } from '../workspace';

const ordinal = n => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)]}`;

function Bar({ value }) {
    return <span className="perf-bar"><i style={{ width: `${Math.min(100, value)}%` }}/></span>;
}

// Monthly progress: stacked bars of points earned each month (problems and lessons) with this month compared to last.
function MonthlyProgress({ months }) {
    const top = Math.max(10, ...months.map(m => m.points));
    const now = months[months.length - 1];
    const before = months[months.length - 2];
    const delta = before ? now.points - before.points : 0;
    return <article className="perf-panel monthly">
        <div className="monthly-head">
            <h3><TrendingUp size={16}/> Monthly progress</h3>
            <span className={`monthly-delta ${delta < 0 ? 'down' : 'up'}`}>{delta < 0 ? <TrendingDown size={14}/> : <TrendingUp size={14}/>}{delta >= 0 ? '+' : ''}{delta} points vs last month</span>
        </div>
        <div className="monthly-stats">
            <div><strong>{now.problems}</strong><small>problems solved this month</small></div>
            <div><strong>{now.lessons}</strong><small>lessons completed</small></div>
            <div><strong>{now.assessmentAverage === null ? '-' : `${now.assessmentAverage}%`}</strong><small>assessment average</small></div>
            <div><strong>{now.points}</strong><small>points earned</small></div>
        </div>
        <div className="monthly-chart" role="img" aria-label="Points earned in each of the last six months">
            {months.map(m => <div key={m.month} className={`monthly-col${m === now ? ' now' : ''}`} title={`${m.label}: ${m.problems} problems, ${m.lessons} lessons, ${m.points} points`}>
                <em>{m.points}</em>
                <div className="monthly-bar" style={{ height: `${(m.points / top) * 100}%` }}>
                    <i className="lessons" style={{ flexGrow: m.lessons * 5 }}/><i className="problems" style={{ flexGrow: m.problems * 10 }}/>
                </div>
                <span>{m.label}</span>
            </div>)}
        </div>
        <div className="monthly-legend"><span><i className="problems"/>Problems solved</span><span><i className="lessons"/>Lessons completed</span></div>
    </article>;
}

const when = value => value ? new Date(value).toLocaleDateString([], { dateStyle: 'medium' }) : '-';

// The list behind a card: what was solved, completed or taken, newest first.
function CardDetails({ kind, details, onClose }) {
    const [query, setQuery] = useState('');
    const all = details[kind];
    const q = query.trim().toLowerCase();
    const rows = q ? all.filter(r => [r.title, r.track, r.course, r.difficulty].filter(Boolean).join(' ').toLowerCase().includes(q)) : all;
    const meta = {
        problems: { title: 'Coding problems solved', empty: 'No problems solved yet. Solve one in Coding Practice and it will be listed here.', head: ['#', 'Problem', 'Track', 'Difficulty', 'Solved on'] },
        lessons: { title: 'Lessons completed', empty: 'No lessons completed yet.', head: ['#', 'Lesson', 'Course', 'Completed on'] },
        assessments: { title: 'Assessments taken', empty: 'No assessments taken yet.', head: ['#', 'Assessment', 'Score', 'Result', 'Taken on'] },
    }[kind];
    return <article className="perf-panel perf-details">
        <div className="monthly-head"><h3>{meta.title} <span className="muted">({all.length})</span></h3>
            <div className="perf-tools">
                <label className="perf-search"><Search size={15}/><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." aria-label={`Search ${meta.title.toLowerCase()}`}/></label>
                <button type="button" className="text-button" aria-label="Close" onClick={onClose}><X size={18}/></button>
            </div>
        </div>
        {rows.length === 0 ? <p className="muted perf-empty">{all.length ? `Nothing matches "${query}".` : meta.empty}</p> : <PaginatedTable className="drill-table">
            <thead><tr>{meta.head.map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, n) => <tr key={`${kind}-${r.id}`}>
                <td className="drill-num">{n + 1}</td>
                <td><strong>{r.title}</strong></td>
                {kind === 'problems' && <><td>{r.track}</td><td><span className={`drill-status ${r.difficulty === 'EASY' ? 'on' : ''}`}>{r.difficulty[0] + r.difficulty.slice(1).toLowerCase()}</span></td></>}
                {kind === 'lessons' && <td>{r.course}</td>}
                {kind === 'assessments' && <><td>{r.score} / {r.maxScore}</td><td>{r.needsGrading ? <span className="drill-status">Awaiting grading</span> : <span className="drill-status on">{r.maxScore ? Math.round((r.score / r.maxScore) * 100) : 0}%</span>}</td></>}
                <td>{when(r.doneAt)}</td>
            </tr>)}</tbody>
        </PaginatedTable>}
    </article>;
}

// The student's overview: rank in the college, points, and how they are doing in coding, lessons and assessments.
export function StudentPerformance() {
    const { api } = useWorkspace();
    const [data, setData] = useState(null);
    const [recent, setRecent] = useState([]);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(null);
    const toggle = kind => setOpen(current => current === kind ? null : kind);
    useEffect(() => {
        api('/me/performance').then(setData, loadError => setError(loadError.message));
        api('/coding/submissions').then(rows => setRecent(rows.filter(r => r.status).slice(0, 5)), () => {});
    }, []);
    if (error) return <div className="alert">{error}</div>;
    if (!data) return <div className="perf-loading muted">Loading your performance...</div>;
    const { breakdown: b } = data;
    const top = data.totalStudents > 1 ? Math.max(1, Math.round((data.rank / data.totalStudents) * 100)) : null;
    return <section className="perf">
        <div className="perf-hero">
            <div className="perf-rank"><Trophy size={22}/><div><small>Your rank in the college</small><strong>#{data.rank}<span> of {data.totalStudents} student{data.totalStudents === 1 ? '' : 's'}</span></strong></div></div>
            <div className="perf-points"><small>Total points</small><strong>{data.points}</strong></div>
            <p className="perf-note">{data.totalStudents === 1 ? 'You are the first student on the board. Keep solving to stay ahead as others join.'
                : <>You are ahead of <b>{data.aheadOfPercent}%</b> of your classmates{top ? <> (top <b>{top}%</b>)</> : null}.</>}</p>
        </div>
        <div className="perf-grid">
            <button type="button" className={`perf-card${open === 'problems' ? ' open' : ''}`} aria-expanded={open === 'problems'} onClick={() => toggle('problems')}><span className="perf-icon"><Code2 size={20}/></span><small>Coding problems solved</small><strong>{b.problems.solved}<span> / {b.problems.total}</span></strong><Bar value={b.problems.percent}/><em>{b.problems.percent}% done · {b.problems.points} points</em></button>
            <button type="button" className={`perf-card${open === 'lessons' ? ' open' : ''}`} aria-expanded={open === 'lessons'} onClick={() => toggle('lessons')}><span className="perf-icon"><BookOpenCheck size={20}/></span><small>Lessons completed</small><strong>{b.lessons.completed}<span> / {b.lessons.total}</span></strong><Bar value={b.lessons.percent}/><em>{b.lessons.percent}% done · {b.lessons.points} points</em></button>
            <button type="button" className={`perf-card${open === 'assessments' ? ' open' : ''}`} aria-expanded={open === 'assessments'} onClick={() => toggle('assessments')}><span className="perf-icon"><ClipboardCheck size={20}/></span><small>Assessment average</small><strong>{b.assessments.averagePercent}<span>%</span></strong><Bar value={b.assessments.averagePercent}/><em>{b.assessments.taken} assessment{b.assessments.taken === 1 ? '' : 's'} taken · {b.assessments.points} points</em></button>
        </div>
        {open && data.details && <CardDetails kind={open} details={data.details} onClose={() => setOpen(null)}/>}
        {data.monthly && <MonthlyProgress months={data.monthly}/>}
        <div className="perf-columns">
            <article className="perf-panel"><h3><Award size={16}/> Leaderboard</h3>
                <ol className="perf-board">{data.leaderboard.map(row => <li key={`${row.rank}-${row.name}`} className={row.isMe ? 'me' : ''}><b>#{row.rank}</b><span>{row.name}{row.isMe ? ' (you)' : ''}</span><em>{row.points} pts</em></li>)}</ol>
                {data.rank > data.leaderboard.length && <p className="muted perf-you">You are {ordinal(data.rank)} with {data.points} points.</p>}
                <p className="muted perf-rule">Points: {data.pointsRule.problem} per problem solved, {data.pointsRule.lesson} per lesson completed, plus your assessment average.</p>
            </article>
            <article className="perf-panel"><h3><Code2 size={16}/> Where you are strongest</h3>
                {data.tracks.length ? <ul className="perf-tracks">{data.tracks.map(t => <li key={t.track}><span>{t.track}</span><Bar value={(t.solved / t.total) * 100}/><em>{t.solved} / {t.total}</em></li>)}</ul>
                    : <p className="muted">Solve your first coding problem and your best languages will show up here.</p>}
            </article>
        </div>
        <article className="perf-panel"><h3><History size={16}/> Recent activity</h3>
            {recent.length ? <ul className="perf-recent">{recent.map(r => <li key={r.id}><span><b>{r.problem?.title ?? 'Problem'}</b><small>{new Date(r.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · {r.language}</small></span>
                <em className={r.status === 'ACCEPTED' ? 'good' : 'bad'}>{verdictLabel(r.status)}</em><small>{r.passedCount}/{r.totalCount} tests</small></li>)}</ul>
                : <p className="muted">Nothing yet. Your submissions will show up here.</p>}
            <Link to="/coding" className="perf-cta">Go to coding practice <ArrowRight size={15}/></Link>
        </article>
    </section>;
}
