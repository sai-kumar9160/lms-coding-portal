import Editor, { loader } from '@monaco-editor/react';
// Bundled locally (no CDN): the editor core with its standard features, plus syntax highlighting for the
// languages the judge offers. Language services (TypeScript/JSON workers) are left out to keep the bundle small.
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution';
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution';
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution';
import 'monaco-editor/esm/vs/basic-languages/kotlin/kotlin.contribution';
import 'monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution';
import 'monaco-editor/esm/vs/basic-languages/php/php.contribution';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };
loader.config({ monaco });

// Judge language id -> Monaco language mode.
const MODES = { python: 'python', java: 'java', c: 'c', cpp: 'cpp', javascript: 'javascript', csharp: 'csharp', go: 'go', kotlin: 'kotlin', ruby: 'ruby', php: 'php' };

export default function MonacoEditor({ value, onChange, language, height = '100%', readOnly = false }) {
    return <Editor
        height={height}
        language={MODES[language] ?? 'plaintext'}
        theme="vs-dark"
        value={value}
        onChange={next => onChange?.(next ?? '')}
        options={{
            fontSize: 14, fontFamily: "Consolas, 'Cascadia Code', Menlo, monospace", tabSize: 4, insertSpaces: true,
            minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, readOnly,
            renderLineHighlight: 'line', smoothScrolling: true, padding: { top: 12, bottom: 12 }, wordWrap: 'off',
        }}
        loading={<div className="editor-loading">Loading editor...</div>}
    />;
}
