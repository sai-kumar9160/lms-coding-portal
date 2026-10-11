import { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, Download, FileText, Lock, PlayCircle } from 'lucide-react';
import { fileUrl, request } from '../api';
import { useWorkspace } from '../workspace';
import { LessonArticle } from './LessonArticle';

const SAVE_EVERY_SEC = 15;
const icons = { TEXT: BookOpen, VIDEO: PlayCircle, DOCUMENT: FileText };
const completedAt = lesson => lesson.progress[0]?.completedAt;
const formatDuration = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

// Plays a lesson video, resumes at the saved position, saves position and watch time, and completes on "ended".
function VideoLesson({ lesson, learner, onEnded }) {
    const video = useRef(null);
    const tracking = useRef({ last: null, spent: 0, sinceSave: 0 });
    const save = () => {
        const t = tracking.current;
        const element = video.current;
        if (!learner || !element || t.spent < 1)
            return;
        const spentSec = Math.min(120, Math.round(t.spent));
        t.spent = 0; t.sinceSave = 0;
        // Progress saves are best-effort; a failed save is retried with the next one.
        request(`/lessons/${lesson.id}/progress`, 'POST', { positionSec: Math.floor(element.currentTime), spentSec }).catch(() => { t.spent += spentSec; });
    };
    useEffect(() => () => save(), [lesson.id]);
    function resume() {
        const position = lesson.progress[0]?.lastPositionSec || 0;
        if (position > 0 && position < video.current.duration - 5)
            video.current.currentTime = position;
    }
    // Counts only real playback: jumps from seeking (more than 2 seconds) are not watch time.
    function timeUpdate() {
        const t = tracking.current;
        const now = video.current.currentTime;
        if (t.last !== null && !video.current.paused) {
            const delta = now - t.last;
            if (delta > 0 && delta < 2) { t.spent += delta; t.sinceSave += delta; }
        }
        t.last = now;
        if (t.sinceSave >= SAVE_EVERY_SEC)
            save();
    }
    return <video ref={video} className="lesson-video" controls preload="metadata" src={fileUrl(lesson.file.id)} onLoadedMetadata={resume} onTimeUpdate={timeUpdate} onSeeking={() => { tracking.current.last = null; }} onPause={save} onEnded={() => { save(); onEnded(); }}>
        Your browser cannot play this video.
    </video>;
}

export function CourseViewer({ course }) {
    const { api, act, busy, reload, setNotice, can } = useWorkspace();
    const [lessonId, setLessonId] = useState(null);
    const learner = can('enrollments', 'update');
    const lessons = course.modules.flatMap(m => m.lessons);
    // Read the lesson from the latest course data so completion updates after reload.
    const lesson = lessons.find(l => l.id === lessonId);
    // A lesson is locked for students until its (visible) prerequisite is complete.
    const lockedBy = (l) => { const pre = learner && l.prerequisiteLessonId && lessons.find(p => p.id === l.prerequisiteLessonId); return pre && !completedAt(pre) ? pre : null; };
    const complete = (l) => act(async () => { await api(`/lessons/${l.id}/complete`, 'POST'); await reload(); setNotice('Lesson completed. Keep up the progress!'); });
    const enrollment = course.enrollments[0];
    return <>
        <span className="eyebrow">YOUR COURSE</span><h2>{course.title}</h2>
        {learner && <div className="progress"><div><span>Course progress</span><strong>{enrollment?.progressPct ?? 0}%</strong></div><progress max={100} value={enrollment?.progressPct ?? 0}/></div>}
        {lesson ? <>
            <button className="text-button" onClick={() => setLessonId(null)}>← All lessons</button>
            <h3>{lesson.title}</h3>
            {lesson.lessonType === 'VIDEO' && lesson.file && <VideoLesson key={lesson.id} lesson={lesson} learner={learner} onEnded={() => { if (learner && !completedAt(lesson)) complete(lesson); }}/>}
            {lesson.lessonType === 'DOCUMENT' && lesson.file && <>
                <iframe className="lesson-document" src={fileUrl(lesson.file.id)} title={lesson.title}/>
                {(lesson.allowDownload === 1 || !learner) && <a className="text-button" href={fileUrl(lesson.file.id, true)}><Download size={15}/>Download {lesson.file.originalName}</a>}
            </>}
            {lesson.hasArticle ? <LessonArticle lessonId={lesson.id}/> : lesson.content && <div className="lesson-content">{lesson.content}</div>}
            {learner && <button disabled={busy || Boolean(completedAt(lesson))} className="primary" onClick={() => complete(lesson)}><CheckCircle2 size={18}/> {completedAt(lesson) ? 'Completed' : 'Mark complete'}</button>}
        </> : course.modules.map(m => <div key={m.id}>
            <h3>{m.title}</h3>
            {m.lessons.map(l => {
                const Icon = icons[l.lessonType] || BookOpen;
                const blocker = lockedBy(l);
                return <button key={l.id} className={`lesson-row${blocker ? ' locked' : ''}`} disabled={Boolean(blocker)} title={blocker ? `Complete "${blocker.title}" first` : undefined} onClick={() => setLessonId(l.id)}>
                    <Icon size={18}/><span className="lesson-title">{l.title}{l.durationSec ? <small className="muted"> · {formatDuration(l.durationSec)}</small> : null}{l.published !== 1 && <span className="tag pending">Hidden</span>}</span>
                    {blocker ? <Lock size={18}/> : completedAt(l) ? <CheckCircle2 size={18}/> : <ChevronRight size={18}/>}
                </button>;
            })}
        </div>)}
    </>;
}
