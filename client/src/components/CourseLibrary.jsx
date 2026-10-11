import { PaginatedItems } from './Pagination';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { useWorkspace } from '../workspace';

const statusLabels = { DRAFT: 'Draft', PUBLISHED: 'Published', ARCHIVED: 'Archived' };

function CourseCard({ course, index }) {
    const { api, act, busy, reload, setModal, can } = useWorkspace();
    // No enrollment step: learners open any published course; progress appears once they have started.
    const learner = can('enrollments', 'update');
    const lessons = course.modules.flatMap(m => m.lessons);
    const enrollment = course.enrollments[0];
    const published = course.status === 'PUBLISHED';
    const togglePublished = () => act(async () => { await api(`/courses/${course.id}`, 'PATCH', { status: published ? 'DRAFT' : 'PUBLISHED' }); await reload(); });
    return <article className="course-card">
        <div className={`course-cover cover-${index % 3}`}><span className="tag">{statusLabels[course.status]}</span><div className="cover-symbol">{['{ }', '</>', 'Aa'][index % 3]}</div><span className="cover-caption">CAMPUS / LEARNING SERIES</span></div>
        <div className="course-body">
            <small className="eyebrow">{lessons.length} LESSON{lessons.length !== 1 ? 'S' : ''} · SELF-PACED</small>
            <h3>{course.title}</h3><p>{course.description}</p>
            <div className="instructor"><span className="mini-avatar">{course.teacher.name.charAt(0).toUpperCase()}</span>{course.teacher.name}</div>
            {learner && enrollment && <div className="progress"><div><span>Course progress</span><strong>{enrollment.progressPct}%</strong></div><progress max={100} value={enrollment.progressPct}/></div>}
            <div className="course-actions">
                {learner && <button className="text-button" onClick={() => setModal(course.id)}>{enrollment ? 'Continue learning' : 'Start learning'} <ArrowUpRight size={16}/></button>}
                {course.canEdit && <><button className="text-button" onClick={() => setModal(`manage:${course.id}`)}>Manage course</button><button className="text-button" onClick={() => setModal(course.id)}>View lessons</button><button disabled={busy} className="text-button" onClick={togglePublished}>{published ? 'Unpublish' : 'Publish'}</button></>}
            </div>
        </div>
    </article>;
}

export function CourseLibrary({ title }) {
    const { courses, isStudent, can, inCollege } = useWorkspace();
    if (!inCollege)
        return <div className="empty"><BookOpen size={36}/><h3>Choose a college</h3><p>Pick a college in “Working in” at the top to view and manage its courses.</p></div>;
    return <section>
        <div className="section-title"><div><h2>{title}</h2><p className="muted">{isStudent ? 'Find your next opportunity to grow.' : 'Create, publish, and share knowledge.'}</p></div><span>{courses.length} courses</span></div>
        {!courses.length
            ? <div className="empty"><BookOpen size={36}/><h3>Your first course starts here</h3><p>{can('courses', 'create') ? 'Create a course to start sharing your knowledge.' : 'Published courses will appear here.'}</p></div>
            : <PaginatedItems className="course-grid">{courses.map((c, i) => <CourseCard key={c.id} course={c} index={i}/>)}</PaginatedItems>}
    </section>;
}
