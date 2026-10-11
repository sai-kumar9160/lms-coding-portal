import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Download, FileText } from 'lucide-react';
import { fileUrl } from '../api';
import { useWorkspace } from '../workspace';
import { LessonArticle } from './LessonArticle';

const completedAt = lesson => lesson.progress[0]?.completedAt;

// One lesson as a readable page: the chapter text with code, tables and figures, plus previous/next navigation.
export function LessonReader({ course, lesson, unit, previous, next, onOpen }) {
    const { act, busy, api, reload, setNotice, can } = useWorkspace();
    const [showPdf, setShowPdf] = useState(false);
    const learner = can('enrollments', 'update');
    const hasPdf = lesson.file && lesson.lessonType === 'DOCUMENT';
    const complete = () => act(async () => { await api(`/lessons/${lesson.id}/complete`, 'POST'); await reload(); setNotice('Lesson completed. Keep up the progress!'); });
    return <div className="lesson-reader">
        <div className="lesson-reader-bar"><span className="muted">{unit.title}</span>{lesson.published !== 1 && <span className="tag pending">Hidden from students</span>}</div>
        <h1 className="lesson-reader-title">{lesson.title}</h1>
        <div className="lesson-reader-tools">
            {previous ? <button className="secondary small" onClick={() => onOpen(previous)}><ArrowLeft size={15}/>Previous</button> : <span/>}
            {next && <button className="primary small" onClick={() => onOpen(next)}>Next<ArrowRight size={15}/></button>}
        </div>
        <LessonArticle lessonId={lesson.id}/>
        {hasPdf && <div className="lesson-reader-pdf">
            <button className="text-button" onClick={() => setShowPdf(value => !value)}><FileText size={15}/>{showPdf ? 'Hide original PDF pages' : 'View original PDF pages'}</button>
            {(lesson.allowDownload === 1 || course.canEdit) && <a className="text-button" href={fileUrl(lesson.file.id, true)}><Download size={15}/>Download chapter PDF</a>}
        </div>}
        {showPdf && <iframe className="chapter-pdf" src={fileUrl(lesson.file.id)} title={lesson.title}/>}
        <div className="lesson-reader-footer">
            {previous ? <button className="secondary" onClick={() => onOpen(previous)}><ArrowLeft size={15}/>{previous.title}</button> : <span/>}
            {learner && <button className="primary" disabled={busy || Boolean(completedAt(lesson))} onClick={complete}><CheckCircle2 size={16}/>{completedAt(lesson) ? 'Completed' : 'Mark complete'}</button>}
            {next ? <button className="secondary" onClick={() => onOpen(next)}>{next.title}<ArrowRight size={15}/></button> : <span/>}
        </div>
    </div>;
}
