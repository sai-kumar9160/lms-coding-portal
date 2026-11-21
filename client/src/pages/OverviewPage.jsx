import { useState } from 'react';
import { BookOpen, Building2, CheckCircle2, ChevronDown, Download, PauseCircle, Users, X } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { PaginatedTable } from '../components/Pagination';
import { CourseLibrary } from '../components/CourseLibrary';
import { CollegeDirectory } from '../components/CollegeDirectory';
import { StudentPerformance } from '../components/StudentPerformance';

export function OverviewPage() {
    const { courses, users, colleges, isStudent, isSuper, inCollege, can } = useWorkspace();
    // A Super Admin working in a college sees that college's overview; otherwise the platform overview.
    const platformView = isSuper && !inCollege;
    const [showStudents, setShowStudents] = useState(false);
    const students = users.filter(u => u.role === 'STUDENT');
    const branchOf = u => u.cohorts?.map(row => row.cohort.name).join(', ') || 'Not assigned';
    const exportStudents = () => {
        const cell = v => `"${String(v ?? '').replaceAll('"', '""')}"`;
        const rows = [['Name', 'Email', 'Mobile', 'Branch', 'Status'], ...students.map(u => [u.name, u.email, u.mobileNo || '', branchOf(u), u.status])];
        const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
        const a = Object.assign(document.createElement('a'), { href: url, download: 'students.csv' });
        a.click(); URL.revokeObjectURL(url);
    };
    const completed = courses.flatMap(c => c.modules.flatMap(m => m.lessons)).filter(l => l.progress[0]?.completedAt).length;
    const stats = platformView
        ? [['Total colleges', colleges.length, Building2], ['Active colleges', colleges.filter(c => c.active).length, CheckCircle2], ['Suspended colleges', colleges.filter(c => !c.active).length, PauseCircle], ['Campus members', colleges.reduce((n, c) => n + (c._count?.users || 0), 0), Users]]
        : [['Available courses', courses.length, BookOpen], [isStudent ? 'Courses started' : 'Students', isStudent ? courses.filter(c => c.enrollments.length).length : users.filter(u => u.role === 'STUDENT').length, Users, !isStudent && can('people') ? 'students' : null], [isStudent ? 'Lessons completed' : 'Published courses', isStudent ? completed : courses.filter(c => c.status === 'PUBLISHED').length, CheckCircle2]];
    return <>
        {platformView && <div className="platform-overview-heading"><h1>Platform overview</h1><p>Your colleges, members, and activity at a glance.</p></div>}
        {isStudent ? <StudentPerformance/> : <section className={`stats${platformView ? ' platform-stats' : ''}`}>{stats.map(([title, count, Icon, to], n) => {
            const body = <>
                <span className="stat-icon"><Icon size={24}/></span>
                <div><small>{title}</small><strong>{String(count).padStart(2, '0')}</strong></div>
                {to && <ChevronDown size={18} className="stat-chevron"/>}
            </>;
            return to
                ? <button type="button" key={title} className={`stat stat-link tone-${n % 4}${showStudents ? ' open' : ''}`} aria-expanded={showStudents} onClick={() => setShowStudents(v => !v)}>{body}</button>
                : <div key={title} className={`stat tone-${n % 4}`}>{body}</div>;
        })}</section>}
        {showStudents && !isStudent && <section className="panel student-drill"><div className="section-title"><div><h2>Students</h2><p className="muted">{students.length} enrolled</p></div><div className="drill-actions"><button type="button" className="secondary drill-export" disabled={!students.length} onClick={exportStudents}><Download size={15}/>Export to Excel</button><button type="button" className="text-button" aria-label="Close students" onClick={() => setShowStudents(false)}><X size={18}/></button></div></div>{students.length === 0 ? <p className="muted">No students yet.</p> : <PaginatedTable className="drill-table"><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Mobile</th><th>Branch</th><th>Status</th></tr></thead><tbody>{students.map((u, n) => <tr key={u.id}><td className="drill-num">{n + 1}</td><td><span className="drill-person"><span className="mini-avatar">{u.name.slice(0, 1).toUpperCase()}</span><strong>{u.name}</strong></span></td><td>{u.email}</td><td>{u.mobileNo || '—'}</td><td>{branchOf(u)}</td><td><span className={`drill-status ${u.status === 'ACTIVE' ? 'on' : ''}`}>{u.status === 'ACTIVE' ? 'Active' : u.status}</span></td></tr>)}</tbody></PaginatedTable>}</section>}
        {platformView && can('colleges') ? <CollegeDirectory/> : !isStudent && can('courses') ? <CourseLibrary title="Your learning space"/> : null}
    </>;
}
