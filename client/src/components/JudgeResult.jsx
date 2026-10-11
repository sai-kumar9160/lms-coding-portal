import { useState } from 'react';
import { CheckCircle2, Lock, XCircle } from 'lucide-react';

export const VERDICTS = {
    ACCEPTED: { label: 'Accepted', tone: 'good' },
    PASSED: { label: 'Passed', tone: 'good' },
    WRONG_ANSWER: { label: 'Wrong answer', tone: 'bad' },
    COMPILE_ERROR: { label: 'Compilation error', tone: 'bad' },
    RUNTIME_ERROR: { label: 'Runtime error', tone: 'bad' },
    TIME_LIMIT: { label: 'Time limit exceeded', tone: 'bad' },
};
export const verdictLabel = status => VERDICTS[status]?.label ?? status;

// Sends code to the judge queue, then long-polls until the verdict is ready. onProgress receives QUEUED/RUNNING.
export async function judgeCode(api, startPath, body, resultPath, onProgress) {
    let result = await api(startPath, 'POST', body);
    while (result.jobStatus === 'QUEUED' || result.jobStatus === 'RUNNING') {
        onProgress?.(result.jobStatus);
        result = await api(`${resultPath(result.id)}?wait=1`);
    }
    return result;
}

// HackerRank-style result: headline, test case tabs on the left, input/output of the selected case on the right.
export function JudgeResult({ result }) {
    const [selected, setSelected] = useState(0);
    if (result.jobStatus === 'INTERNAL_ERROR')
        return <div className="code-result"><h3 className="result-title bad">Could not be judged</h3><p className="muted">{result.error || 'The judge had a problem. This was not counted; please try again.'}</p></div>;
    if (result.compileError)
        return <div className="code-result"><h3 className="result-title bad">Compilation error</h3><p className="muted">Check the compiler message below.</p><pre className="code-error">{result.compileError}</pre></div>;
    const custom = result.tests.find(t => t.custom);
    if (custom) {
        const failed = custom.status !== 'PASSED';
        return <div className="code-result">
            <h3 className={`result-title ${failed ? 'bad' : 'good'}`}>{failed ? verdictLabel(custom.status) : 'Ran with your input'}</h3>
            <div className="case-io"><small>Input (stdin)</small><pre>{custom.input || '(no input)'}</pre></div>
            <div className="case-io"><small>Your Output (stdout)</small><pre>{custom.stdout || '(no output)'}</pre></div>
            {custom.stderr && <div className="case-io"><small>Error</small><pre className="code-error">{custom.stderr}</pre></div>}
        </div>;
    }
    const tests = result.tests;
    const passed = tests.filter(t => t.status === 'PASSED').length;
    const all = passed === tests.length;
    const submit = result.kind === 'SUBMIT';
    const headline = submit
        ? (all ? 'Congratulations! You solved this challenge.' : `${passed} / ${tests.length} test cases passed`)
        : (all ? 'Compiled successfully. All sample test cases passed!' : verdictLabel(result.status));
    const current = tests[Math.min(selected, tests.length - 1)];
    return <div className="code-result">
        <h3 className={`result-title ${all ? 'good' : 'bad'}`}>{headline}</h3>
        {submit && <p className="muted">Score <strong>{result.score ?? 0} / {result.maxScore}</strong>. Hidden test cases only show passed or failed.</p>}
        <div className="case-results">
            <div className="case-tabs" role="tablist">{tests.map((t, i) => <button key={i} role="tab" aria-selected={selected === i} className={t.status === 'PASSED' ? 'good' : 'bad'} onClick={() => setSelected(i)}>
                {t.status === 'PASSED' ? <CheckCircle2 size={15}/> : <XCircle size={15}/>}Test case {i}{!t.sample && <Lock size={12}/>}
            </button>)}</div>
            <div className="case-detail">{current && (current.sample ? <>
                {current.status !== 'PASSED' && <p className="case-status bad">{verdictLabel(current.status)}</p>}
                <div className="case-io"><small>Input (stdin)</small><pre>{current.input || '(no input)'}</pre></div>
                <div className="case-io"><small>Your Output (stdout)</small><pre>{current.stdout || '(no output)'}</pre></div>
                <div className="case-io"><small>Expected Output</small><pre>{current.expected}</pre></div>
                {current.stderr && <div className="case-io"><small>Error</small><pre className="code-error">{current.stderr}</pre></div>}
                <p className="muted">Time: {current.timeMs} ms</p>
            </> : <div className="hidden-case"><Lock size={22}/><p><strong>{verdictLabel(current.status)}</strong></p><p className="muted">This is a hidden test case. Its input and output are not shown. Time: {current.timeMs} ms</p></div>)}</div>
        </div>
    </div>;
}
