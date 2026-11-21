import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock, Copy, Lightbulb, Search, TriangleAlert } from 'lucide-react';
import { PublicShell } from '../components/PublicShell';
import { diagrams as jsDiagrams, javascript } from '../notes/javascript';
import { diagrams as pyDiagrams, python } from '../notes/python';

const diagrams = { ...jsDiagrams, ...pyDiagrams };

// Add a language here (same shape as notes/javascript.js) and it gets its own tab.
export const languages = [javascript, python];

const store = {
    get: key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } },
    set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
};

// **bold** and `code` inside a sentence.
function Inline({ text }) {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part);
}

const KEYWORDS = new Set('const let var function return if else for while do switch case break continue default new class extends super this import export from async await try catch finally throw typeof instanceof in of static get set true false null undefined delete yield'.split(' '));
// A tiny highlighter: comments, strings, numbers and keywords.
function Highlight({ source }) {
    const tokens = source.split(/(\/\/[^\n]*|<!--[\s\S]*?-->|`(?:[^`\\]|\\.)*`|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\b\d[\d_.]*n?\b|\b[A-Za-z_$][\w$]*\b)/g);
    return tokens.map((token, i) => {
        if (!token) return null;
        if (token.startsWith('//') || token.startsWith('<!--')) return <span key={i} className="tk-c">{token}</span>;
        if (/^[`'"]/.test(token)) return <span key={i} className="tk-s">{token}</span>;
        if (/^\d/.test(token)) return <span key={i} className="tk-n">{token}</span>;
        if (KEYWORDS.has(token)) return <span key={i} className="tk-k">{token}</span>;
        if (/^[A-Za-z_$]/.test(token) && /^\s*\(/.test(tokens[i + 1] ?? '')) return <span key={i} className="tk-f">{token}</span>;
        return token;
    });
}

function CodeBlock({ block }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try { await navigator.clipboard.writeText(block.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
    };
    return <figure className="nt-code">
        <div className="nt-code-bar"><span>{block.title || 'example'}</span>
            <button type="button" onClick={copy} aria-label="Copy code">{copied ? <><Check size={14}/> Copied</> : <><Copy size={14}/> Copy</>}</button></div>
        <pre><code><Highlight source={block.code}/></code></pre>
        {block.out && <div className="nt-out"><b>Output</b><pre>{block.out}</pre></div>}
    </figure>;
}

function Diagram({ name, caption }) {
    const d = diagrams[name];
    if (!d) return null;
    const id = `arrow-${name}`;
    return <figure className="nt-diagram">
        <svg viewBox={`0 0 ${d.w} ${d.h}`} role="img" aria-label={caption}>
            <defs><marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="nt-arrowhead"/></marker></defs>
            {d.boxes?.map((b, i) => <g key={i} className={`nt-box ${b.tone || ''}`}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="10"/>
                <text x={b.top ? b.x + 14 : b.x + b.w / 2} y={b.top ? b.y + 22 : b.y + b.h / 2} textAnchor={b.top ? 'start' : 'middle'} dominantBaseline={b.top ? 'auto' : 'middle'}>{b.text}</text>
            </g>)}
            {d.arrows?.map((a, i) => <g key={i}>
                <line className="nt-line" x1={a.from[0]} y1={a.from[1]} x2={a.to[0]} y2={a.to[1]} markerEnd={a.line ? undefined : `url(#${id})`}/>
                {a.label && <text className="nt-label" x={(a.from[0] + a.to[0]) / 2} y={(a.from[1] + a.to[1]) / 2 - 8} textAnchor="middle">{a.label}</text>}
            </g>)}
            {d.texts?.map((t, i) => <text key={i} x={t.x} y={t.y} className={t.head ? 'nt-head' : t.accent ? 'nt-accent' : 'nt-label'}>{t.text}</text>)}
        </svg>
        {caption && <figcaption>{caption}</figcaption>}
    </figure>;
}

function Block({ block }) {
    switch (block.t) {
        case 'p': return <p><Inline text={block.text}/></p>;
        case 'h': return <h3>{block.text}</h3>;
        case 'list': return <ul className="nt-list">{block.items.map(item => <li key={item}><Inline text={item}/></li>)}</ul>;
        case 'note': return <aside className="nt-callout note"><Lightbulb size={18}/><p><Inline text={block.text}/></p></aside>;
        case 'warn': return <aside className="nt-callout warn"><TriangleAlert size={18}/><p><Inline text={block.text}/></p></aside>;
        case 'points': return <section className="nt-points"><h4>Key takeaways</h4><ul>{block.items.map(item => <li key={item}><Check size={16}/><span><Inline text={item}/></span></li>)}</ul></section>;
        case 'table': return <div className="nt-table"><table><thead><tr>{block.head.map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}><Inline text={j === 0 && !block.plain ? `\`${cell}\`` : cell}/></td>)}</tr>)}</tbody></table></div>;
        case 'code': return <CodeBlock block={block}/>;
        case 'diagram': return <Diagram name={block.name} caption={block.caption}/>;
        default: return null;
    }
}

const searchText = topic => `${topic.title} ${topic.summary} ${topic.blocks.map(b => b.text || b.code || (b.items || []).join(' ')).join(' ')}`.toLowerCase();

// The sidebar + article reader. Used by the public /notes page and inside the app's Courses page (embedded).
export function NotesReader({ language, topicId, onTopic, embedded = false }) {
    const [query, setQuery] = useState('');
    const storageKey = `nextbyte-notes-read-${language.language}`;
    const [read, setRead] = useState(() => store.get(storageKey));
    const topics = language.topics;
    const index = Math.max(0, topics.findIndex(t => t.id === topicId));
    const topic = topics[index];
    const matches = useMemo(() => { const q = query.trim().toLowerCase(); return q ? topics.filter(t => searchText(t).includes(q)) : topics; }, [query, topics]);
    useEffect(() => { window.scrollTo({ top: 0 }); }, [topic.id]);
    const toggleRead = () => { const next = read.includes(topic.id) ? read.filter(id => id !== topic.id) : [...read, topic.id]; setRead(next); store.set(storageKey, next); };
    const percent = Math.round(read.filter(id => topics.some(t => t.id === id)).length / topics.length * 100);
    const go = onTopic;

    return <div className="lp-wrap nt-layout">
        <aside className="nt-side" aria-label="Topics">
            <label className="nt-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search notes…" aria-label="Search notes"/></label>
            <div className="nt-progress"><span>{percent}% complete</span><div className="lp-bar"><i style={{ width: `${percent}%` }}/></div></div>
            <nav><ol>{matches.map(t => <li key={t.id}><button type="button" className={t.id === topic.id ? 'on' : ''} onClick={() => go(t.id)}>
                <span className="nt-num">{read.includes(t.id) ? <Check size={14}/> : topics.indexOf(t) + 1}</span><span>{t.title}</span></button></li>)}
                {!matches.length && <li className="nt-none">No topic matches “{query}”.</li>}</ol></nav>
        </aside>

        <article className="nt-article" key={topic.id}>
            <p className="nt-crumb">Topic {index + 1} of {topics.length} <span><Clock size={13}/> {topic.time} min read</span></p>
            <h2>{topic.title}</h2>
            <p className="nt-summary">{topic.summary}</p>
            {topic.blocks.map((block, i) => <Block key={i} block={block}/>)}
            <div className="nt-foot">
                <button type="button" className={`lp-btn ghost ${read.includes(topic.id) ? 'done' : ''}`} onClick={toggleRead}><Check size={16}/> {read.includes(topic.id) ? 'Marked as read' : 'Mark as read'}</button>
                <div className="nt-pager">
                    {index > 0 && <button type="button" className="lp-btn ghost" onClick={() => go(topics[index - 1].id)}><ArrowLeft size={16}/> {topics[index - 1].title}</button>}
                    {index < topics.length - 1 && <button type="button" className="lp-btn" onClick={() => go(topics[index + 1].id)}>{topics[index + 1].title} <ArrowRight size={16}/></button>}
                </div>
            </div>
            {!embedded && <div className="nt-cta"><div><h4>Ready to practise?</h4><p>Reading is half the job. Solve problems to make it stick.</p></div><Link to="/login?mode=register" className="lp-btn">Start practising <ArrowRight size={16}/></Link></div>}
        </article>
    </div>;
}

export function NotesPage() {
    const [params, setParams] = useSearchParams();
    const language = languages.find(item => item.language.toLowerCase() === params.get('lang')) ?? languages[0];
    const choose = item => setParams({ lang: item.language.toLowerCase() });
    const soon = ['Java', 'C', 'SQL'].filter(name => !languages.some(item => item.language === name));
    return <PublicShell>
        <section className="nt-hero"><div className="lp-wrap">
            <p className="lp-eyebrow">STUDY NOTES</p>
            <h1>{language.language} <em>notes</em></h1>
            <p className="lp-lead">{language.tagline} Theory, diagrams and examples with their output, one topic at a time.</p>
            <div className="nt-tabs" role="tablist">{languages.map(item => <button key={item.language} type="button" role="tab" aria-selected={item === language} className={item === language ? 'on' : ''} onClick={() => choose(item)}>{item.language}</button>)}
                {soon.map(name => <button key={name} type="button" role="tab" aria-selected="false" disabled title="Coming soon">{name} <small>soon</small></button>)}</div>
        </div></section>
        <NotesReader key={language.language} language={language} topicId={params.get('topic')} onTopic={id => setParams({ lang: language.language.toLowerCase(), topic: id })}/>
    </PublicShell>;
}
