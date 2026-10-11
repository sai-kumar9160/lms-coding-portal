import { PaginatedItems } from '../components/Pagination';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen, CheckCircle2, Home, Lock, PlayCircle, Plus } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { SyllabusView } from '../components/SyllabusView';
import { LessonReader } from '../components/LessonReader';

const levels = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };
const completedAt = lesson => lesson.progress[0]?.completedAt;
const hiddenLessonTitles = new Set(['interview questions and answers (in progress)', 'core java index']);
const visibleLessons = lessons => lessons.filter(lesson => !hiddenLessonTitles.has(lesson.title.trim().replace(/\s+/g, ' ').toLowerCase()));

// Tutorial layout: the course's lessons in a left sidebar,
// and the selected lesson's text on the right. URL: /courses?course=<id>&lesson=<id>.
export function CoursesPage() {
    const { courses, inCollege, can, college, setModal, isSuper, colleges, switchCollege, busy } = useWorkspace();
    const [params, setParams] = useSearchParams();
    const selectedCourse = courses.find(c => c.id === params.get('course'));
    const course = selectedCourse && { ...selectedCourse, modules: selectedCourse.modules.map(module => ({ ...module, lessons: visibleLessons(module.lessons) })) };
    const lessonId = params.get('lesson');
    useEffect(() => { window.scrollTo({ top: 0 }); }, [course?.id, lessonId]);
    if (!inCollege)
        return <section className="panel">
            <div className="section-title"><div><h2>Courses</h2><p className="muted">Choose a college to create and manage its courses.</p></div></div>
            {isSuper && <label className="people-college-picker">College<select value="" disabled={busy} onChange={event => switchCollege(event.target.value)}><option value="">Choose an existing college</option>{colleges.map(item => <option key={item.id} value={item.id}>{item.name} ({item.slug}){item.active ? '' : ' (suspended)'}</option>)}</select></label>}
            <div className="empty"><BookOpen size={36}/><h3>Select a college to get started</h3><p>You can add a course from scratch or upload a PDF after selecting a college.</p></div>
        </section>;
    if (!courses.length)
        return <section className="panel"><div className="section-title"><div><h2>Courses</h2><p className="muted">{college?.name}</p></div>{can('courses', 'create') && <button className="primary" disabled={busy} onClick={() => setModal('course')}><Plus size={16}/> Add course</button>}</div><div className="empty"><BookOpen size={36}/><h3>No courses yet</h3><p>{can('courses', 'create') ? 'Add your first course from scratch or from a PDF.' : 'Published courses will appear here.'}</p></div></section>;
    if (!course)
        return <section>
            <div className="section-title"><div><h2>Courses</h2><p className="muted">Choose a course to start reading.</p></div><span className="row-actions"><span>{courses.length} course{courses.length !== 1 ? 's' : ''}</span>{can('courses', 'create') && <button className="primary" disabled={busy} onClick={() => setModal('course')}><Plus size={16}/> Add course</button>}</span></div>
            <PaginatedItems className="course-options">{courses.map(c => {
                const count = c.modules.reduce((n, m) => n + visibleLessons(m.lessons).length, 0);
                return <button key={c.id} className="course-option" onClick={() => setParams({ course: c.id })}>
                    <span className="course-option-tags">{c.code && <span className="tag">{c.code}</span>}{c.level && <span className="tag">{levels[c.level]}</span>}{c.collegeId !== college?.id && <span className="tag shared">Shared</span>}{c.canEdit && c.status !== 'PUBLISHED' && <span className="tag pending">{c.status === 'DRAFT' ? 'Draft' : 'Archived'}</span>}</span>
                    <strong>{c.title}</strong>
                    <small className="muted">{c.modules.length} unit{c.modules.length !== 1 ? 's' : ''} · {count} lessons{c.durationHours ? ` · ${c.durationHours} hours` : ''}</small>
                    <span className="course-option-open">Start reading <ArrowUpRight size={15}/></span>
                </button>;
            })}</PaginatedItems>
        </section>;

    const learner = can('enrollments', 'update');
    const lessons = course.modules.flatMap(m => m.lessons.map(l => ({ ...l, unit: m })));
    // Students must finish a lesson's prerequisite before opening it.
    const lockedBy = (lesson) => { const pre = learner && lesson.prerequisiteLessonId && lessons.find(l => l.id === lesson.prerequisiteLessonId); return pre && !completedAt(pre) ? pre : null; };
    const open = (lesson) => {
        if (lesson.lessonType === 'VIDEO') return setModal(course.id); // videos play in the lesson player
        setParams({ course: course.id, lesson: lesson.id });
    };
    const reading = lessons.find(l => l.id === lessonId && !lockedBy(l));
    const index = reading ? lessons.indexOf(reading) : -1;
    const neighbour = (step) => { for (let i = index + step; i >= 0 && i < lessons.length; i += step) if (!lockedBy(lessons[i])) return lessons[i]; return null; };
    const showUnits = course.modules.length > 1;
    return <section>
        <button className="text-button back-to-courses" onClick={() => setParams({})}><ArrowLeft size={15}/>All courses</button>
        <div className="tutorial">
            <aside className="tutorial-nav" aria-label={`${course.title} lessons`}>
                <h2>{course.title}</h2>
                <button className={!reading ? 'active' : ''} onClick={() => setParams({ course: course.id })}><Home size={14}/>Course home</button>
                {course.modules.map(module => <div key={module.id}>
                    {showUnits && <small className="tutorial-unit">{module.title}</small>}
                    {module.lessons.map(lesson => {
                        const blocker = lockedBy(lesson);
                        return <button key={lesson.id} className={`${reading?.id === lesson.id ? 'active' : ''}${blocker ? ' locked' : ''}`} disabled={Boolean(blocker)} title={blocker ? `Complete "${blocker.title}" first` : lesson.title} onClick={() => open({ ...lesson, unit: module })}>
                            {lesson.lessonType === 'VIDEO' && <PlayCircle size={14}/>}
                            <span>{lesson.title}</span>
                            {blocker ? <Lock size={13}/> : completedAt(lesson) ? <CheckCircle2 size={14} className="done"/> : lesson.published !== 1 ? <small className="muted">hidden</small> : null}
                        </button>;
                    })}
                </div>)}
            </aside>
            <div className="tutorial-content">
                {reading
                    ? <LessonReader key={reading.id} course={course} lesson={reading} unit={reading.unit} previous={neighbour(-1)} next={neighbour(1)} onOpen={open}/>
                    : <SyllabusView course={course} onOpenLesson={open}/>}
            </div>
        </div>
    </section>;
}
