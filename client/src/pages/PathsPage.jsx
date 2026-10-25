import { Link } from 'react-router-dom';
import { ArrowRight, Atom, Braces, Code2, Database, FileCode2, GitBranch, Globe, Network, Rocket, Server, Target, Trophy } from 'lucide-react';
import { PublicShell } from '../components/PublicShell';

// One card per practice track. The problem counts and sample titles match the problems shipped with the platform.
const paths = [
    { icon: Code2, name: 'Python', count: '55 problems', level: 'Beginner friendly', tagline: 'Your first language, done properly.',
      text: 'Start with input and output, then loops, strings, lists and dictionaries, and finish with recursion, dynamic programming and backtracking. Each step is a small program you can run in seconds.',
      learn: ['Variables, conditions and loops', 'Strings, lists and matrices', 'Number theory and patterns', 'Recursion and dynamic programming'], samples: ['Hello, World!', 'Prime Check', 'Pascal’s Triangle', 'Coin Change'] },
    { icon: Braces, name: 'C', count: '7 problems', level: 'Core fundamentals', tagline: 'Understand what the computer is doing.',
      text: 'Pointers, arrays, strings and structs in the language that shows you how memory really works. If you can write C, every other language gets easier to read.',
      learn: ['printf, scanf and the main function', 'Pointers and swapping through them', 'Arrays and string handling', 'Recursion and struct'], samples: ['Swap with Pointers', 'Reverse an Array', 'Factorial by Recursion', 'Class Topper (struct)'] },
    { icon: FileCode2, name: 'Java', count: '7 problems', level: 'Campus favourite', tagline: 'Think in objects.',
      text: 'Classes, objects, collections, inheritance and polymorphism: the Java that campus exams and interviews ask for, practised on real programs instead of slides.',
      learn: ['Classes, objects and constructors', 'Strings and StringBuilder', 'ArrayList and Collections', 'Inheritance and abstract classes'], samples: ['Rectangle Class', 'Sort in Descending Order', 'Fibonacci by Recursion', 'Shapes and Polymorphism'] },
    { icon: Network, name: 'DSA', count: '8 problems', level: 'Interview ready', tagline: 'The patterns behind every interview.',
      text: 'Linked lists, trees, graphs, stacks, queues, intervals and hashing. Solve them in any language you like; the judge only cares that the answer is right and fast enough.',
      learn: ['Linked lists and binary search trees', 'Graph search with BFS', 'Stacks and queues', 'Sorting, hashing and cycle detection'], samples: ['Reverse a Linked List', 'Shortest Path (BFS)', 'Queue Using Two Stacks', 'Detect a Cycle'] },
    { icon: Database, name: 'SQL', count: '8 problems', level: 'Every developer needs it', tagline: 'Ask your data better questions.',
      text: 'Write real queries against real tables. Filter, sort, group, join and find what is missing; each problem runs your query on fresh data, so only a correct query passes.',
      learn: ['SELECT, WHERE and ORDER BY', 'GROUP BY and HAVING', 'JOIN and LEFT JOIN', 'Finding rows that do not match'], samples: ['High Earners', 'Top Three Salaries', 'Headcount per Department', 'Customers Who Never Ordered'] },
    { icon: Globe, name: 'HTML & CSS', count: '7 problems', level: 'Build something you can see', tagline: 'Build pages, not just programs.',
      text: 'Write a page and the judge checks its structure and styles, one requirement at a time, so a half-finished page still earns half the credit and tells you what to fix.',
      learn: ['Headings, lists, links and images', 'Tables and forms', 'Semantic layout tags', 'Styling with CSS rules'], samples: ['Your First Web Page', 'A Sign-up Form', 'A Semantic Layout', 'Style a Card'] },
    { icon: Atom, name: 'React', count: '8 problems', level: 'Modern front end', tagline: 'Build interfaces from components.',
      text: 'Write real React components and watch them render. Props, lists, conditional rendering, state and forms, checked against the HTML your component produces.',
      learn: ['Components and JSX', 'Props, lists and keys', 'Conditional rendering', 'useState and controlled inputs'], samples: ['Greeting Component', 'Render a List', 'Counter with useState', 'Todo List'] },
    { icon: GitBranch, name: 'Git & GitHub', count: '13 problems', level: 'Every developer, every day', tagline: 'Never fear the command line again.',
      text: 'Type real git commands in a practice repository and see exactly what they did. Branch, merge, rebase, stash, tag, undo with revert, then push and pull against a GitHub stand-in.',
      learn: ['Staging and committing', 'Branches, merges and rebasing', 'Undoing with revert and stash', 'Remotes: push, pull and feature branches'], samples: ['Your First Commit', 'Merge Diverged Branches', 'Undo with Revert', 'Push a Feature Branch'] },
    { icon: Server, name: 'DevOps', count: '13 problems', level: 'From laptop to production', tagline: 'Ship what you build.',
      text: 'The fundamentals every team expects: shell scripting for logs and automation, Dockerfiles, CI pipelines with GitHub Actions, Docker Compose and Kubernetes manifests.',
      learn: ['Shell scripting and log processing', 'Writing Dockerfiles', 'CI/CD with GitHub Actions', 'Compose and Kubernetes basics'], samples: ['Disk Usage Alert', 'Dockerfile for a Node.js App', 'A GitHub Actions Workflow', 'A Kubernetes Deployment'] },
];
const roadmap = [
    ['Week 1: Start small', 'Pick one path and solve one easy problem a day. The goal is the habit, not the score.'],
    ['Week 2: Get comfortable', 'Move to medium problems. When you get stuck, read the sample cases again, then run your code on your own input.'],
    ['Week 3: Mix it up', 'Add a second path. SQL next to Python, or DSA next to Java, makes both stronger.'],
    ['Week 4: Prove it', 'Take the timed quiz or exam your teacher sets and see how far a month of practice has taken you.'],
];

export function PathsPage() {
    return <PublicShell>
        <section className="lp-hero lp-page-hero"><div className="lp-wrap lp-center">
            <p className="lp-pill"><b>PATHS</b> Nine ways to start. One way to keep going.</p>
            <h1>Pick a path. <em>Take the next step today.</em></h1>
            <p className="lp-lead">Nobody becomes a developer in a day, and nobody has to. Choose a path, solve one problem, and let tomorrow’s problem be a little easier than today’s.</p>
            <div className="lp-cta lp-cta-center"><Link to="/login?mode=register" className="lp-btn big">Start your first path <ArrowRight size={18}/></Link><a href="#paths" className="lp-btn ghost big">Browse the paths</a></div>
        </div></section>

        <section className="lp-facts" aria-label="At a glance"><div className="lp-wrap">{[['9', 'practice paths'], ['120+', 'problems to solve'], ['0', 'setup: code in your browser'], ['1', 'problem is enough for today']].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>

        <section className="lp-section" id="paths"><div className="lp-wrap">
            <p className="lp-eyebrow">CHOOSE YOUR PATH</p><h2>Every path starts at the very beginning.</h2><p className="lp-sub">Problems are ordered from easy to hard, with sample cases to learn from and hidden cases to prove it.</p>
            <div className="lp-paths">{paths.map(({ icon: Icon, name, count, level, tagline, text, learn, samples }) => <article key={name} className="lp-path">
                <div className="lp-path-head"><span className="lp-path-icon"><Icon size={24}/></span><div><h3>{name}</h3><small>{count} · {level}</small></div></div>
                <p className="lp-path-tag">{tagline}</p><p className="lp-path-text">{text}</p>
                <h4>You will practise</h4><ul className="lp-points">{learn.map(item => <li key={item}>{item}</li>)}</ul>
                <h4>A taste of it</h4><ul className="lp-chips small">{samples.map(item => <li key={item}>{item}</li>)}</ul>
                <Link to="/login?mode=register" className="lp-textlink">Start the {name} path <ArrowRight size={16}/></Link>
            </article>)}</div>
        </div></section>

        <section className="lp-section alt"><div className="lp-wrap lp-two">
            <div><p className="lp-eyebrow">YOUR FIRST MONTH</p><h2>A simple plan beats a perfect one.</h2><p className="lp-sub">You do not need a big block of free time. Thirty focused minutes a day is enough to feel the difference by the end of the month.</p>
                <Link to="/login?mode=register" className="lp-textlink">Begin week 1 <ArrowRight size={16}/></Link></div>
            <ol className="lp-steps">{roadmap.map(([title, text], i) => <li key={title}><span>{i + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
        </div></section>

        <section className="lp-section"><div className="lp-wrap">
            <p className="lp-eyebrow">WHY IT WORKS</p><h2>Small wins add up.</h2>
            <div className="lp-cards">{[[Target, 'Instant feedback', 'Run your code and see which cases pass or fail in seconds, so you learn from every attempt instead of guessing.'],
                [Trophy, 'Progress you can see', 'Solved, attempted and new problems are tracked for you. Watching the green grow is the best motivation there is.'],
                [Rocket, 'Built for exams too', 'The same skills carry into the timed quizzes and exams your teachers set, so practice and results point the same way.']].map(([Icon, title, text], i) =>
                <article key={title}><span className="lp-step">0{i + 1}</span><Icon size={26}/><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div></section>

        <section className="lp-section"><div className="lp-wrap lp-band">
            <div><h2>Your next problem is waiting.</h2><p className="lp-sub">Create a free account with your institute code, choose a path and write your first line today.</p></div>
            <div className="lp-cta"><Link to="/login?mode=register" className="lp-btn big">Create a free account <ArrowRight size={18}/></Link><Link to="/" className="lp-btn ghost big">Back to home</Link></div>
        </div></section>
    </PublicShell>;
}
