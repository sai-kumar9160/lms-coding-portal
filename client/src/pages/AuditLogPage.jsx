import { Fragment, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useWorkspace } from '../workspace';

const entityTypes = ['academic_year', 'department', 'program', 'batch', 'cohort', 'student_profile', 'teacher_profile', 'user', 'college', 'role_permissions', 'course', 'course_module', 'lesson', 'course_instructor', 'file'];
const label = value => value.replaceAll('_', ' ');
const when = value => new Date(value).toLocaleString();

function Changes({ item }) {
    const show = value => value === undefined || value === null ? '—' : JSON.stringify(value, null, 2);
    return <div className="audit-changes">
        <div><small className="eyebrow">BEFORE</small><pre>{show(item.before)}</pre></div>
        <div><small className="eyebrow">AFTER</small><pre>{show(item.after)}</pre></div>
        <p className="muted">Request {item.requestId || '—'} · IP {item.ipAddress || '—'} · {item.userAgent || 'unknown browser'}</p>
    </div>;
}

// Who changed what, and when: newest first, filtered, loaded 50 at a time.
export function AuditLogPage() {
    const { api, college, isSuper } = useWorkspace();
    const [filters, setFilters] = useState({ entityType: '', from: '', to: '' });
    const [items, setItems] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [cursors, setCursors] = useState([null]);
    const [open, setOpen] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    async function load(cursor = null, requestedPage = 1) {
        setLoading(true); setError('');
        try {
            const query = new URLSearchParams(Object.entries({ ...filters, limit: pageSize, ...(cursor ? { cursor } : {}) }).filter(([, value]) => value));
            const page = await api(`/audit-logs?${query}`);
            setItems(page.items);
            setPageNumber(requestedPage);
            setOpen(null);
            setCursors(current => requestedPage === 1 ? [null] : [...current.slice(0, requestedPage - 1), cursor]);
            setNextCursor(page.nextCursor);
        }
        catch (loadError) { setError(loadError.message); }
        finally { setLoading(false); }
    }
    // Reload when the Super Admin switches college.
    useEffect(() => { load(); }, [college?.id, pageSize]);
    const change = field => event => setFilters(current => ({ ...current, [field]: event.target.value }));
    return <section className="panel">
        <div className="section-title"><h2>Audit log</h2><span>{isSuper ? (college ? college.name : 'All colleges') : college?.name}</span></div>
        <form className="audit-filters" onSubmit={event => { event.preventDefault(); load(); }}>
            <label>What changed<select value={filters.entityType} onChange={change('entityType')}><option value="">Everything</option>{entityTypes.map(type => <option key={type} value={type}>{label(type)}</option>)}</select></label>
            <label>From<input type="date" value={filters.from} onChange={change('from')}/></label>
            <label>To<input type="date" value={filters.to} onChange={change('to')}/></label>
            <button className="primary" disabled={loading}><Search size={16}/>Apply</button>
        </form>
        {error && <div role="alert" className="alert">{error}</div>}
        <div className="table-wrap"><table>
            <thead><tr><th></th><th>When</th><th>Who</th>{isSuper && !college && <th>College</th>}<th>Action</th><th>What</th></tr></thead>
            <tbody>{items.map(item => <Fragment key={item.id}>
                <tr className="audit-row" onClick={() => setOpen(open === item.id ? null : item.id)}>
                    <td>{open === item.id ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}</td>
                    <td>{when(item.occurredAt)}</td>
                    <td>{item.actor ? <><strong>{item.actor.name}</strong><br/><small className="muted">{item.actor.email}</small></> : '—'}{item.actingAsSuperAdmin ? <span className="tag pending">as Super Admin</span> : null}</td>
                    {isSuper && !college && <td>{item.collegeName || 'Platform'}</td>}
                    <td><span className="tag">{label(item.action)}</span></td>
                    <td>{label(item.entityType)} <small className="muted">{item.entityId ? item.entityId.slice(0, 8) : ''}</small></td>
                </tr>
                {open === item.id && <tr><td colSpan={isSuper && !college ? 6 : 5}><Changes item={item}/></td></tr>}
            </Fragment>)}</tbody>
        </table></div>
        {!items.length && !loading && <p className="muted">No changes recorded for these filters.</p>}
        <div className="problem-pagination">
            <div className="pagination-summary"><label>Rows per page<select value={pageSize} disabled={loading} onChange={event => setPageSize(Number(event.target.value))}>{[10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></label><span aria-live="polite">{items.length ? `Showing ${(pageNumber - 1) * pageSize + 1}-${(pageNumber - 1) * pageSize + items.length}` : 'No entries'}</span></div>
            <nav className="pagination-navigation" aria-label="Audit log pagination"><button type="button" className="secondary" disabled={loading || pageNumber === 1} onClick={() => load(cursors[pageNumber - 2], pageNumber - 1)}>Previous</button><span>Page {pageNumber}</span><button type="button" className="secondary" disabled={loading || !nextCursor} onClick={() => load(nextCursor, pageNumber + 1)}>Next</button></nav>
        </div>
    </section>;
}
