import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

// Two notebook-paper sketches: a tree (arrows point from parent to child) and a graph (plain links).
// "Walk it" visits the nodes breadth first, numbering them in the order they are reached.
const treeNodes = [[170, 70], [80, 190], [260, 190], [36, 315], [124, 315], [216, 315], [304, 315]];
const treeEdges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
const graphNodes = [[470, 70], [650, 62], [425, 195], [560, 175], [715, 200], [600, 290], [500, 320]];
const graphEdges = [[0, 1], [0, 2], [1, 3], [1, 4], [3, 6], [2, 6], [4, 5], [5, 6], [3, 5]];

function bfs(count, edges, start = 0, directed = false) {
    const next = Array.from({ length: count }, () => []);
    edges.forEach(([a, b]) => { next[a].push(b); if (!directed) next[b].push(a); });
    const order = [start], seen = new Set(order), via = {};
    for (let i = 0; i < order.length; i++) for (const n of next[order[i]]) if (!seen.has(n)) {
        seen.add(n); order.push(n);
        via[n] = edges.findIndex(([a, b]) => (a === order[i] && b === n) || (!directed && a === n && b === order[i]));
    }
    return { order, via };
}
const tree = bfs(treeNodes.length, treeEdges, 0, true);
const graph = bfs(graphNodes.length, graphEdges, 0);
const treeOrder = tree.order, graphOrder = graph.order;

// A slightly wobbly line, so it reads as drawn by hand.
const wobble = (x1, y1, x2, y2, seed) => {
    const mx = (x1 + x2) / 2 + Math.sin(seed * 12.9) * 5, my = (y1 + y2) / 2 + Math.cos(seed * 7.7) * 5;
    return `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
};
const trim = ([x1, y1], [x2, y2], r) => { const d = Math.hypot(x2 - x1, y2 - y1); const k = r / d; return [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, x2 - (x2 - x1) * k, y2 - (y2 - y1) * k]; };

export function StructureSketch() {
    const [steps, setSteps] = useState(0);
    const [running, setRunning] = useState(false);
    const timer = useRef(null);
    const total = Math.max(treeOrder.length, graphOrder.length);
    useEffect(() => () => clearInterval(timer.current), []);
    const walk = () => {
        clearInterval(timer.current);
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setSteps(total); return; }
        setSteps(0); setRunning(true);
        let n = 0;
        timer.current = setInterval(() => { n++; setSteps(n); if (n >= total) { clearInterval(timer.current); setRunning(false); } }, 650);
    };
    const reset = () => { clearInterval(timer.current); setRunning(false); setSteps(0); };
    const rank = (order, i) => { const at = order.indexOf(i); return at >= 0 && at < steps ? at + 1 : 0; };
    const node = (pt, i, order, seed) => {
        const r = rank(order, i);
        return <g key={i} className={`sk-node${r ? ' seen' : ''}${r === steps && running ? ' now' : ''}`}>
            <circle cx={pt[0]} cy={pt[1]} r="30" transform={`rotate(${seed * 7} ${pt[0]} ${pt[1]})`}/>
            <circle className="sk-sheen" cx={pt[0] - 6} cy={pt[1] - 7} r="14"/>
            {r > 0 && <text x={pt[0]} y={pt[1] + 7} textAnchor="middle">{r}</text>}
        </g>;
    };
    return <figure className="sk">
        <div className="sk-paper">
            <svg viewBox="0 0 780 400" role="img" aria-label="A tree with arrows from each parent to its children, next to a graph whose nodes are joined in loops">
                <defs><marker id="sk-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#1d2b24" strokeWidth="1.6" strokeLinecap="round"/></marker></defs>
                {treeEdges.map(([a, b], i) => { const [x1, y1, x2, y2] = trim(treeNodes[a], treeNodes[b], 36); return <path key={`t${i}`} className="sk-line" d={wobble(x1, y1, x2, y2, i + 1)} markerEnd="url(#sk-arrow)"/>; })}
                {treeNodes.map((pt, i) => node(pt, i, treeOrder, i + 1))}
                {graphEdges.map(([a, b], i) => { const [x1, y1, x2, y2] = trim(graphNodes[a], graphNodes[b], 32); return <path key={`g${i}`} className="sk-line" d={wobble(x1, y1, x2, y2, i + 4)}/>; })}
                {graphNodes.map((pt, i) => node(pt, i, graphOrder, i + 3))}
                <text className="sk-label" x="170" y="388" textAnchor="middle">TREE</text>
                <text className="sk-label" x="580" y="388" textAnchor="middle">GRAPH</text>
            </svg>
        </div>
        <figcaption>
            <p>{steps === 0 ? 'A tree has one root and every node points down to its children. A graph can link any node to any other, even in loops.'
                : steps < total ? `Visiting level by level. Step ${steps} of ${total}.` : 'Breadth-first search reaches every node, nearest first. The numbers show the order.'}</p>
            <div><button type="button" onClick={walk} disabled={running}><Play size={14}/> Walk it</button><button type="button" onClick={reset} disabled={steps === 0 && !running}><RotateCcw size={14}/> Reset</button></div>
        </figcaption>
    </figure>;
}
