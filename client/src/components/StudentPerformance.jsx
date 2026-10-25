import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BookOpenCheck, ClipboardCheck, Code2, History, Trophy } from 'lucide-react';
import { verdictLabel } from './JudgeResult';
import { useWorkspace } from '../workspace';

const ordinal = n => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)]}`;

function Bar({ value }) {
    return <span className="perf-bar"><i style={{ width: `${Math.min(100, value)}%` }}/></span>;
}

// The student's overview: rank in the college, points, and how they are doing in coding, lessons and assessments.
export function StudentPerformance() {
    const { api } = useWorkspace();
    const [data, setData] = useState(null);
    const [recent, setRecent] = useState([]);
    const [error, setError] = useState('');
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
            <article className="perf-card"><span className="perf-icon"><Code2 size={20}/></span><small>Coding problems solved</small><strong>{b.problems.solved}<span> / {b.problems.total}</span></strong><Bar value={b.problems.percent}/><em>{b.problems.percent}% done · {b.problems.points} points</em></article>
            <article className="perf-card"><span className="perf-icon"><BookOpenCheck size={20}/></span><small>Lessons completed</small><strong>{b.lessons.completed}<span> / {b.lessons.total}</span></strong><Bar value={b.lessons.percent}/><em>{b.lessons.percent}% done · {b.lessons.points} points</em></article>
            <article className="perf-card"><span className="perf-icon"><ClipboardCheck size={20}/></span><small>Assessment average</small><strong>{b.assessments.averagePercent}<span>%</span></strong><Bar value={b.assessments.averagePercent}/><em>{b.assessments.taken} assessment{b.assessments.taken === 1 ? '' : 's'} taken · {b.assessments.points} points</em></article>
        </div>
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
