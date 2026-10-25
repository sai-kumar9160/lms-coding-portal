import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Lock, Repeat, ScrollText, Sprout, Users } from 'lucide-react';
import { PublicShell } from '../components/PublicShell';

const beliefs = [
    [Repeat, 'Practice beats theory', 'You learn to code by coding. Every course on NextByte sits next to problems to solve and exams to take, so reading always turns into doing.'],
    [Sprout, 'Small steps, every day', 'One problem a day is worth more than one marathon a month. We make the next step small and obvious, so you keep going.'],
    [Heart, 'Honest progress', 'Scores come from the judge and the exam, not from guesses. We never promise placements; we give you proof of what you can do.'],
    [Lock, 'Your data is yours', 'Each institute’s people, courses and results stay inside that institute. Nothing is shared unless the institute chooses to share it.'],
];
const audiences = [
    [Users, 'Students', 'Read the course, practise on the judge and take the exam, with your progress remembered. Start free with your institute code.', '/login?mode=register', 'Create an account'],
    [ScrollText, 'Institutes', 'Run courses, branch-wise exams and results for every department in one private space your own admins control.', '/institutes', 'See what institutes get'],
    [Sprout, 'Vendors', 'Content partners publish coding problems once, and every institute can use them. The platform admin gives you your login.', '/login?as=vendor', 'Vendor sign in'],
];

export function AboutPage() {
    return <PublicShell>
        <section className="lp-hero lp-page-hero"><div className="lp-wrap lp-center">
            <p className="lp-pill"><b>ABOUT</b> Code daily. Grow endlessly.</p>
            <h1>We make the next byte <em>easy to take.</em></h1>
            <p className="lp-lead">NextByte is a platform for learning to code. It exists for one reason: so that the student who opens it today is a slightly better programmer than the one who closed it yesterday.</p>
            <div className="lp-cta lp-cta-center"><Link to="/login?mode=register" className="lp-btn big">Join NextByte <ArrowRight size={18}/></Link><Link to="/paths" className="lp-btn ghost big">Explore the paths</Link></div>
        </div></section>

        <section className="lp-section"><div className="lp-wrap lp-two">
            <div><p className="lp-eyebrow">OUR STORY</p><h2>Learning to code should not feel lonely.</h2></div>
            <div className="lp-prose">
                <p>Every year thousands of students start a programming course with energy and lose it halfway. The notes are in one place, the practice problems in another and the exam is a surprise.</p>
                <p>NextByte puts it all in one place. A teacher builds the course; the student reads a chapter, writes code for it in the browser, and takes the timed exam when it is time. The institute sees how everyone is doing, and each student sees how far they have come.</p>
                <p>That is the whole idea: fewer tabs, fewer excuses and a clear next step.</p>
            </div>
        </div></section>

        <section className="lp-section alt"><div className="lp-wrap">
            <p className="lp-eyebrow">WHAT WE BELIEVE</p><h2>Four ideas we build around.</h2>
            <div className="lp-cards four">{beliefs.map(([Icon, title, text]) => <article key={title}><Icon size={24}/><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div></section>

        <section className="lp-facts" aria-label="At a glance"><div className="lp-wrap">{[['9', 'practice paths'], ['120+', 'practice problems'], ['6', 'question types'], ['1', 'private space per institute']].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>

        <section className="lp-section"><div className="lp-wrap">
            <p className="lp-eyebrow">WHO IT IS FOR</p><h2>One platform, three ways in.</h2>
            <div className="lp-cards">{audiences.map(([Icon, title, text, to, label]) => <article key={title}><Icon size={26}/><h3>{title}</h3><p>{text}</p><Link to={to} className="lp-textlink">{label} <ArrowRight size={16}/></Link></article>)}</div>
        </div></section>

        <section className="lp-section alt"><div className="lp-wrap lp-quote"><p>“The best time to start was a year ago. The second best time is the next problem.”</p><span>A reminder from the NextByte team</span></div></section>

        <section className="lp-section"><div className="lp-wrap lp-band">
            <div><h2>Ready for your next byte?</h2><p className="lp-sub">Create a free account, pick a path and write your first line today.</p></div>
            <div className="lp-cta"><Link to="/login?mode=register" className="lp-btn big">Get started <ArrowRight size={18}/></Link><Link to="/login" className="lp-btn ghost big">Log in</Link></div>
        </div></section>
    </PublicShell>;
}
