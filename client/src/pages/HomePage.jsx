import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, Check, ChevronDown, ClipboardCheck, Code2, Handshake, Library, Play, RotateCcw, ShieldCheck, Timer, Trophy, Users, X } from 'lucide-react';
import { PublicShell } from '../components/PublicShell';

const languages = ['Python', 'Java', 'C', 'C++', 'JavaScript'];
const topics = ['React', 'Git & GitHub', 'Docker & CI', 'Arrays & Strings', 'Recursion', 'Sorting & Searching', 'Linked Lists', 'Stacks & Queues', 'Trees & Graphs', 'Dynamic Programming', 'SQL', 'Core Java', 'Python Basics to OOP'];
const facts = [['1,500+', 'practice problems'], ['9', 'practice tracks'], ['6', 'question types'], ['1', 'private space per institute']];
const faqs = [
    ['Who creates the accounts?', 'Students and teachers register themselves with their institute code. A teacher can sign in once the institute admin approves the account. Institute admins and vendors are created by the platform admin; there is no public sign-up for them.'],
    ['Can another institute see our data?', 'No. Every institute has its own space for people, courses, exams and results. The only thing that crosses over is a course an admin deliberately shares with every institute, and that is read-only for others.'],
    ['What can I practise?', 'Nine tracks: Python, C, Java, DSA, SQL, HTML & CSS, React, Git & GitHub and DevOps. DSA problems accept Python, Java, C, C++ or JavaScript; each other track uses its own language, and one appears only when the server has what it needs.'],
    ['How do timed exams work?', 'The server fixes the end time when you start, so refreshing the page does not give you more time. Your answers autosave as you go, and the attempt is submitted for you when time runs out.'],
    ['Do I need to install anything?', 'No. Lessons, the code editor and exams all run in your browser; code is run by the platform\'s judge, not on your computer.'],
];
const loop = [
    { icon: BookOpenCheck, title: 'Learn', text: 'Course chapters written as web pages, with figures, code samples, video lessons and the original PDF notes. Pick up exactly where you stopped.' },
    { icon: Code2, title: 'Practice', text: 'Solve 1,500+ problems in the browser, from Python and SQL to React, Git and DevOps. Run against the sample cases, then submit against hidden ones and see which cases passed.' },
    { icon: Timer, title: 'Prove', text: 'Take timed quizzes and exams set by your teachers. The clock is kept by the server, answers autosave and objective questions are graded for you.' },
];

// A small client-side array: shows why indexing is O(1) and inserting in the middle is not.
function ArrayLab() {
    const [cells, setCells] = useState([12, 7, 31, 4]);
    const [note, setNote] = useState('Access by index is O(1): address = base + index × 4 bytes.');
    const base = 0x1000;
    const push = () => { setCells(c => [...c, Math.floor(Math.random() * 90) + 10].slice(0, 8)); setNote('push() writes to the next free slot: O(1).'); };
    const insert = () => { setCells(c => [c[0], Math.floor(Math.random() * 90) + 10, ...c.slice(1)].slice(0, 8)); setNote(`insert(1) shifted ${cells.length - 1} element(s) to the right: O(n).`); };
    const remove = () => { setCells(c => c.slice(0, -1)); setNote('pop() removes the last slot: O(1).'); };
    const reset = () => { setCells([12, 7, 31, 4]); setNote('Access by index is O(1): address = base + index × 4 bytes.'); };
    return <div className="lp-lab" aria-label="Array simulator">
        <div className="lp-lab-cells">{cells.map((value, i) => <div key={`${i}-${value}`} className="lp-cell" title={`index ${i}`}><small>[{i}]</small><strong>{value}</strong><em>0x{(base + i * 4).toString(16)}</em></div>)}
            {Array.from({ length: 8 - cells.length }, (_, i) => <div key={`e${i}`} className="lp-cell empty"><small>[{cells.length + i}]</small><strong>·</strong><em>free</em></div>)}</div>
        <div className="lp-lab-controls"><button type="button" onClick={push} disabled={cells.length >= 8}>Push</button><button type="button" onClick={insert} disabled={cells.length >= 8}>Insert at 1</button><button type="button" onClick={remove} disabled={!cells.length}>Pop</button><button type="button" className="ghost" onClick={reset}>Reset</button>
            <span>length {cells.length}/8 · word 4B</span></div>
        <p role="status">{note}</p>
    </div>;
}

// The hero: a working copy of the coding judge. Six cases run one after another; the buggy version passes both samples and fails hidden cases.
const judgeCases = [
    { name: 'sample 1', input: '3 9 5' }, { name: 'sample 2', input: '-1 -5 -3' },
    { name: 'hidden 1', input: '4 1 12' }, { name: 'hidden 2', input: '100 200 150' },
    { name: 'hidden 3', input: '7 7 2' }, { name: 'hidden 4', input: '-8 -20 5' },
];
const solutions = {
    correct: { label: 'Correct', code: 'nums = map(int, input().split())\nprint(max(nums))', run: ([a, b, c]) => Math.max(a, b, c) },
    buggy: { label: 'Has a bug', code: 'a, b, c = map(int, input().split())\nprint(max(a, b))', run: ([a, b]) => Math.max(a, b) },
};
const expected = input => Math.max(...input.split(' ').map(Number));

function HeroJudge() {
    const [version, setVersion] = useState('correct');
    const [states, setStates] = useState(() => judgeCases.map(() => 'wait'));
    const [running, setRunning] = useState(false);
    const timers = useRef([]);
    const calm = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const outcome = (which, c) => solutions[which].run(c.input.split(' ').map(Number)) === expected(c.input);
    const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
    const run = which => {
        clear();
        const done = judgeCases.map(c => (outcome(which, c) ? 'pass' : 'fail'));
        if (calm) { setStates(done); setRunning(false); return; }
        setRunning(true);
        setStates(judgeCases.map(() => 'wait'));
        judgeCases.forEach((_, i) => {
            timers.current.push(setTimeout(() => setStates(cur => cur.map((st, k) => (k === i ? 'run' : st))), i * 520 + 160));
            timers.current.push(setTimeout(() => { setStates(cur => cur.map((st, k) => (k === i ? done[i] : st))); if (i === judgeCases.length - 1) setRunning(false); }, i * 520 + 520));
        });
    };
    useEffect(() => { run('correct'); return clear; }, []);
    const pick = which => { setVersion(which); run(which); };
    const finished = states.every(st => st === 'pass' || st === 'fail');
    const passed = states.filter(st => st === 'pass').length;
    const firstFail = judgeCases.findIndex((_, i) => states[i] === 'fail');
    return <div className="lp-judge" id="judge">
        <header><div><strong>Largest of Three</strong><span>Read three integers and print the largest one.</span></div>
            <div className="lp-seg" role="group" aria-label="Choose a solution">{Object.entries(solutions).map(([key, v]) => <button key={key} type="button" className={version === key ? 'on' : ''} aria-pressed={version === key} onClick={() => pick(key)}>{v.label}</button>)}</div></header>
        <div className="lp-judge-body">
            <pre aria-label="Python solution">{solutions[version].code.split('\n').map((line, i) => <span key={i}><i>{i + 1}</i>{line}{'\n'}</span>)}</pre>
            <ol className="lp-cases" aria-live="polite">{judgeCases.map((c, i) => <li key={c.name} className={states[i]}>
                <span className="lp-glyph" aria-hidden>{states[i] === 'pass' ? <Check size={13}/> : states[i] === 'fail' ? <X size={13}/> : null}</span>
                <b>{c.name}</b><code>{c.input}</code><em>{states[i] === 'pass' ? 'passed' : states[i] === 'fail' ? 'wrong' : states[i] === 'run' ? 'running' : 'queued'}</em></li>)}</ol>
        </div>
        <footer className={finished ? (passed === judgeCases.length ? 'good' : 'bad') : ''}>
            <div>{finished ? <><strong>{passed === judgeCases.length ? 'Accepted' : 'Wrong answer'}</strong><span>{passed === judgeCases.length ? `${passed} of ${judgeCases.length} cases passed` : `${passed} of ${judgeCases.length} passed. ${judgeCases[firstFail].name}: expected ${expected(judgeCases[firstFail].input)}, got ${solutions[version].run(judgeCases[firstFail].input.split(' ').map(Number))}`}</span></>
                : <><strong>Judging</strong><span>Running against the samples, then the hidden cases</span></>}</div>
            <button type="button" onClick={() => run(version)} disabled={running}><RotateCcw size={14}/> Run again</button>
        </footer>
    </div>;
}

// One small card under the judge: the course you are in.
function HeroCards() {
    return <div className="lp-hero-cards">
        <article className="lp-course" aria-label="Course preview">
            <small>Course</small>
            <strong>Python Basics to OOP</strong>
            <span>Chapter 8 of 28</span>
            <div className="lp-bar"><i style={{ width: '29%' }}/></div>
            <div className="lp-course-foot"><span>29% complete</span><Link to="/login?mode=register">Resume <ArrowRight size={14}/></Link></div>
        </article>
    </div>;
}

export function HomePage() {
    return <PublicShell>
        <section className="lp-hero"><div className="lp-wrap lp-hero-grid">
            <div className="lp-hero-copy">
                <h1>Practice until the judge says Accepted.</h1>
                <p className="lp-lead">Over 1,500 coding problems judged in your browser, courses you read at your own pace and timed exams your institute runs. Pick a problem, run it, and see exactly which cases failed.</p>
                <div className="lp-cta"><Link to="/login?mode=register" className="lp-btn big">Start learning free <ArrowRight size={18}/></Link><a href="#try" className="lp-btn ghost big"><Play size={16}/> Try the simulator</a></div>
                <ul className="lp-proof"><li>Nothing to install</li><li>Free for students</li><li>Each institute's data stays private</li></ul>
            </div>
            <div className="lp-stage"><HeroJudge/><HeroCards/></div>
        </div>
        <div className="lp-marquee" id="tracks" aria-label="Languages and topics"><div>{[...languages, ...topics, ...languages, ...topics].map((item, i) => <span key={i}>{item}</span>)}</div></div></section>

        <section className="lp-facts" aria-label="At a glance"><div className="lp-wrap">{facts.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>

        <section className="lp-section" id="people"><div className="lp-wrap lp-two lp-photo-row">
            <div><h2>Built for the whole campus.</h2><p className="lp-sub">Students practise, teachers set the work, and the institute keeps it all in one private space.</p>
                <ul className="lp-list"><li><Code2 size={18}/> <span><b>Students</b> read a chapter, solve a problem and take the exam, then see which cases failed.</span></li><li><ClipboardCheck size={18}/> <span><b>Teachers</b> build courses, set timed exams for a branch and read results per student.</span></li><li><ShieldCheck size={18}/> <span><b>Institutes</b> get a private space for people, courses and exams, with a record of every change.</span></li></ul></div>
            <figure className="lp-photo"><img src="/images/students-laptop.jpg" alt="A group of students gathered around a laptop in a lecture hall, working on a problem together" width="1600" height="900" loading="lazy"/>
                <figcaption>Photo by <a href="https://unsplash.com/photos/diverse-group-of-students-gathered-around-laptop-kp7qkHTgSKc" target="_blank" rel="noreferrer">Vitaly Gariev</a> on Unsplash</figcaption></figure>
        </div></section>

        <section className="lp-section" id="students"><div className="lp-wrap">
            <p className="lp-eyebrow">FOR STUDENTS</p><h2>Learn it. Code it. Prove it.</h2><p className="lp-sub">Every course follows the same loop, so you always know what to do next.</p>
            <div className="lp-cards">{loop.map(({ icon: Icon, title, text }, i) => <article key={title}><span className="lp-step">0{i + 1}</span><Icon size={26}/><h3>{title}</h3><p>{text}</p></article>)}</div>
            <div className="lp-two lp-sub-block">
                <div><h3 className="lp-h3">Progress you can see.</h3>
                    <p className="lp-sub">Course bars fill as you finish lessons, solved problems turn green, and each exam shows your best score.</p>
                    <ul className="lp-list"><li><Trophy size={18}/> Solved, attempted and new problems tracked per student</li><li><BookOpenCheck size={18}/> A finished lesson unlocks the next one</li><li><ShieldCheck size={18}/> Your results are visible to your teachers only</li></ul>
                    <div className="lp-cta"><Link to="/students" className="lp-btn">See what students get <ArrowRight size={16}/></Link><Link to="/login?mode=register" className="lp-btn ghost">Create a student account</Link></div></div>
                <div className="lp-rank"><span className="lp-tag gold">YOUR PROGRESS</span><h3>Core Java</h3>
                    {[['Lessons completed', 72], ['Problems solved', 45], ['Exam best score', 88]].map(([label, value]) => <div key={label} className="lp-meter"><span>{label}<b>{value}%</b></span><div className="lp-bar"><i style={{ width: `${value}%` }}/></div></div>)}
                    <p>Illustration. Your own numbers appear on your dashboard after you sign in.</p></div>
            </div>
        </div></section>

        <section className="lp-section alt" id="institutes"><div className="lp-wrap">
            <p className="lp-eyebrow">FOR INSTITUTES</p><h2>Your own campus, kept apart.</h2><p className="lp-sub">Each institute gets a private space with its own people, courses and exams. Nothing crosses to another institute.</p>
            <div className="lp-cards four">{[[Users, 'People & roles', 'Institute admins add teachers and students, approve new teacher sign-ups and assign students to branch groups.'],
                [Library, 'Courses', 'Teachers build courses from lessons, video, PDFs or a whole PDF converted into chapters. Share a course with every institute if you choose.'],
                [ClipboardCheck, 'Exams', 'Question bank, timed windows per branch, auto-grading, manual grading, and results you control when to publish.'],
                [ShieldCheck, 'Audit trail', 'Every change is recorded with who made it, so the platform admin can always answer “what happened and when”.']].map(([Icon, title, text]) =>
                <article key={title}><Icon size={24}/><h3>{title}</h3><p>{text}</p></article>)}</div>
            <div className="lp-cta"><Link to="/institutes" className="lp-btn">See what institutes get <ArrowRight size={16}/></Link><Link to="/login" className="lp-btn ghost">Institute sign in</Link></div>
        </div></section>

        <section className="lp-section" id="vendors"><div className="lp-wrap lp-two">
            <div><p className="lp-eyebrow">FOR VENDORS</p><h2>Publish once. Every institute can use it.</h2>
                <p className="lp-sub">Content partners get a login from the platform admin. They add coding problems with test cases and a reference solution; a problem goes live only after the reference solution passes every case.</p>
                <ul className="lp-list"><li><Handshake size={18}/> Accounts are created by the platform admin; there is no public sign-up</li><li><Code2 size={18}/> A focused workspace for the shared coding problem library</li><li><ShieldCheck size={18}/> You manage your own problems; other vendors never see your drafts</li></ul>
                <Link to="/login?as=vendor" className="lp-textlink">Vendor sign in <ArrowRight size={16}/></Link></div>
            <div className="lp-rank"><span className="lp-tag gold">VENDOR WORKSPACE</span><h3>Coding problems</h3>
                {[['two-sum', 'Published'], ['reverse-words', 'Draft'], ['matrix-spiral', 'Validating']].map(([name, state]) => <div key={name} className="lp-row"><code>{name}</code><span className={state === 'Published' ? 'ok' : ''}>{state}</span></div>)}
                <p>Illustration of the library view.</p></div>
        </div></section>

        <section className="lp-section alt" id="try"><div className="lp-wrap lp-two">
            <div><p className="lp-eyebrow">TRY IT HERE</p><h2>Poke at memory.</h2><p className="lp-sub">Push, insert and pop on a tiny array and watch the addresses. The full courses explain the why, then let you code it.</p>
                <Link to="/login?mode=register" className="lp-textlink">Start the full course <ArrowRight size={16}/></Link></div>
            <ArrayLab/>
        </div></section>

        <section className="lp-section" id="faq"><div className="lp-wrap lp-faq">
            <div><p className="lp-eyebrow">QUESTIONS</p><h2>Good to know.</h2><p className="lp-sub">Short answers to what students, teachers and institutes ask first.</p></div>
            <div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18}/></summary><p>{answer}</p></details>)}</div>
        </div></section>

        <section className="lp-section" id="about"><div className="lp-wrap lp-about">
            <div><p className="lp-eyebrow">ABOUT</p><h2>Code daily. Grow endlessly.</h2></div>
            <p className="lp-sub">NextByte is a coding platform: courses to read, problems to solve and exams to take, with the tools teachers and admins need to run them. It grows one byte at a time.</p>
            <div className="lp-cta"><Link to="/login?mode=register" className="lp-btn big">Create a free account <ArrowRight size={18}/></Link><Link to="/login" className="lp-btn ghost big">Log in</Link></div>
        </div></section>
    </PublicShell>;
}
