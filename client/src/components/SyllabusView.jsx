import { useState } from 'react';
import { ArrowUpRight, BookOpen, CheckCircle2, ChevronDown, ChevronRight, Download, FileText, Lock, PlayCircle } from 'lucide-react';
import { downloadFile, fileUrl } from '../api';
import { useWorkspace } from '../workspace';

const levels = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };
const statuses = { DRAFT: 'Draft', PUBLISHED: 'Published', ARCHIVED: 'Archived' };
const icons = { TEXT: BookOpen, VIDEO: PlayCircle, DOCUMENT: FileText };
const lines = text => (text || '').split('\n').map(line => line.trim()).filter(Boolean);
const completedAt = lesson => lesson.progress[0]?.completedAt;

// The full syllabus of one course, read from the database: details, objectives, units with lessons,
// outcomes, the original notes PDF, and a generated syllabus PDF. Clicking a lesson calls onOpenLesson.
export function SyllabusView({ course, onOpenLesson }) {
    const { act, busy, setModal, setNotice, can, api, reload, college } = useWorkspace();
    // Every unit starts collapsed; units open on click.
    const [openUnits, setOpenUnits] = useState(() => new Set());
    const [showPdf, setShowPdf] = useState(false);
    const learner = can('enrollments', 'update');
    // Editing is decided per course by the server (owning college's admins and the course's instructors).
    const editor = course.canEdit;
    const lessons = course.modules.flatMap(m => m.lessons.map(l => ({ ...l, unit: m })));
    const done = lessons.filter(completedAt).length;
    const published = course.status === 'PUBLISHED';
    // Students must finish a lesson's prerequisite before opening it.
    const lockedBy = (lesson) => { const pre = learner && lesson.prerequisiteLessonId && lessons.find(l => l.id === lesson.prerequisiteLessonId); return pre && !completedAt(pre) ? pre : null; };
    const open = (lesson) => onOpenLesson(lesson);
    const toggleUnit = id => setOpenUnits(current => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
    const allOpen = openUnits.size === course.modules.length;
    const download = () => act(async () => { await downloadFile(`/courses/${course.id}/syllabus/pdf`, 'syllabus.pdf'); setNotice('Syllabus PDF downloaded.'); });
    const togglePublished = () => act(async () => { await api(`/courses/${course.id}`, 'PATCH', { status: published ? 'DRAFT' : 'PUBLISHED' }); await reload(); });
    return <article className="syllabus">
        <div className="syllabus-head">
            <div>
                <div className="syllabus-tags">{course.code && <span className="tag">{course.code}</span>}{course.level && <span className="tag">{levels[course.level]}</span>}{editor && <span className={`tag${published ? '' : ' pending'}`}>{statuses[course.status]}</span>}
                    {course.collegeId !== college?.id ? <span className="tag shared">Shared · from {course.college?.name}</span> : course.shared === 1 && <span className="tag shared">Shared with all colleges</span>}</div>
                <h2>{course.title}</h2>
                <p className="muted">{course.description}</p>
                <p className="syllabus-facts">{[course.durationHours && `${course.durationHours} hours`, `${course.modules.length} units`, `${lessons.length} lessons`, course.instructors.length && `Instructor${course.instructors.length > 1 ? 's' : ''}: ${course.instructors.map(i => i.user.name).join(', ')}`].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="syllabus-actions">
                <button className="secondary" disabled={busy} onClick={download}><Download size={16}/>Download syllabus PDF</button>
                {course.syllabusFile && <a className="secondary" href={fileUrl(course.syllabusFile.id, true)}><FileText size={16}/>Course notes PDF</a>}
                {editor && <><button className="text-button" onClick={() => setModal(`manage:${course.id}`)}>Manage course</button><button className="text-button" disabled={busy} onClick={togglePublished}>{published ? 'Unpublish' : 'Publish'}</button></>}
            </div>
        </div>
        {learner && course.enrollments[0] && <div className="progress"><div><span>Your progress</span><strong>{course.enrollments[0].progressPct}% · {done}/{lessons.length} lessons</strong></div><progress max={100} value={course.enrollments[0].progressPct}/></div>}

        {lines(course.objectives).length > 0 && <section className="syllabus-block"><h3>Learning objectives</h3><ul>{lines(course.objectives).map((line, i) => <li key={i}>{line}</li>)}</ul></section>}

        <section className="syllabus-block">
            <div className="section-title"><h3>Syllabus</h3><button className="text-button" onClick={() => setOpenUnits(allOpen ? new Set() : new Set(course.modules.map(m => m.id)))}>{allOpen ? 'Collapse all' : 'Expand all'}</button></div>
            {course.modules.map(module => {
                const unitOpen = openUnits.has(module.id);
                return <div className="syllabus-unit" key={module.id}>
                    <button className="syllabus-unit-head" aria-expanded={unitOpen} onClick={() => toggleUnit(module.id)}>
                        {unitOpen ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}<strong>{module.title}</strong><small className="muted">{module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}</small>
                    </button>
                    {unitOpen && <div className="syllabus-unit-body">
                        {module.description && <p className="muted">{module.description}</p>}
                        {module.lessons.map(lesson => {
                            const Icon = icons[lesson.lessonType] || BookOpen;
                            const blocker = lockedBy(lesson);
                            return <button key={lesson.id} className={`syllabus-lesson-head${blocker ? ' locked' : ''}`} disabled={Boolean(blocker)} title={blocker ? `Complete "${blocker.title}" first` : undefined} onClick={() => open({ ...lesson, unit: module })}>
                                <Icon size={16}/><span>{lesson.title}</span>
                                {lesson.published !== 1 && <span className="tag pending">Hidden</span>}
                                {completedAt(lesson) && <CheckCircle2 size={16} className="done"/>}
                                {blocker ? <Lock size={16}/> : <span className="open-lesson">Open <ArrowUpRight size={14}/></span>}
                            </button>;
                        })}
                    </div>}
                </div>;
            })}
        </section>

        {lines(course.outcomes).length > 0 && <section className="syllabus-block"><h3>Learning outcomes</h3><ul>{lines(course.outcomes).map((line, i) => <li key={i}>{line}</li>)}</ul></section>}

        {course.syllabusFile && <section className="syllabus-block">
            <div className="section-title"><h3>Course notes</h3><button className="text-button" onClick={() => setShowPdf(value => !value)}>{showPdf ? 'Hide PDF' : `View ${course.syllabusFile.originalName}`}</button></div>
            {showPdf && <iframe className="lesson-document" src={fileUrl(course.syllabusFile.id)} title={`${course.title} notes`}/>}
        </section>}
    </article>;
}
