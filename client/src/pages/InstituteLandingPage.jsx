import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, ChevronDown, ClipboardCheck, Code2, Eye, GraduationCap, KeyRound, Layers, Library, Lock, ScrollText, ShieldCheck, Timer, UserCheck, Users } from 'lucide-react';
import { PublicShell } from '../components/PublicShell';

// The institute console shown in the hero: four tabs, each a part of what an admin manages.
const consoleTabs = [
    { label: '1. People', file: 'institute/people', tag: 'PEOPLE', note: 'Approve teachers, add students, assign branches.',
      rows: [['Asha Rao', 'Teacher', 'Pending'], ['Ravi Kumar', 'Student', 'CSE'], ['Meena Iyer', 'Student', 'ECE'], ['Dr. Sen', 'Teacher', 'Active']], out: ['Pending approvals  1', 'Students  420', 'Teachers  18', '✓ Approve Asha Rao'] },
    { label: '2. Academics', file: 'institute/academics', tag: 'ACADEMICS', note: 'Years, departments, programmes, batches and branch groups.',
      rows: [['2026-27', 'Academic year', 'Current'], ['Computer Science', 'Department', '3 programmes'], ['B.Tech CSE', 'Programme', '4 years'], ['CSE – Section A', 'Branch group', '62 students']], out: ['Departments  4', 'Programmes  7', 'Branch groups  12', '✓ Saved'] },
    { label: '3. Exams', file: 'institute/assessments', tag: 'EXAMS', note: 'Question bank, windows per branch, attempts and result rules.',
      rows: [['Java Midterm', 'Exam', 'Published'], ['Quiz 3: Loops', 'Quiz', 'Draft'], ['Lab Assignment', 'Assignment', 'Published'], ['Python Final', 'Exam', 'Closed']], out: ['Window  Mon 10:00 – 11:30', 'Branch  CSE – Section A', 'Attempts allowed  1', '✓ Published'] },
    { label: '4. Results', file: 'institute/results', tag: 'RESULTS', note: 'Auto-graded scores, manual grading and when results are shown.',
      rows: [['Ravi Kumar', '31 / 40', 'Passed'], ['Meena Iyer', '24 / 40', 'Passed'], ['Kiran P.', '15 / 40', 'Below pass'], ['Sana M.', 'pending', 'Needs grading']], out: ['Average  23.3', 'Pass mark  40%', 'Needs grading  1', '✓ Results published'] },
];
function InstituteConsole() {
    const [active, setActive] = useState(0);
    const tab = consoleTabs[active];
    return <div className="lp-window lp-console">
        <div className="lp-window-bar"><i/><i/><i/><span>nextbyte :: {tab.file}</span></div>
        <div className="lp-tabs" role="tablist">{consoleTabs.map((item, i) => <button key={item.label} type="button" role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => setActive(i)}>{item.label}</button>)}</div>
        <div className="lp-window-meta"><b>{tab.tag}</b><span>{tab.note}</span></div>
        <div className="lp-window-body"><div className="lp-rows" key={`rows-${active}`}>{tab.rows.map(([name, kind, state]) => <div key={name}><strong>{name}</strong><span>{kind}</span><em>{state}</em></div>)}</div>
            <div className="lp-term" key={`out-${active}`}>{tab.out.map((line, i) => <span key={line} className={i === 0 ? 'first' : i === tab.out.length - 1 ? 'last' : ''}>{line}</span>)}</div></div>
        <div className="lp-status"><span>Institute admin</span><span>Audit on</span><span>Data private</span></div>
    </div>;
}

const roles = [
    { icon: ShieldCheck, title: 'Institute admin', points: ['Adds teachers and students, and approves teacher registrations', 'Builds the academic structure: years, departments, programmes, batches', 'Creates branch groups and assigns students to them', 'Sees every course, exam and result of the institute', 'Can share a course with all institutes'] },
    { icon: BookOpenCheck, title: 'Teacher', points: ['Builds courses from lessons, video, PDFs or a whole PDF converted to chapters', 'Adds co-instructors to a course', 'Keeps a question bank and builds quizzes, assignments and exams', 'Grades written answers and publishes results', 'Adds coding problems for their own classes'] },
    { icon: GraduationCap, title: 'Student', points: ['Registers with the institute code and a branch', 'Reads chapters, watches lessons, resumes where they stopped', 'Practises coding problems in the browser', 'Takes timed exams in their branch window', 'Sees scores when the teacher allows'] },
];
const capabilities = [
    [Users, 'People & approvals', 'Self-registration with your institute code. Teacher accounts wait for admin approval, so only people you trust can author content.'],
    [Layers, 'Academic structure', 'Academic years, departments, programmes, batches and sections. A year can be marked current; nothing is removed while something still depends on it.'],
    [Library, 'Courses', 'Lessons as text, Markdown, video or PDF, with prerequisites, per-lesson downloads, a syllabus PDF and progress tracked for each student.'],
    [ClipboardCheck, 'Question bank & exams', 'Single and multiple choice, true/false, numeric, short answer and coding questions. Marks, negative marking, shuffling and difficulty.'],
    [Timer, 'Timed windows', 'Open an exam for the whole institute or a single branch group, with extra time for some students. The server keeps the clock and submits when time ends.'],
    [Code2, 'Coding judge', 'Python, Java, C, C++ and JavaScript run against hidden test cases. Teachers can add their own problems or use the shared library.'],
    [Eye, 'Results you control', 'Show scores immediately, after the window closes, or when you publish them. Choose the best attempt or the latest.'],
    [Lock, 'Private by design', 'Your people, courses and results belong to your institute only. Shared courses from other institutes are read-only.'],
];
const steps = [
    ['The platform admin creates your institute', 'You get an institute code and your first institute admin account.'],
    ['Set up the academic structure', 'Add the current year, departments, programmes, batches and branch groups.'],
    ['Bring in your people', 'Students register with the institute code and pick a branch; you approve teachers, or add people yourself.'],
    ['Teachers build the content', 'Courses, a question bank and coding problems, from scratch or by importing a PDF.'],
    ['Schedule and review', 'Open exam windows per branch, grade what needs a human, publish results.'],
];
const controls = [['Who can take it', 'Whole institute, or one branch group'], ['Time limit', 'Set per exam; extra minutes per window'], ['Attempts', 'One or several; best or latest counts'], ['Question order', 'Optionally shuffled, with options shuffled too'], ['Result visibility', 'Immediate, after close, or when you publish'], ['Grading', 'Automatic for objective questions; manual for written ones']];
const faqs = [
    ['How does an institute get started?', 'The platform admin creates the institute and its first admin, and gives you an institute code. From then on your admin runs everything inside the institute.'],
    ['Can we keep our students separate from other institutes?', 'Yes. That is the default and it cannot be turned off: every query is scoped to your institute. The only thing from outside is a course another institute chose to share, and it is read-only.'],
    ['Can teachers reuse notes they already have?', 'Yes. Upload a PDF and it is converted into a draft course with one lesson per chapter, figures and the chapter PDF attached. A teacher then reviews and publishes it.'],
    ['What happens if a student loses connection during an exam?', 'Answers are saved as the student goes. If they come back before the time is up they resume the same attempt; if the time has passed, the attempt is submitted automatically with what was saved.'],
    ['Who can see exam results?', 'Teachers and admins of the institute, and each student their own. A student sees marks only when the exam’s result setting allows it.'],
    ['How long do sessions last?', 'A signed-in session ends after 30 minutes without activity, and always after 8 hours.'],
];

export function InstituteLandingPage() {
    return <PublicShell>
        <section className="lp-hero lp-page-hero"><div className="lp-wrap lp-hero-grid">
            <div>
                <p className="lp-pill"><b>FOR INSTITUTES</b> One platform for courses, coding and exams</p>
                <h1>Run your campus’s learning, <em>your way.</em></h1>
                <p className="lp-lead">Give every department a place to teach, every student a place to practise, and every exam a fair, timed room — with your institute’s data kept entirely your own.</p>
                <div className="lp-cta"><Link to="/login" className="lp-btn big">Institute sign in <ArrowRight size={18}/></Link><a href="#setup" className="lp-btn ghost big">See how setup works</a></div>
                <ul className="lp-chips"><li>Branch-wise exams</li><li>Teacher approvals</li><li>Auto-grading</li><li>PDF to course</li></ul>
            </div>
            <div className="lp-mock"><InstituteConsole/></div>
        </div></section>

        <section className="lp-facts" aria-label="At a glance"><div className="lp-wrap">{[['3', 'roles in every institute'], ['6', 'question types'], ['5', 'coding languages'], ['1', 'private space per institute']].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>

        <section className="lp-section" id="roles"><div className="lp-wrap">
            <p className="lp-eyebrow">WHO DOES WHAT</p><h2>Every role gets the right tools.</h2><p className="lp-sub">Menus and actions follow each person’s role, so people see only what they need.</p>
            <div className="lp-cards">{roles.map(({ icon: Icon, title, points }) => <article key={title}><Icon size={26}/><h3>{title}</h3><ul className="lp-points">{points.map(point => <li key={point}>{point}</li>)}</ul></article>)}</div>
        </div></section>

        <section className="lp-section alt" id="capabilities"><div className="lp-wrap">
            <p className="lp-eyebrow">WHAT YOU GET</p><h2>Everything a department needs.</h2>
            <div className="lp-cards four">{capabilities.map(([Icon, title, text]) => <article key={title}><Icon size={24}/><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div></section>

        <section className="lp-section" id="setup"><div className="lp-wrap lp-two">
            <div><p className="lp-eyebrow">SETUP</p><h2>From empty to first exam in five steps.</h2><p className="lp-sub">No servers to run for your institute and nothing to install for students.</p>
                <Link to="/login" className="lp-textlink">Institute sign in <ArrowRight size={16}/></Link></div>
            <ol className="lp-steps">{steps.map(([title, text], i) => <li key={title}><span>{i + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
        </div></section>

        <section className="lp-section alt" id="exams"><div className="lp-wrap lp-two">
            <div><p className="lp-eyebrow">EXAM CONTROLS</p><h2>Fair, timed and flexible.</h2><p className="lp-sub">Set the rules once per exam. The platform enforces them the same way for every student.</p></div>
            <div className="lp-spec">{controls.map(([name, value]) => <div key={name}><span>{name}</span><strong>{value}</strong></div>)}</div>
        </div></section>

        <section className="lp-section" id="trust"><div className="lp-wrap">
            <p className="lp-eyebrow">TRUST & CONTROL</p><h2>Safe by default.</h2>
            <div className="lp-cards four">{[[KeyRound, 'Institute-code sign-in', 'People sign in with the institute code, their email and a password stored only as a hash.'],
                [UserCheck, 'Approval for teachers', 'New teacher registrations stay pending until an institute admin approves them.'],
                [ScrollText, 'Audit trail', 'Every change records who made it, when and from where, available to the platform admin.'],
                [ShieldCheck, 'Sessions that expire', 'Sessions end after 30 idle minutes or 8 hours, and password reset links work once and expire.']].map(([Icon, title, text]) =>
                <article key={title}><Icon size={24}/><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div></section>

        <section className="lp-section alt" id="faq"><div className="lp-wrap lp-faq">
            <div><p className="lp-eyebrow">QUESTIONS</p><h2>For institute teams.</h2><p className="lp-sub">What admins and heads of department ask first.</p></div>
            <div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18}/></summary><p>{answer}</p></details>)}</div>
        </div></section>

        <section className="lp-section"><div className="lp-wrap lp-band">
            <div><h2>Ready to bring your institute on?</h2><p className="lp-sub">Ask the platform admin for your institute space and code. Already have one? Sign in and start with the academic structure.</p></div>
            <div className="lp-cta"><Link to="/login" className="lp-btn big">Institute sign in <ArrowRight size={18}/></Link><Link to="/" className="lp-btn ghost big">Back to home</Link></div>
        </div></section>
    </PublicShell>;
}
