import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, ChevronDown, ClipboardCheck, Code2, Handshake, Library, Play, Search, ShieldCheck, Timer, Trophy, Users } from 'lucide-react';
import { PublicShell } from '../components/PublicShell';

const languages = ['Python', 'Java', 'C', 'C++', 'JavaScript'];
const topics = ['React', 'Git & GitHub', 'Docker & CI', 'Arrays & Strings', 'Recursion', 'Sorting & Searching', 'Linked Lists', 'Stacks & Queues', 'Trees & Graphs', 'Dynamic Programming', 'SQL', 'Core Java', 'Python Basics to OOP'];
const facts = [['120+', 'practice problems'], ['9', 'practice tracks'], ['6', 'question types'], ['1', 'private space per institute']];
const faqs = [
    ['Who creates the accounts?', 'Students and teachers register themselves with their institute code. A teacher can sign in once the institute admin approves the account. Institute admins and vendors are created by the platform admin; there is no public sign-up for them.'],
    ['Can another institute see our data?', 'No. Every institute has its own space for people, courses, exams and results. The only thing that crosses over is a course an admin deliberately shares with every institute, and that is read-only for others.'],
    ['What can I practise?', 'Nine tracks: Python, C, Java, DSA, SQL, HTML & CSS, React, Git & GitHub and DevOps. DSA problems accept Python, Java, C, C++ or JavaScript; each other track uses its own language, and one appears only when the server has what it needs.'],
    ['How do timed exams work?', 'The server fixes the end time when you start, so refreshing the page does not give you more time. Your answers autosave as you go, and the attempt is submitted for you when time runs out.'],
    ['Do I need to install anything?', 'No. Lessons, the code editor and exams all run in your browser; code is run by the platform\'s judge, not on your computer.'],
];
const loop = [
    { icon: BookOpenCheck, title: 'Learn', text: 'Course chapters written as web pages, with figures, code samples, video lessons and the original PDF notes. Pick up exactly where you stopped.' },
    { icon: Code2, title: 'Practice', text: 'Solve 120+ problems in the browser, from Python and SQL to React, Git and DevOps. Run against the sample cases, then submit against hidden ones and see which cases passed.' },
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

// The product window in the hero: four tabs, each showing a different part of the platform.
const windowTabs = [
    { label: '1. Course', file: 'python-basics/chapter-8.md', tag: 'LESSON', note: 'Chapters are web pages with figures and code, plus the original PDF notes.',
      code: `## 8. Functions\n\nA function packages a task so you\ncan reuse it:\n\n  def area(r):\n      return 3.14159 * r * r\n\n  print(area(5))   # 78.53975`,
      out: ['Lesson 8 of 28', 'Prerequisite met', 'Video + PDF attached', '✓ Mark complete'] },
    { label: '2. Code', file: 'practice/two-sum.py', tag: 'PRACTICE', note: 'Write, run against the samples, then submit against hidden cases.',
      code: `def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return seen[target - n], i\n        seen[n] = i`,
      out: ['$ run --all', 'sample 1  PASSED', 'sample 2  PASSED', 'hidden 1–5  5/5 PASSED', '✓ Accepted · 18 ms'] },
    { label: '3. Exam', file: 'exams/midterm-java.exam', tag: 'TIMED EXAM', note: 'The server keeps the clock; answers autosave as you go.',
      code: `Q4 (2 marks)\nWhich keyword prevents a method\nfrom being overridden?\n\n  ( ) static\n  (x) final\n  ( ) abstract\n  ( ) const`,
      out: ['Time left  24:10', 'Answered  4 / 10', 'Autosaved just now', '→ Next question'] },
    { label: '4. Results', file: 'results/summary', tag: 'RESULTS', note: 'Teachers and admins see scores per student, branch and exam.',
      code: `Exam         Score   Result\nQuiz 1       8 / 10  Passed\nMidterm      31 / 40 Passed\nAssignment 2 pending grading`,
      out: ['Best score  31 / 40', 'Pass mark   40%', 'Branch rank  top 20%', '✓ Results published'] },
];
function ProductWindow() {
    const [active, setActive] = useState(1);
    const tab = windowTabs[active];
    return <div className="lp-window">
        <div className="lp-window-bar"><i/><i/><i/><span>nextbyte :: {tab.file}</span></div>
        <div className="lp-tabs" role="tablist">{windowTabs.map((item, i) => <button key={item.label} type="button" role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => setActive(i)}>{item.label}</button>)}</div>
        <div className="lp-window-meta"><b>{tab.tag}</b><span>{tab.note}</span></div>
        <div className="lp-window-body"><pre key={`code-${active}`}>{tab.code}</pre><div className="lp-term" key={`out-${active}`}>{tab.out.map((line, i) => <span key={line} className={i === 0 ? 'first' : i === tab.out.length - 1 ? 'last' : ''}>{line}</span>)}</div></div>
        <div className="lp-status"><span>main*</span><span>UTF-8</span><span>Judge ready</span><span>Autosaved</span></div>
    </div>;
}

export function HomePage() {
    return <PublicShell>
        <section className="lp-hero"><div className="lp-wrap lp-hero-grid">
            <div>
                <p className="lp-pill"><b>NEW</b> Timed exams &amp; the coding judge are live</p>
                <h1>Write real code. <em>Build real skill.</em></h1>
                <p className="lp-lead">Courses to read, a browser coding judge with 120+ problems and timed exams, all in one place. Learn at your own pace, practise a little every day and prove what you can do.</p>
                <div className="lp-cta"><Link to="/login?mode=register" className="lp-btn big">Start learning free <ArrowRight size={18}/></Link><a href="#try" className="lp-btn ghost big"><Play size={16}/> Try the simulator</a></div>
                <form className="lp-search" role="search" onSubmit={event => event.preventDefault()}><Search size={16}/><input aria-label="Search" placeholder="Search lectures, problems, quizzes… (sign in to search)" disabled/></form>
                <ul className="lp-chips">{topics.slice(0, 3).map(topic => <li key={topic}>{topic}</li>)}</ul>
            </div>
            <div className="lp-mock">
                <ProductWindow/>
                <div className="lp-float"><span className="lp-tag">COURSE</span><strong>Python Basics to OOP</strong><small>Chapter 8 of 28</small><div className="lp-bar"><i style={{ width: '29%' }}/></div><div className="lp-float-foot"><span>29% complete</span><span>Resume →</span></div></div>
            </div>
        </div>
        <div className="lp-marquee" id="tracks" aria-label="Languages and topics"><div>{[...languages, ...topics, ...languages, ...topics].map((item, i) => <span key={i}>{item}</span>)}</div></div></section>

        <section className="lp-facts" aria-label="At a glance"><div className="lp-wrap">{facts.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>

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
