import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock, XCircle } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { CodingWorkbench, ProblemStatement } from '../pages/CodingPage';
import { VERDICTS, verdictLabel } from './JudgeResult';

const pad = n => String(n).padStart(2, '0');
function clock(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600);
    return `${h ? `${h}:` : ''}${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}
const answered = a => a && (a.optionId || a.optionIds?.length || (a.value !== undefined && a.value !== null) || a.text?.trim() || a.submissionId);

// The answer input for one question. Choice answers save at once; typed answers save after a short pause.
function AnswerInput({ question, value, onChange, disabled }) {
    const name = `q-${question.id}`;
    if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'TRUE_FALSE')
        return <div className="answer-options">{question.options.map(o => <label key={o.id} className={`answer-option${value?.optionId === o.id ? ' chosen' : ''}`}>
            <input type="radio" name={name} disabled={disabled} checked={value?.optionId === o.id} onChange={() => onChange({ optionId: o.id })}/>{o.text}
        </label>)}</div>;
    if (question.questionType === 'MULTIPLE_CHOICE') {
        const chosen = new Set(value?.optionIds ?? []);
        return <div className="answer-options"><p className="muted">Select all that apply.</p>{question.options.map(o => <label key={o.id} className={`answer-option${chosen.has(o.id) ? ' chosen' : ''}`}>
            <input type="checkbox" disabled={disabled} checked={chosen.has(o.id)} onChange={event => {
                const next = new Set(chosen);
                event.target.checked ? next.add(o.id) : next.delete(o.id);
                onChange(next.size ? { optionIds: [...next] } : null, false);
            }}/>{o.text}
        </label>)}</div>;
    }
    if (question.questionType === 'NUMERIC')
        return <input className="answer-number" type="number" step="any" disabled={disabled} value={value?.value ?? ''} placeholder="Your answer"
            onChange={event => onChange(event.target.value === '' ? null : { value: Number(event.target.value) }, true)}/>;
    return <textarea className="answer-text" rows={6} disabled={disabled} value={value?.text ?? ''} placeholder="Type your answer" onChange={event => onChange(event.target.value ? { text: event.target.value } : null, true)}/>;
}

// A coding question: the problem, the editor with Run/Submit, and this attempt's submissions (best counts).
function CodingQuestion({ attemptId, question, onSubmitted }) {
    const subs = question.codeSubmissions ?? [];
    const best = subs.filter(s => s.jobStatus === 'DONE').reduce((b, s) => (!b || (s.score ?? 0) / (s.maxScore || 1) > (b.score ?? 0) / (b.maxScore || 1) ? s : b), null);
    return <div className="exam-coding">
        <div className="exam-coding-statement panel">
            <h3>{question.coding.title}</h3>
            <ProblemStatement problem={question.coding}/>
            {subs.length > 0 && <div className="exam-code-subs">
                <small className="eyebrow">YOUR SUBMISSIONS ({subs.length}/20)</small>
                {best && <p>Best so far: <strong>{best.score} / {best.maxScore}</strong> ({best.passedCount}/{best.totalCount} test cases)</p>}
                <ul>{subs.map(s => <li key={s.id}>{new Date(s.createdAt).toLocaleTimeString()} · {s.language} · {s.jobStatus === 'DONE' ? <span className={`code-status ${VERDICTS[s.status]?.tone ?? ''}`}>{verdictLabel(s.status)} {s.score}/{s.maxScore}</span> : <span className="code-status">{s.jobStatus === 'INTERNAL_ERROR' ? 'Not judged' : 'Judging...'}</span>}</li>)}</ul>
            </div>}
        </div>
        <CodingWorkbench problem={question.coding} draftPrefix={`lms-exam:${attemptId}:${question.id}`}
            runPath={`/attempts/${attemptId}/questions/${question.id}/run`} submitPath={`/attempts/${attemptId}/questions/${question.id}/code`}
            resultPath={id => `/attempts/${attemptId}/code/${id}`} onSubmitted={() => onSubmitted(question.id)}/>
    </div>;
}

// Score banner and, when results are visible, each question with the correct answer and explanation.
function Results({ attempt }) {
    return <>
        {attempt.result ? <div className={`result-banner ${attempt.result.needsGrading ? 'pending' : attempt.result.isPassed ? 'good' : 'bad'}`}>
            <strong>{attempt.result.score} / {attempt.result.maxScore}</strong>
            <span>{attempt.result.needsGrading ? 'Some answers are waiting for your teacher to grade them.' : attempt.result.isPassed ? `Passed (pass mark ${attempt.assessment.passPct}%)` : `Not passed (pass mark ${attempt.assessment.passPct}%)`}</span>
        </div> : <div className="result-banner pending"><strong>Submitted</strong><span>Your results will be shown when your teacher releases them.</span></div>}
        {attempt.result && attempt.questions.map((q, i) => <div key={q.id} className="review-question">
            <p><strong>{i + 1}. {q.stem}</strong> <span className="muted">{q.marksAwarded ?? '?'} / {q.points}</span></p>
            {q.options.length > 0 && <ul className="review-options">{q.options.map(o => {
                const mine = q.answer?.optionId === o.id || q.answer?.optionIds?.includes(o.id);
                return <li key={o.id} className={o.isCorrect ? 'correct' : mine ? 'wrong' : ''}>{o.isCorrect ? <CheckCircle2 size={14}/> : mine ? <XCircle size={14}/> : <span className="dot"/>}{o.text}{mine && <small> (your answer)</small>}</li>;
            })}</ul>}
            {q.questionType === 'CODING' && <>
                {q.answer?.code ? <><p>Your last submitted code ({q.answer.language}):</p><pre className="review-code">{q.answer.code}</pre></> : <p><em className="muted">No code submitted</em></p>}
                <p className="muted">Marks come from your best judged submission.</p>
            </>}
            {!q.options.length && q.questionType !== 'CODING' && <>
                <p>Your answer: {q.answer ? (q.answer.value ?? q.answer.text) : <em className="muted">Not answered</em>}</p>
                {q.answerKey && <p className="muted">Correct answer: {q.questionType === 'NUMERIC' ? q.answerKey.value : (q.answerKey.accepted?.join(' / ') || 'graded by your teacher')}</p>}
            </>}
            {q.feedback && <p className="feedback">Teacher: {q.feedback}</p>}
            {q.explanation && <p className="explanation">{q.explanation}</p>}
        </div>)}
    </>;
}

export function ExamPlayer({ attemptId, onExit }) {
    const { api } = useWorkspace();
    const [attempt, setAttempt] = useState(null);
    const [answers, setAnswers] = useState({});
    const [current, setCurrent] = useState(0);
    const [saveState, setSaveState] = useState('');
    const [error, setError] = useState('');
    const [now, setNow] = useState(Date.now());
    const offset = useRef(0);
    const timers = useRef({});
    const submitting = useRef(false);
    const examRoot = useRef(null);
    const [fullscreenReady, setFullscreenReady] = useState(false);
    const [fullscreenError, setFullscreenError] = useState('');
    const [ending, setEnding] = useState(false);

    function show(data) {
        offset.current = new Date(data.serverNow).getTime() - Date.now();
        setAttempt(data);
        setAnswers(Object.fromEntries(data.questions.map(q => [q.id, q.answer])));
    }
    useEffect(() => { api(`/attempts/${attemptId}`).then(show, e => setError(e.message)); }, [attemptId]);
    // After a coding submission: refresh that question's answer and submissions without touching unsaved answers.
    async function refreshQuestion(questionId) {
        try {
            const data = await api(`/attempts/${attemptId}`);
            if (data.status !== 'IN_PROGRESS') return show(data);
            setAttempt(data);
            setAnswers(current => ({ ...current, [questionId]: data.questions.find(q => q.id === questionId)?.answer ?? null }));
        }
        catch (refreshError) { setError(refreshError.message); }
    }
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
    const running = attempt?.status === 'IN_PROGRESS';
    useEffect(() => {
        if (!running || fullscreenReady) return;
        const gate = examRoot.current?.querySelector('.exam-fullscreen-gate');
        gate?.querySelector('button')?.focus();
        const trapFocus = event => {
            if (event.key !== 'Tab') return;
            const buttons = [...(gate?.querySelectorAll('button:not(:disabled)') ?? [])];
            if (!buttons.length) { event.preventDefault(); return; }
            const first = buttons[0], last = buttons[buttons.length - 1];
            if (event.shiftKey && (document.activeElement === first || !gate.contains(document.activeElement))) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !gate.contains(document.activeElement))) {
                event.preventDefault(); first.focus();
            }
        };
        document.addEventListener('keydown', trapFocus);
        return () => document.removeEventListener('keydown', trapFocus);
    }, [running, fullscreenReady]);
    useEffect(() => {
        if (!running) {
            setFullscreenReady(false);
            if (document.fullscreenElement === examRoot.current) document.exitFullscreen().catch(() => {});
            return;
        }
        const changed = () => {
            if (document.fullscreenElement !== examRoot.current) setFullscreenReady(false);
        };
        const hidden = () => { if (document.hidden) setFullscreenReady(false); };
        const beforeUnload = event => { event.preventDefault(); event.returnValue = ''; };
        document.addEventListener('fullscreenchange', changed);
        document.addEventListener('visibilitychange', hidden);
        window.addEventListener('beforeunload', beforeUnload);
        return () => {
            document.removeEventListener('fullscreenchange', changed);
            document.removeEventListener('visibilitychange', hidden);
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [running]);
    useEffect(() => {
        const root = examRoot.current;
        return () => {
            Object.values(timers.current).forEach(clearTimeout);
            if (root && document.fullscreenElement === root) document.exitFullscreen().catch(() => {});
        };
    }, [attempt?.id]);
    async function enterFullscreen() {
        setFullscreenError('');
        try {
            if (!examRoot.current?.requestFullscreen) throw new Error('Use a desktop browser that supports fullscreen to take this exam.');
            if (document.fullscreenElement !== examRoot.current) await examRoot.current.requestFullscreen();
            setFullscreenReady(true);
        } catch (error) {
            setFullscreenError(error.message || 'Fullscreen was blocked. Allow fullscreen and try again.');
        }
    }
    const remaining = attempt ? new Date(attempt.expiresAt).getTime() - (now + offset.current) : 0;
    useEffect(() => { if (running && remaining <= 0) submit(true); }, [running, remaining <= 0]);

    async function save(questionId, value) {
        setSaveState('Saving...');
        try { await api(`/attempts/${attemptId}/answers/${questionId}`, 'PUT', { answer: value }); setSaveState('All answers saved'); }
        catch (saveError) { setSaveState(''); setError(saveError.message); if (/Time is up/.test(saveError.message)) api(`/attempts/${attemptId}`).then(show); }
    }
    function change(questionId, value, delayed) {
        setAnswers(current => ({ ...current, [questionId]: value }));
        clearTimeout(timers.current[questionId]);
        if (delayed) timers.current[questionId] = setTimeout(() => save(questionId, value), 700);
        else save(questionId, value);
    }
    async function submit(auto = false) {
        if (submitting.current) return;
        if (!auto) {
            const left = attempt.questions.filter(q => !answered(answers[q.id])).length;
            if (!window.confirm(left ? `${left} question(s) are not answered. Submit anyway?` : 'Submit your answers? You cannot change them afterwards.')) return;
        }
        submitting.current = true;
        setEnding(true);
        // Flush answers still waiting for their typing pause.
        await Promise.all(Object.entries(timers.current).map(([questionId, t]) => { clearTimeout(t); return auto ? null : save(questionId, answers[questionId]); }));
        timers.current = {};
        try { show(await api(`/attempts/${attemptId}/submit`, 'POST')); }
        catch (submitError) { setError(submitError.message); }
        finally { submitting.current = false; setEnding(false); }
    }

    if (!attempt) return error ? <div role="alert" className="alert">{error}</div> : <div className="loading">Loading...</div>;
    const question = attempt.questions[current];
    const blocked = running && !fullscreenReady;
    return <section ref={examRoot} className="panel exam">
        {blocked && <div className="exam-fullscreen-gate" role="dialog" aria-modal="true" aria-labelledby="fullscreen-title">
            <div className="exam-fullscreen-card">
                <small className="eyebrow">ASSESSMENT</small>
                <h2 id="fullscreen-title">Fullscreen required</h2>
                <p>Continue in fullscreen to answer questions. Leaving fullscreen or switching tabs locks the exam view until you return. Your exam timer keeps running.</p>
                <p className="muted">To finish, choose End exam and submit. Browser and system shortcuts can still leave fullscreen.</p>
                {fullscreenError && <p role="alert" className="alert">{fullscreenError}</p>}
                {error && <p role="alert" className="alert">{error}</p>}
                <div className="row-actions">
                    <button className="primary" disabled={ending} onClick={enterFullscreen}>Enter fullscreen / Continue</button>
                    <button className="secondary" disabled={ending} onClick={() => submit(false)}>{ending ? 'Submitting...' : 'End exam and submit'}</button>
                </div>
            </div>
        </div>}
        <div inert={blocked || ending ? true : undefined} aria-hidden={blocked ? true : undefined}>
        <div className="exam-head">
            {running ? <button className="secondary" disabled={ending} onClick={() => submit(false)}>End exam and submit</button> : <button className="text-button" onClick={onExit}><ArrowLeft size={14}/>Back to assessments</button>}
            <h2>{attempt.assessment.title}</h2>
            {running && <span className={`exam-timer${remaining < 60000 ? ' urgent' : ''}`}><Clock size={16}/>{attempt.assessment.durationMin || remaining < 86400000 ? clock(remaining) : `until ${new Date(attempt.expiresAt).toLocaleString()}`}</span>}
        </div>
        {error && <div role="alert" className="alert">{error}</div>}
        {!running ? <Results attempt={attempt}/> : <div className={`exam-body${question.questionType === 'CODING' ? ' coding' : ''}`}>
            <aside className="exam-nav">
                <small className="eyebrow">QUESTIONS</small>
                <div className="exam-grid">{attempt.questions.map((q, i) => <button key={q.id} className={`${i === current ? 'current' : ''} ${answered(answers[q.id]) ? 'done' : ''}`} onClick={() => setCurrent(i)}>{i + 1}</button>)}</div>
                <p className="muted">{attempt.questions.filter(q => answered(answers[q.id])).length} of {attempt.questions.length} answered</p>
                <p className="muted save-state">{saveState}</p>
                <button className="primary full" onClick={() => submit(false)}>Submit</button>
            </aside>
            <div className="exam-question">
                {current === 0 && attempt.assessment.instructions && <div className="exam-instructions">{attempt.assessment.instructions}</div>}
                <p className="muted">Question {current + 1} of {attempt.questions.length} · {question.points} mark{question.points === 1 ? '' : 's'}</p>
                <h3>{question.stem}</h3>
                {question.questionType === 'CODING'
                    ? <CodingQuestion key={question.id} attemptId={attemptId} question={question} onSubmitted={refreshQuestion}/>
                    : <AnswerInput key={question.id} question={question} value={answers[question.id]} onChange={(value, delayed) => change(question.id, value, delayed)}/>}
                <div className="exam-move">
                    <button className="secondary" disabled={current === 0} onClick={() => setCurrent(current - 1)}><ChevronLeft size={15}/>Previous</button>
                    {current < attempt.questions.length - 1 ? <button className="secondary" onClick={() => setCurrent(current + 1)}>Next<ChevronRight size={15}/></button> : <button className="primary" onClick={() => submit(false)}>Submit</button>}
                </div>
            </div>
        </div>}
        </div>
    </section>;
}
