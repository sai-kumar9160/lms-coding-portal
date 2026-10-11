import { BookOpen, Building2, CheckCircle2, PauseCircle, Users } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { CourseLibrary } from '../components/CourseLibrary';
import { CollegeDirectory } from '../components/CollegeDirectory';

export function OverviewPage() {
    const { courses, users, colleges, isStudent, isSuper, inCollege, can } = useWorkspace();
    // A Super Admin working in a college sees that college's overview; otherwise the platform overview.
    const platformView = isSuper && !inCollege;
    const completed = courses.flatMap(c => c.modules.flatMap(m => m.lessons)).filter(l => l.progress[0]?.completedAt).length;
    const stats = platformView
        ? [['Total colleges', colleges.length, Building2], ['Active colleges', colleges.filter(c => c.active).length, CheckCircle2], ['Suspended colleges', colleges.filter(c => !c.active).length, PauseCircle], ['Campus members', colleges.reduce((n, c) => n + (c._count?.users || 0), 0), Users]]
        : [['Available courses', courses.length, BookOpen], [isStudent ? 'Courses started' : 'Campus members', isStudent ? courses.filter(c => c.enrollments.length).length : users.length, Users], [isStudent ? 'Lessons completed' : 'Published courses', isStudent ? completed : courses.filter(c => c.status === 'PUBLISHED').length, CheckCircle2]];
    return <>
        {platformView && <div className="platform-overview-heading"><h1>Platform overview</h1><p>Your colleges, members, and activity at a glance.</p></div>}
        <section className={`stats${platformView ? ' platform-stats' : ''}`}>{stats.map(([title, count, Icon]) => <div className="stat" key={title}><span className="stat-icon"><Icon size={22}/></span><div><small>{title}</small><strong>{String(count).padStart(2, '0')}</strong></div></div>)}</section>
        {platformView && can('colleges') ? <CollegeDirectory/> : can('courses') ? <CourseLibrary title="Your learning space"/> : null}
    </>;
}
