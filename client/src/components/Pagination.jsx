import { Children, cloneElement, isValidElement, useEffect, useState } from 'react';

function usePages(items) {
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const count = Math.max(1, Math.ceil(items.length / size));
    const current = Math.min(page, count);
    const firstKey = items[0]?.key;
    useEffect(() => { setPage(1); }, [firstKey]);
    useEffect(() => { setPage(value => Math.min(value, count)); }, [count]);
    return { page: current, size, count, total: items.length, start: (current - 1) * size, setPage, setSize };
}

function Controls({ state }) {
    const { page, size, count, total, start, setPage, setSize } = state;
    if (!total) return null;
    return <div className="problem-pagination">
        <div className="pagination-summary"><label>Rows per page<select value={size} onChange={event => { setSize(Number(event.target.value)); setPage(1); }}>{[10, 20, 50].map(value => <option key={value} value={value}>{value}</option>)}</select></label><span aria-live="polite">Showing {start + 1}–{Math.min(start + size, total)} of {total}</span></div>
        <nav className="pagination-navigation" aria-label="Pagination">
            <button type="button" className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
            {Array.from({ length: count }, (_, i) => i + 1).filter(number => number === 1 || number === count || Math.abs(number - page) <= 1).map((number, index, visible) => <span key={number} className="pagination-page">{index > 0 && number - visible[index - 1] > 1 && <span aria-hidden="true">…</span>}<button type="button" className={number === page ? 'primary' : 'secondary'} aria-label={`Page ${number}`} aria-current={number === page ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button></span>)}
            <button type="button" className="secondary" disabled={page === count} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
    </div>;
}

export function PaginatedTable({ children, ...props }) {
    const sections = Children.toArray(children);
    const body = sections.find(child => isValidElement(child) && child.type === 'tbody');
    const rows = Children.toArray(body?.props.children);
    const state = usePages(rows);
    return <div className="paginated-table"><div className="table-wrap"><table {...props}>{sections.map(child => child === body ? cloneElement(child, {}, rows.slice(state.start, state.start + state.size)) : child)}</table></div><Controls state={state}/></div>;
}

export function PaginatedItems({ children, className }) {
    const items = Children.toArray(children);
    const state = usePages(items);
    return <><div className={className}>{items.slice(state.start, state.start + state.size)}</div><Controls state={state}/></>;
}
