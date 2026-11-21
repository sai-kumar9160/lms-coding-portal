import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, GraduationCap, Menu, X } from 'lucide-react';
import '../landing.css';

// Menu wording (routes stay the same): learners, institutions, partners (vendors), tracks (paths) and our story (about).
const navLinks = [['Learners', '/students'], ['Institutions', '/institutes'], ['Partners', '/#vendors'], ['Tracks', '/paths'], ['Notes', '/notes'], ['Our story', '/about']];

// Links such as /#vendors point into the home page; scroll to the section after the route changes.
function ScrollToHash() {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 0);
        else window.scrollTo(0, 0);
    }, [pathname, hash]);
    return null;
}

// "Log in" menu: students, teachers and institute admins use their institute code; vendors have their own sign-in.
function LoginMenu() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const close = event => { if (!ref.current?.contains(event.target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);
    return <div className="lp-menu" ref={ref}>
        <button type="button" className="lp-link" aria-expanded={open} onClick={() => setOpen(!open)}>Log in <ChevronDown size={15}/></button>
        {open && <div className="lp-menu-list"><Link to="/login" onClick={() => setOpen(false)}><b>Student, teacher or institute admin</b><small>Sign in with your institute code</small></Link>
            <Link to="/login?as=vendor" onClick={() => setOpen(false)}><b>Vendor</b><small>Partner sign in, no institute code</small></Link></div>}
    </div>;
}

// Scroll motion for the public pages: sections fade up as they come into view, numbers count up, and the top bar gains a
// shadow once the page scrolls. Skipped entirely when the visitor prefers reduced motion.
const REVEAL = [
    '.lp-section .lp-eyebrow', '.lp-section h2', '.lp-section .lp-sub', '.lp-section .lp-h3', '.lp-prose', '.lp-list li', '.lp-textlink',
    '.lp-cards article', '.lp-cols article', '.lp-path', '.lp-steps li', '.lp-facts .lp-wrap > div', '.lp-faq details', '.lp-track',
    '.lp-spec > div', '.lp-rank', '.lp-lab', '.lp-band', '.lp-quote', '.lp-section .lp-cta',
].join(', ');

function countUp(element) {
    const match = /^(\d+)(.*)$/.exec(element.dataset.final ?? element.textContent.trim());
    if (!match || Number(match[1]) === 0) return;
    const target = Number(match[1]);
    const started = performance.now();
    const tick = now => {
        const progress = Math.min(1, (now - started) / 1200);
        element.textContent = `${Math.round(target * (1 - Math.pow(1 - progress, 3)))}${match[2]}`;
        if (progress < 1) requestAnimationFrame(tick);
    };
    element.dataset.final = element.textContent.trim();
    element.textContent = `0${match[2]}`;
    requestAnimationFrame(tick);
}

function usePageMotion(rootRef, route) {
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;
        const nav = root.querySelector('.lp-nav');
        const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let observer;
        if (!reduced && 'IntersectionObserver' in window) {
            observer = new IntersectionObserver(entries => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const node = entry.target;
                    observer.unobserve(node);
                    node.classList.add('in');
                    if (node.matches('.lp-facts strong')) countUp(node);
                    // Once it has arrived, hand the element back to its normal hover transitions.
                    setTimeout(() => node.classList.remove('lp-reveal', 'in'), 2400);
                }
            }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
            const seen = new Map();
            for (const node of root.querySelectorAll(REVEAL)) {
                const parent = node.parentElement;
                const index = seen.get(parent) ?? 0;
                seen.set(parent, index + 1);
                node.style.setProperty('--i', Math.min(index, 7));
                node.classList.add('lp-reveal');
                observer.observe(node);
            }
            for (const node of root.querySelectorAll('.lp-facts strong')) observer.observe(node);
        }
        return () => { window.removeEventListener('scroll', onScroll); observer?.disconnect(); };
    }, [route]);
}

// The top bar and footer shared by the public pages.
export function PublicShell({ children }) {
    const { pathname, hash } = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const rootRef = useRef(null);
    useEffect(() => setMenuOpen(false), [pathname, hash]);
    usePageMotion(rootRef, pathname);
    return <div className="lp" ref={rootRef}>
        <ScrollToHash/>
        <header className="lp-nav"><div className="lp-wrap lp-nav-row">
            <Link to="/" className="lp-brand"><GraduationCap size={26}/> NextByte<span>.</span></Link>
            <nav aria-label="Main" id="lp-main-nav" className={menuOpen ? 'open' : ''}>{navLinks.map(([label, to]) => <Link key={label} to={to} aria-current={to === pathname ? 'page' : undefined}>{label}</Link>)}</nav>
            <div className="lp-nav-actions"><LoginMenu/><Link to="/login?mode=register" className="lp-btn">Get started</Link>
                <button type="button" className="lp-burger" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="lp-main-nav" onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={22}/> : <Menu size={22}/>}</button></div>
        </div></header>
        {children}
        <footer className="lp-footer"><div className="lp-wrap lp-foot-grid">
            <div><Link to="/" className="lp-brand"><GraduationCap size={24}/> NextByte<span>.</span></Link><p>Code daily. Grow endlessly.</p></div>
            <div><h4>Explore</h4><Link to="/students">Learners</Link><Link to="/institutes">Institutions</Link><Link to="/#vendors">Partners</Link><Link to="/paths">Tracks</Link><Link to="/notes">Notes</Link><Link to="/about">Our story</Link></div>
            <div><h4>Tracks</h4>{['Python', 'Java', 'C', 'DSA', 'SQL', 'HTML & CSS', 'React', 'Git & GitHub', 'DevOps'].map(language => <span key={language}>{language}</span>)}</div>
            <div><h4>Get in</h4><Link to="/login?mode=register">Create an account</Link><Link to="/login">Sign in</Link><Link to="/login?as=vendor">Vendor sign in</Link></div>
        </div><div className="lp-wrap lp-copy">© 2026 NextByte. Practice builds skill; we make no placement guarantees.</div></footer>
    </div>;
}
