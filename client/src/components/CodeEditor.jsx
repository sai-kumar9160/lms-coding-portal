import { lazy, Suspense } from 'react';

// Monaco (the VS Code editor) is loaded on demand so other pages do not download it.
const MonacoEditor = lazy(() => import('./MonacoEditor'));

export function CodeEditor({ value, onChange, language, label = 'Code editor', readOnly = false }) {
    return <div className="code-editor monaco" aria-label={label}>
        <Suspense fallback={<div className="editor-loading">Loading editor...</div>}>
            <MonacoEditor value={value} onChange={onChange} language={language} readOnly={readOnly}/>
        </Suspense>
    </div>;
}
