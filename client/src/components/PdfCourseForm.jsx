import { useState } from 'react';
import { FileUp, Upload } from 'lucide-react';
import { uploadForm } from '../api';
import { useWorkspace } from '../workspace';

const levels = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };

// Creates a draft course from a PDF: chapters become lessons with their formatted text, code, tables and figures.
export function PdfCourseForm() {
    const { reload, setModal, setNotice } = useWorkspace();
    const [file, setFile] = useState(null);
    const [form, setForm] = useState({ title: '', code: '', level: '', description: '' });
    const [stage, setStage] = useState(null); // null | number (upload %) | 'converting'
    const [error, setError] = useState('');
    const change = field => event => setForm(current => ({ ...current, [field]: event.target.value }));
    function choose(event) {
        const picked = event.target.files[0];
        if (!picked) return;
        setFile(picked);
        // Suggest a course name from the file name.
        if (!form.title) setForm(current => ({ ...current, title: picked.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').slice(0, 150) }));
    }
    async function submit(event) {
        event.preventDefault();
        if (!file) return setError('Choose a PDF first.');
        setError(''); setStage(0);
        try {
            const result = await uploadForm('/courses/from-pdf', { ...form, file }, pct => setStage(pct >= 100 ? 'converting' : pct));
            await reload();
            setModal('');
            setNotice(`“${result.title}” was created as a draft: ${result.units} unit${result.units !== 1 ? 's' : ''}, ${result.lessons} lessons, ${result.images} figures. Review it in Courses, then publish.`);
        }
        catch (uploadError) {
            setError(uploadError.message);
            setStage(null);
        }
    }
    const working = stage !== null;
    return <form onSubmit={submit}>
        <p className="muted">Upload a PDF of course notes. Each chapter becomes a lesson with its text, example programs, tables and diagrams. The course is created as a <strong>draft</strong> so you can review it before students see it.</p>
        {error && <div role="alert" className="alert">{error}</div>}
        <div className="upload-box">
            {file ? <span><FileUp size={15}/> <strong>{file.name}</strong> · {(file.size / 1048576).toFixed(1)} MB</span> : <span className="muted">Course notes PDF (text PDFs work best; scanned images cannot be read)</span>}
            {!working && <label className="text-button file-button"><Upload size={15}/>{file ? 'Choose another' : 'Choose PDF'}<input type="file" accept="application/pdf" onChange={choose} hidden/></label>}
        </div>
        <label>Course name<input required minLength={3} maxLength={150} value={form.title} onChange={change('title')} placeholder="e.g. Java Programming"/></label>
        <div className="field-row">
            <label>Course code (optional)<input maxLength={20} value={form.code} onChange={change('code')} placeholder="e.g. JV101"/></label>
            <label>Level (optional)<select value={form.level} onChange={change('level')}><option value="">Not set</option>{Object.entries(levels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <label>Short description (optional)<textarea rows={2} maxLength={2000} value={form.description} onChange={change('description')}/></label>
        {working && <div className="convert-status" role="status">
            {stage === 'converting' ? <><span className="spinner" aria-hidden="true"/> Converting the PDF into lessons… large PDFs can take a minute or two.</> : <><progress max={100} value={stage}/> Uploading {stage}%</>}
        </div>}
        <button className="primary full" disabled={working || !file}>{working ? 'Please wait…' : 'Create course from PDF'}</button>
    </form>;
}
