import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { codeRunnerConfig as config } from '../../config/code-runner.config.js';
import { createLogger } from '../utils/logger.js';
import { fail } from '../utils/http-error.js';

const log = createLogger('code-runner');
const exe = process.platform === 'win32' ? 'main.exe' : './main';
const { commands } = config;

// Each language: source file name, optional compile step, run command, Judge0 language id.
// Java and C# programs must use a class named Main. Languages without `run` are offered only through Judge0.
const LANGUAGES = {
    python: { label: 'Python 3', file: 'main.py', check: [commands.python, ['--version']], run: [commands.python, ['-I', '-X', 'utf8', 'main.py']], judge0: 71 },
    java: { label: 'Java 17', file: 'Main.java', check: [commands.javac, ['-version']], compile: [commands.javac, ['-encoding', 'UTF-8', 'Main.java']], run: [commands.java, ['-Xmx256m', '-Xss64m', '-cp', '.', 'Main']], judge0: 62, timeFactor: 2 },
    c: { label: 'C (GCC)', file: 'main.c', check: [commands.gcc, ['--version']], compile: [commands.gcc, ['-O2', '-std=c17', '-o', exe, 'main.c', '-lm']], run: [exe, []], judge0: 50 },
    cpp: { label: 'C++17 (G++)', file: 'main.cpp', check: [commands.gxx, ['--version']], compile: [commands.gxx, ['-O2', '-std=c++17', '-o', exe, 'main.cpp']], run: [exe, []], judge0: 54 },
    javascript: { label: 'JavaScript (Node.js)', file: 'main.js', check: [commands.node, ['--version']], run: [commands.node, ['--max-old-space-size=256', 'main.js']], judge0: 63 },
    csharp: { label: 'C#', file: 'Main.cs', judge0: 51 },
    go: { label: 'Go', file: 'main.go', check: ['go', ['version']], compile: ['go', ['build', '-o', exe, 'main.go']], run: [exe, []], judge0: 60, timeFactor: 1.5 },
    kotlin: { label: 'Kotlin', file: 'Main.kt', judge0: 78, timeFactor: 2 },
    ruby: { label: 'Ruby', file: 'main.rb', check: ['ruby', ['--version']], run: ['ruby', ['main.rb']], judge0: 72 },
    php: { label: 'PHP', file: 'main.php', check: ['php', ['--version']], run: ['php', ['main.php']], judge0: 68 },
};

let detected;
// Every language with whether this server can run it now (detected once; restart after installing a compiler).
export function languages() {
    detected ??= Object.entries(LANGUAGES).map(([id, lang]) => ({
        id, label: lang.label,
        available: config.mode === 'judge0' || (config.mode === 'local' && Boolean(lang.run) && !spawnSync(lang.check[0], lang.check[1], { timeout: 10000, windowsHide: true }).error),
    }));
    return detected;
}

// Output comparison ignores trailing spaces on each line and blank lines at the end, like most judges.
export function sameOutput(actual, expected) {
    const norm = (text) => text.replace(/\r\n?/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').replace(/\n+$/, '');
    return norm(actual) === norm(expected);
}

// A small queue so a burst of submissions cannot start hundreds of processes.
let running = 0;
const waiting = [];
async function slot(task) {
    if (running >= config.maxParallel) {
        if (waiting.length >= config.maxQueue)
            fail(503, 'The code runner is busy. Try again in a few seconds.');
        await new Promise(resolve => waiting.push(resolve));
    }
    running++;
    try { return await task(); }
    finally {
        running--;
        waiting.shift()?.();
    }
}

const clip = (text, bytes) => text.length > bytes ? `${text.slice(0, bytes)}\n... (output cut)` : text;

// Runs one process with stdin, a wall-clock limit and an output cap. Never rejects.
function exec(command, args, { cwd, input = '', timeMs }) {
    return new Promise(resolve => {
        const started = process.hrtime.bigint();
        const env = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: cwd, TMP: cwd, HOME: cwd, LANG: 'C.UTF-8', PYTHONIOENCODING: 'utf-8' };
        const child = spawn(command, args, { cwd, env, windowsHide: true });
        let stdout = '', stderr = '', killedFor = null;
        const stop = (reason) => { killedFor ??= reason; child.kill('SIGKILL'); };
        const timer = setTimeout(() => stop('TIME_LIMIT'), timeMs);
        child.stdout.setEncoding('utf8').on('data', chunk => {
            stdout += chunk;
            if (stdout.length > config.maxOutputBytes) stop('OUTPUT_LIMIT');
        });
        child.stderr.setEncoding('utf8').on('data', chunk => { if (stderr.length < 16384) stderr += chunk; });
        child.stdin.on('error', () => {}); // the program may exit without reading its input
        child.stdin.end(input);
        child.on('error', error => { clearTimeout(timer); resolve({ code: -1, stdout, stderr: error.message, killedFor: 'START_FAILED', timeMs: 0 }); });
        child.on('close', code => {
            clearTimeout(timer);
            resolve({ code, stdout, stderr, killedFor, timeMs: Number((process.hrtime.bigint() - started) / 1000000n) });
        });
    });
}

function verdict(run, expected, compare = sameOutput) {
    if (run.killedFor === 'TIME_LIMIT') return 'TIME_LIMIT';
    if (run.killedFor || run.code !== 0) return 'RUNTIME_ERROR';
    return expected === undefined || compare(run.stdout, expected) ? 'PASSED' : 'WRONG_ANSWER';
}

async function runLocal(lang, code, cases, timeLimitMs, compare) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lms-code-'));
    try {
        fs.writeFileSync(path.join(dir, lang.file), code);
        if (lang.compile) {
            const built = await exec(lang.compile[0], lang.compile[1], { cwd: dir, timeMs: 30000 });
            if (built.code !== 0)
                return { compileError: clip(`${built.stderr}${built.stdout}`.trim() || 'Compilation failed', 8000), results: [] };
        }
        const results = [];
        for (const test of cases) {
            const run = await exec(lang.run[0] === exe ? path.join(dir, exe) : lang.run[0], lang.run[1], { cwd: dir, input: test.input, timeMs: timeLimitMs * (lang.timeFactor || 1) });
            results.push({ status: verdict(run, test.expectedOutput, compare), stdout: clip(run.stdout, 65536), stderr: clip(run.stderr, 4000), timeMs: run.timeMs });
        }
        return { results };
    }
    finally {
        fs.rm(dir, { recursive: true, force: true, maxRetries: 3 }, () => {});
    }
}

async function runJudge0(lang, code, cases, timeLimitMs, compare, memoryMb) {
    const b64 = (text) => Buffer.from(text ?? '', 'utf8').toString('base64');
    const text = (value) => value ? Buffer.from(value, 'base64').toString('utf8') : '';
    const results = [];
    for (const test of cases) {
        const response = await fetch(`${config.judge0Url}/submissions?base64_encoded=true&wait=true`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...(config.judge0Key ? { 'X-Auth-Token': config.judge0Key } : {}) },
            body: JSON.stringify({ language_id: lang.judge0, source_code: b64(code), stdin: b64(test.input), cpu_time_limit: (timeLimitMs * (lang.timeFactor || 1)) / 1000, memory_limit: memoryMb * 1024 }),
            signal: AbortSignal.timeout(60000),
        }).catch(error => ({ ok: false, statusText: error.message }));
        if (!response.ok) {
            log.error('Judge0 request failed', { status: response.status, text: response.statusText });
            fail(503, 'The code runner is not reachable right now.');
        }
        const body = await response.json();
        if (body.status?.id === 6)
            return { compileError: clip(text(body.compile_output) || 'Compilation failed', 8000), results: [] };
        const run = { code: body.status?.id >= 7 ? 1 : 0, stdout: text(body.stdout), stderr: text(body.stderr), killedFor: body.status?.id === 5 ? 'TIME_LIMIT' : null };
        results.push({ status: verdict(run, test.expectedOutput, compare), stdout: clip(run.stdout, 65536), stderr: clip(run.stderr, 4000), timeMs: Math.round(Number(body.time || 0) * 1000) });
    }
    return { results };
}

// Runs code against test cases ({ input, expectedOutput? }). compare(actual, expected) decides a match (default: trimmed).
// Returns { compileError?, results: [{ status, stdout, stderr, timeMs }], limits } where limits records what was applied.
export async function runProgram(language, code, cases, timeLimitMs = 2000, { compare = sameOutput, memoryMb = 256 } = {}) {
    if (config.mode === 'off')
        fail(503, 'Running code is turned off on this server.');
    if (!languages().some(l => l.id === language && l.available))
        fail(400, 'This language is not installed on this server yet.');
    if (Buffer.byteLength(code, 'utf8') > config.maxSourceBytes)
        fail(400, 'The program is too long (64 KB at most).');
    const lang = LANGUAGES[language];
    const limits = { runner: config.mode, language, languageLabel: lang.label, timeLimitMs: Math.round(timeLimitMs * (lang.timeFactor || 1)), memoryMb: config.mode === 'judge0' ? memoryMb : null, outputBytes: config.maxOutputBytes };
    const result = await slot(() => config.mode === 'judge0' ? runJudge0(lang, code, cases, timeLimitMs, compare, memoryMb) : runLocal(lang, code, cases, timeLimitMs, compare));
    return { ...result, limits };
}
