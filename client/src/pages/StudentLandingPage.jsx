import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, ChevronDown, ClipboardCheck, Clock, Code2, FileText, Flame, Laptop, ListChecks, Play, Sparkles, Target, Timer, Trophy, Video } from 'lucide-react';
import { PublicShell } from '../components/PublicShell';
import { StructureSketch } from '../components/StructureSketch';

// The hero: a sample of the real student overview. The three cards open their lists, like they do in the app.
const dash = {
    problems: { label: 'Coding problems solved', value: '12', of: '/ 1,541', color: 'blue', head: ['Problem', 'Track', 'Solved'],
        rows: [['Loan Eligibility Check', 'Python', 'Oct 29'], ['Word Frequency Counter', 'Python', 'Oct 27'], ['Stack Class', 'Python', 'Oct 24'], ['Hello from C', 'C', 'Oct 21']] },
    lessons: { label: 'Lessons completed', value: '38', of: '/ 90', color: 'amber', head: ['Lesson', 'Course', 'Done'],
        rows: [['Functions', 'Python Basics to OOP', 'Oct 28'], ['Loops and Iteration', 'Python Basics to OOP', 'Oct 25'], ['Installing Python', 'Python Basics to OOP', 'Oct 24'], ['Joins', 'SQL Essentials', 'Oct 20']] },
    assessments: { label: 'Assessment average', value: '88', of: '%', color: 'violet', head: ['Assessment', 'Score', 'Result'],
        rows: [['Core Java midterm', '35 / 40', '88%'], ['Quiz 3: Loops', '9 / 10', '90%'], ['Coding assessment', '10 / 10', '100%'], ['SQL lab', '15 / 20', '75%']] },
};
const insights = [
    [Flame, 'Current streak', '9 days', 'Best: 14 days'],
    [Target, 'Accepted on first try', '74%', '41 of 55 submissions'],
    [Code2, 'Strongest track', 'Python', '9 problems solved'],
    [Trophy, 'Next goal', '3 more', 'to reach 415 points'],
];
function StudentDash() {
    const [open, setOpen] = useState('problems');
    const view = dash[open];
    return <div className="lp-dash">
        <div className="lp-dash-hero"><div><small>Your rank in the college</small><strong>#3 <span>of 86 students</span></strong></div><div><small>Total points</small><strong>385</strong></div></div>
        <div className="lp-dash-tiles" role="tablist">{Object.entries(dash).map(([key, d]) => <button key={key} type="button" role="tab" aria-selected={open === key} className={`${d.color}${open === key ? ' on' : ''}`} onClick={() => setOpen(key)}>
            <small>{d.label}</small><strong>{d.value}<span>{d.of}</span></strong></button>)}</div>
        <div className="lp-dash-list" key={open}>
            <div className="lp-dash-row head">{view.head.map(h => <span key={h}>{h}</span>)}</div>
            {view.rows.map(r => <div className="lp-dash-row" key={r[0]}><strong>{r[0]}</strong><span>{r[1]}</span><em>{r[2]}</em></div>)}
        </div>
        <dl className="lp-dash-facts">{insights.map(([Icon, label, value, note]) => <div key={label}><Icon size={16}/><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
        <p className="lp-dash-note">A sample dashboard. Your own numbers appear after you sign in.</p>
    </div>;
}

// The student console: four tabs, each a part of a student's day (shown in its own section below the hero).
const dashTabs = [
    { label: '1. My courses', file: 'student/courses', tag: 'COURSES', note: 'Pick up exactly where you stopped.',
      rows: [['Python Basics to OOP', 'Chapter 8 of 28', '29%'], ['Core Java', 'Chapter 3 of 12', '25%'], ['SQL Essentials', 'Chapter 5 of 6', '83%'], ['Data Structures', 'Not started', '0%']], out: ['Next up  Functions', 'Prerequisite met', 'Video + PDF attached', '▶ Resume lesson'] },
    { label: '2. Practice', file: 'student/practice', tag: 'PRACTICE', note: 'Write code, run the samples, submit against hidden cases.',
      rows: [['Two Sum', 'DSA · Medium', 'Solved'], ['Swap with Pointers', 'C · Easy', 'Solved'], ['High Earners', 'SQL · Easy', 'Attempted'], ['A Sign-up Form', 'HTML & CSS', 'New']], out: ['Solved  3 of 1,541', 'Attempted  1', 'Tracks  9', '→ Random unsolved'] },
    { label: '3. Exams', file: 'student/exams', tag: 'EXAMS', note: 'The server keeps the clock; answers autosave.',
      rows: [['Java Midterm', 'Mon 10:00–11:30', 'Open'], ['Quiz 3: Loops', 'Opens Friday', 'Upcoming'], ['Python Final', '1 attempt used', 'Closed'], ['Lab Assignment', '2 attempts left', 'Open']], out: ['Time left  24:10', 'Answered  4 / 10', 'Autosaved just now', '→ Start attempt'] },
    { label: '4. Progress', file: 'student/progress', tag: 'PROGRESS', note: 'See what you have done, not just what is left.',
      rows: [['Lessons completed', '38 of 90', '42%'], ['Problems solved', '12 of 1,541', '1%'], ['Best exam score', '31 / 40', 'Passed'], ['Branch', 'CSE – Section A', '']], out: ['This week  5 problems', 'Best streak  4 days', 'Next goal  10 solved', '✓ Keep going'] },
];
function StudentConsole() {
    const [active, setActive] = useState(1);
    const tab = dashTabs[active];
    return <div className="lp-window lp-console">
        <div className="lp-window-bar"><i/><i/><i/><span>nextbyte :: {tab.file}</span></div>
        <div className="lp-tabs" role="tablist">{dashTabs.map((item, i) => <button key={item.label} type="button" role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => setActive(i)}>{item.label}</button>)}</div>
        <div className="lp-window-meta"><b>{tab.tag}</b><span>{tab.note}</span></div>
        <div className="lp-window-body"><div className="lp-rows" key={`rows-${active}`}>{tab.rows.map(([name, detail, state]) => <div key={name}><strong>{name}</strong><span>{detail}</span><em>{state}</em></div>)}</div>
            <div className="lp-term" key={`out-${active}`}>{tab.out.map((line, i) => <span key={line} className={i === 0 ? 'first' : i === tab.out.length - 1 ? 'last' : ''}>{line}</span>)}</div></div>
        <div className="lp-status"><span>Student</span><span>Progress saved</span><span>Judge ready</span></div>
    </div>;
}

const day = [
    ['Read a chapter', 'Open your course and read a chapter written as a web page, with figures and code you can copy. Watch the video or open the PDF notes if your teacher added them.'],
    ['Code what you read', 'Jump to practice and solve a problem on the same topic. Run it on the samples, fix it, then submit against the hidden cases.'],
    ['Check your progress', 'See your course bar move and your solved count go up. Small, visible wins are what keep you going.'],
    ['Take the exam when it opens', 'Your teacher opens a timed window for your branch. Walk in having already practised the same things.'],
];
const features = [
    [BookOpenCheck, 'Courses as web pages', 'Chapters with headings, code, tables and figures, easy to read and easy to come back to.'],
    [Video, 'Video and PDF lessons', 'Teachers can attach videos and notes. Your place in a video is remembered, so you resume where you stopped.'],
    [Code2, 'A real code editor', 'Write code in the browser with syntax highlighting. Nothing to install and nothing to configure.'],
    [Target, 'Instant feedback', 'See which sample cases pass or fail, and whether your solution was accepted, in seconds.'],
    [ListChecks, '1,500+ practice problems', 'Nine tracks, from Python and C to React, Git and DevOps, ordered from easy to hard.'],
    [Timer, 'Fair, timed exams', 'The server keeps the clock and your answers autosave, so a refresh or a dropped connection does not cost you.'],
    [Trophy, 'Progress you can see', 'Course progress, solved problems and exam scores in one place, always up to date.'],
    [ClipboardCheck, 'Clear results', 'Objective answers are graded for you. Written ones are marked by your teacher, with feedback.'],
];
const tracks = [['Python', 500], ['C', 487], ['Java', 497], ['DSA', 8], ['SQL', 8], ['HTML & CSS', 7], ['React', 8], ['Git & GitHub', 13], ['DevOps', 13]];
const exams = [[Clock, 'The clock is the server’s', 'Your time is fixed when you start, so refreshing the page never adds or removes minutes.'], [FileText, 'Answers autosave', 'Every answer is saved as you go. If time runs out, what you saved is submitted for you.'],
    [Laptop, 'Your own window', 'Exams open for your branch at the time your teacher sets, and some students can be given extra time.'], [Sparkles, 'Results when released', 'Scores can show immediately, after the window closes, or when your teacher publishes them.']];
const start = [['Get your institute code', 'Ask your institute which code to use. It is how NextByte knows which institute you belong to.'], ['Create your account', 'Choose Register, enter the code, pick your branch and sign up. Teachers need approval; students can sign in straight away.'], ['Open your first course', 'Pick a course, read chapter one and solve your first problem the same day.']];
const tips = [[Flame, 'Little and often', 'One problem a day beats a marathon on Sunday. Keep the streak alive, not the session long.'], [Code2, 'Type it yourself', 'Reading a solution feels like learning. Typing it from memory is learning.'], [Target, 'Read the failing case', 'A failed sample case shows exactly what your code printed. Start there.'], [Play, 'Mix your tracks', 'Pair Python with SQL, or Java with DSA. Each makes the other stick.']];
const faqs = [
    ['How do I register?', 'Open Register, enter your institute code, your details and your branch. If your institute code is not accepted, ask your institute admin to check the code and that your branch group exists.'],
    ['What is the difference between Run and Submit?', 'Run tests your code on the sample cases (or on your own input) and is not marked. Submit tests it against every case, including hidden ones, and is the result that counts.'],
    ['Which languages can I use?', 'Python, Java, C, C++ and JavaScript for DSA problems. Each other track uses its own language: Python, C, Java, SQL, HTML & CSS, React, Git commands, shell scripts, Dockerfiles and YAML.'],
    ['What if my connection drops during an exam?', 'Your answers are saved as you go. If you return before the time is up you carry on with the same attempt; if the time has passed, what you saved is submitted automatically.'],
    ['Who can see my results?', 'You, your teachers and your institute admins. Other institutes can never see them.'],
    ['Can I redo a problem?', 'Yes. Solved problems can be solved again at any time, and your earlier submissions stay in your history.'],
];

export function StudentLandingPage() {
    return <PublicShell>
        <section className="lp-hero lp-page-hero"><div className="lp-wrap lp-hero-grid">
            <div className="lp-hero-copy">
                <h1>Your degree gets you the interview. <em>Your code gets you the offer.</em></h1>
                <p className="lp-lead">Read your course, write real code in the browser and take the exams your teachers set. Your progress is saved, your feedback is instant, and tomorrow’s problem is always one click away.</p>
                <div className="lp-cta"><Link to="/login?mode=register" className="lp-btn big">Create a free account <ArrowRight size={18}/></Link><Link to="/paths" className="lp-btn ghost big"><Play size={16}/> Explore the paths</Link></div>
                <ul className="lp-proof"><li>Nothing to install</li><li>Free for students</li><li>Nine practice tracks</li></ul>
            </div>
            <div className="lp-mock"><StudentConsole/></div>
        </div></section>

        <section className="lp-facts" aria-label="At a glance"><div className="lp-wrap">{[['1,500+', 'practice problems'], ['9', 'practice tracks'], ['5', 'coding languages'], ['0', 'software to install']].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>

        <section className="lp-section" id="console"><div className="lp-wrap lp-two">
            <div><p className="lp-eyebrow">YOUR DASHBOARD</p><h2>See where you stand.</h2><p className="lp-sub">Your rank in the college, your points and what you have done, all on one page. Click a card to see the problems, lessons or assessments behind it.</p>
                <ul className="lp-list"><li><Trophy size={18}/> Your rank and points, updated as you solve and learn</li><li><Flame size={18}/> A streak and first-try accuracy to keep you honest</li><li><Target size={18}/> A next goal, so you always know the next step</li></ul></div>
            <StudentDash/>
        </div></section>

        <section className="lp-section" id="day"><div className="lp-wrap lp-two">
            <div><p className="lp-eyebrow">A DAY WITH NEXTBYTE</p><h2>Read it. Code it. Prove it.</h2><p className="lp-sub">Every course follows the same loop, so you always know what to do next. Here is what a good day looks like.</p>
                <Link to="/login?mode=register" className="lp-textlink">Start your first day <ArrowRight size={16}/></Link></div>
            <ol className="lp-steps">{day.map(([title, text], i) => <li key={title}><span>{i + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
        </div></section>

        <section className="lp-section alt" id="features"><div className="lp-wrap">
            <p className="lp-eyebrow">WHAT YOU GET</p><h2>Everything you need to learn by doing.</h2>
            <div className="lp-cards four">{features.map(([Icon, title, text]) => <article key={title}><Icon size={24}/><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div></section>

        <section className="lp-section" id="tracks"><div className="lp-wrap">
            <p className="lp-eyebrow">PRACTICE TRACKS</p><h2>Pick the language you want to get good at.</h2><p className="lp-sub">Every track starts at the beginning and gets harder step by step.</p>
            <div className="lp-track-grid">{tracks.map(([name, count]) => <Link key={name} to="/paths" className="lp-track"><strong>{name}</strong><span>{count} problems</span><i style={{ width: `${Math.max(4, (count / 500) * 100)}%` }}/></Link>)}</div>
            <Link to="/paths" className="lp-textlink">See every path in detail <ArrowRight size={16}/></Link>
        </div></section>

        <section className="lp-section" id="structures"><div className="lp-wrap lp-two">
            <div><p className="lp-eyebrow">SEE THE STRUCTURE</p><h2>Trees and graphs, drawn out.</h2><p className="lp-sub">The DSA track starts with a picture before the code. Press Walk it and watch a breadth-first search number the nodes, nearest first.</p>
                <ul className="lp-list"><li><Code2 size={18}/> Trees, graphs, stacks, queues and sorting in the DSA track</li><li><Target size={18}/> Write the search yourself, then check it against hidden cases</li></ul>
                <Link to="/paths" className="lp-textlink">See the DSA path <ArrowRight size={16}/></Link></div>
            <StructureSketch/>
        </div></section>

        <section className="lp-section alt" id="exams"><div className="lp-wrap">
            <p className="lp-eyebrow">EXAM DAY</p><h2>No surprises when the clock starts.</h2>
            <div className="lp-cards four">{exams.map(([Icon, title, text]) => <article key={title}><Icon size={24}/><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div></section>

        <section className="lp-section" id="start"><div className="lp-wrap lp-two">
            <div><p className="lp-eyebrow">GET STARTED</p><h2>Three steps to your first problem.</h2><p className="lp-sub">It takes a couple of minutes, and there is nothing to install.</p>
                <Link to="/login?mode=register" className="lp-textlink">Create an account <ArrowRight size={16}/></Link></div>
            <ol className="lp-steps">{start.map(([title, text], i) => <li key={title}><span>{i + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
        </div></section>

        <section className="lp-section alt" id="tips"><div className="lp-wrap">
            <p className="lp-eyebrow">MAKE IT STICK</p><h2>Four habits that work.</h2>
            <div className="lp-cards four">{tips.map(([Icon, title, text]) => <article key={title}><Icon size={24}/><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div></section>

        <section className="lp-section" id="faq"><div className="lp-wrap lp-faq">
            <div><p className="lp-eyebrow">QUESTIONS</p><h2>For students.</h2><p className="lp-sub">What new students ask first.</p></div>
            <div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18}/></summary><p>{answer}</p></details>)}</div>
        </div></section>

        <section className="lp-section"><div className="lp-wrap lp-band">
            <div><h2>Your next problem is waiting.</h2><p className="lp-sub">Create your account with your institute code and write your first line today.</p></div>
            <div className="lp-cta"><Link to="/login?mode=register" className="lp-btn big">Get started <ArrowRight size={18}/></Link><Link to="/login" className="lp-btn ghost big">Log in</Link></div>
        </div></section>
    </PublicShell>;
}
