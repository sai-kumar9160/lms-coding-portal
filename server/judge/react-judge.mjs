// Judge for React problems. The runner starts it as:  node react-judge.mjs App.jsx <python>
// stdin is one test case, as JSON:  { "props": { ... }, "check": { ... } }
// The student's file must `export default` a component. It is compiled (JSX), rendered once on the server with the
// given props, and the HTML it produces goes through the same structure checks as HTML & CSS problems
// (see html-judge.py for the check types). The first render is what is checked, so effects and clicks do not run.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { buildSync } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const [, , sourceFile, python] = process.argv;
const spec = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');

function fail(message) {
    process.stderr.write(`${message}\n`);
    process.exit(1);
}

let bundle;
try {
    // Only react and react-dom may be imported by a solution; anything else cannot be resolved and is reported.
    bundle = buildSync({
        stdin: { contents: fs.readFileSync(sourceFile, 'utf8'), loader: 'jsx', resolveDir: here, sourcefile: 'App.jsx' },
        bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent', jsx: 'automatic',
        external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/*'],
    }).outputFiles[0].text;
}
catch (error) {
    fail(`Compile error: ${(error.errors?.[0]?.text ?? error.message)}${error.errors?.[0]?.location ? ` (line ${error.errors[0].location.line})` : ''}`);
}

const module_ = { exports: {} };
try {
    new Function('require', 'module', 'exports', bundle)(require, module_, module_.exports);
}
catch (error) {
    fail(`Error while loading your component: ${error.message}`);
}
const Component = module_.exports.default ?? module_.exports;
if (typeof Component !== 'function' && !(Component && typeof Component === 'object' && Component.$$typeof))
    fail('Your file must export a component: export default function App(props) { ... }');

const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let html;
try {
    html = renderToStaticMarkup(React.createElement(Component, spec.props ?? {}));
}
catch (error) {
    fail(`Error while rendering your component: ${error.message}`);
}

// Hand the rendered page to the HTML checker.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lms-react-'));
try {
    fs.writeFileSync(path.join(dir, 'index.html'), `<!DOCTYPE html><html lang="en"><head><title>App</title></head><body>${html}</body></html>`);
    const out = execFileSync(python, ['-I', '-X', 'utf8', path.join(here, 'html-judge.py'), path.join(dir, 'index.html')], { input: JSON.stringify(spec.check ?? {}), encoding: 'utf8' });
    process.stdout.write(out);
}
finally {
    fs.rmSync(dir, { recursive: true, force: true });
}
