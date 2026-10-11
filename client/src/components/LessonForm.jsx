import { useEffect, useState } from 'react';
import { Save, Upload } from 'lucide-react';
import { request, uploadFile } from '../api';

const types = { TEXT: 'Text', VIDEO: 'Video', DOCUMENT: 'PDF document' };
const accept = { VIDEO: 'video/mp4,video/webm', DOCUMENT: 'application/pdf' };

// Reads a video's length in the browser so students see durations and progress is capped correctly.
function videoDuration(file) {
    return new Promise(resolve => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        const done = value => { URL.revokeObjectURL(url); resolve(value); };
        video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? Math.round(video.duration) : null);
        video.onerror = () => done(null);
        video.src = url;
    });
}

// Adds or edits one lesson: text, an uploaded video, or an uploaded PDF.
export function LessonForm({ course, moduleId, lesson, onDone }) {
    const [draft, setDraft] = useState({
        title: lesson?.title || '', position: lesson?.position ?? 0, lessonType: lesson?.lessonType || 'TEXT', content: lesson?.content || '',
        file: lesson?.file || null, durationSec: lesson?.durationSec ?? null, allowDownload: lesson?.allowDownload === 1,
        published: lesson ? lesson.published === 1 : true, prerequisiteLessonId: lesson?.prerequisiteLessonId || '',
    });
    const [uploadPct, setUploadPct] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    // Formatted chapters are not included in course lists; load the full text before editing so saving never erases it.
    const [contentReady, setContentReady] = useState(!lesson?.hasArticle);
    useEffect(() => {
        if (!lesson?.hasArticle) return;
        request(`/lessons/${lesson.id}/content`).then(full => { setDraft(current => ({ ...current, content: full.content })); setContentReady(true); }).catch(loadError => setError(loadError.message));
    }, [lesson?.id]);
    const change = (field, value) => setDraft(current => ({ ...current, [field]: value }));
    const otherLessons = course.modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title }))).filter(l => l.id !== lesson?.id);
    function changeType(lessonType) {
        // A file only fits the type it was uploaded for.
        setDraft(current => ({ ...current, lessonType, file: null, durationSec: null, allowDownload: false }));
    }
    async function chooseFile(event) {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file)
            return;
        setError(''); setUploadPct(0);
        try {
            const [uploaded, durationSec] = await Promise.all([uploadFile(file, draft.lessonType, setUploadPct), draft.lessonType === 'VIDEO' ? videoDuration(file) : null]);
            setDraft(current => ({ ...current, file: uploaded, durationSec, title: current.title || file.name.replace(/\.[^.]+$/, '').slice(0, 150) }));
        }
        catch (uploadError) { setError(uploadError.message); }
        finally { setUploadPct(null); }
    }
    async function save(event) {
        event.preventDefault(); setBusy(true); setError('');
        try {
            const base = `/courses/${course.id}/modules/${moduleId}/lessons`;
            const body = { title: draft.title, position: Number(draft.position), lessonType: draft.lessonType, content: draft.content, fileId: draft.file?.id ?? null, durationSec: draft.durationSec, allowDownload: draft.allowDownload, published: draft.published, prerequisiteLessonId: draft.prerequisiteLessonId || null };
            await request(lesson ? `${base}/${lesson.id}` : base, lesson ? 'PATCH' : 'POST', body);
            await onDone(true);
        }
        catch (saveError) { setError(saveError.message); setBusy(false); }
    }
    const media = draft.lessonType !== 'TEXT';
    return <form onSubmit={save}>
        <h3>{lesson ? 'Edit' : 'Add'} lesson</h3>
        {error && <div role="alert" className="alert">{error}</div>}
        <div className="field-row">
            <label>Lesson type<select value={draft.lessonType} onChange={event => changeType(event.target.value)}>{Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Order (0 is first)<input required type="number" min={0} max={10000} value={draft.position} onChange={event => change('position', event.target.value)}/></label>
        </div>
        <label>Title<input required minLength={2} maxLength={150} value={draft.title} onChange={event => change('title', event.target.value)}/></label>
        {media && <div className="upload-box">
            {draft.file ? <span><strong>{draft.file.originalName}</strong> · {(draft.file.sizeBytes / 1048576).toFixed(1)} MB{draft.durationSec ? ` · ${Math.floor(draft.durationSec / 60)}:${String(draft.durationSec % 60).padStart(2, '0')}` : ''}</span> : <span className="muted">{draft.lessonType === 'VIDEO' ? 'MP4 or WebM video' : 'PDF document'}</span>}
            {uploadPct !== null ? <span className="upload-progress"><progress max={100} value={uploadPct}/> {uploadPct}%</span>
                : <label className="text-button file-button"><Upload size={15}/>{draft.file ? 'Replace file' : 'Upload file'}<input type="file" accept={accept[draft.lessonType]} onChange={chooseFile} hidden/></label>}
        </div>}
        <label>{media ? 'Notes for students (optional)' : 'Lesson content'}<textarea required={!media} minLength={media ? 0 : 10} maxLength={100000} rows={lesson?.hasArticle ? 16 : media ? 3 : 8} value={draft.content} onChange={event => change('content', event.target.value)}/></label>
        <label>Prerequisite lesson<select value={draft.prerequisiteLessonId} onChange={event => change('prerequisiteLessonId', event.target.value)}><option value="">None</option>{otherLessons.map(l => <option key={l.id} value={l.id}>{l.moduleTitle} · {l.title}</option>)}</select></label>
        <div className="check-row">
            <label className="check"><input type="checkbox" checked={draft.published} onChange={event => change('published', event.target.checked)}/>Visible to students</label>
            {draft.lessonType === 'DOCUMENT' && <label className="check"><input type="checkbox" checked={draft.allowDownload} onChange={event => change('allowDownload', event.target.checked)}/>Allow download</label>}
        </div>
        <div className="manager-actions"><button className="primary" disabled={busy || !contentReady || uploadPct !== null || (media && !draft.file)}><Save size={16}/>{busy ? 'Saving…' : 'Save lesson'}</button><button className="text-button" type="button" disabled={busy} onClick={() => onDone(false)}>Cancel</button></div>
    </form>;
}
