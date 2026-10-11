import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Application logger in the APCMMS logmessages style: readable console lines plus a daily
// JSON-lines file in server/logs (app-YYYY-MM-DD.log), pruned after LOG_RETENTION_DAYS.
// Usage: const log = createLogger('course.model'); log.info('Course created', { courseId });
// Never pass passwords, tokens or request bodies as metadata.
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const consoleMethod = { error: 'error', warn: 'warn', info: 'log', debug: 'log' };
const defaultDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'logs');
let stream = null;
let streamDay = '';

const settings = () => ({
    threshold: levels[process.env.LOG_LEVEL] ?? (process.env.NODE_ENV === 'test' ? levels.warn : levels.info),
    toFile: process.env.LOG_TO_FILE !== 'false' && process.env.NODE_ENV !== 'test',
    directory: process.env.LOG_DIR || defaultDirectory,
    retentionDays: Number(process.env.LOG_RETENTION_DAYS || 14),
});

function prune(directory, retentionDays) {
    const cutoff = Date.now() - retentionDays * 86400000;
    for (const name of fs.readdirSync(directory)) {
        const match = /^app-(\d{4}-\d{2}-\d{2})\.log$/.exec(name);
        if (match && new Date(match[1]).getTime() < cutoff)
            fs.rmSync(path.join(directory, name), { force: true });
    }
}

// Opens a new file when the date changes, so each day has its own log.
function fileStream({ directory, retentionDays }) {
    const day = new Date().toISOString().slice(0, 10);
    if (day !== streamDay) {
        stream?.end();
        fs.mkdirSync(directory, { recursive: true });
        stream = fs.createWriteStream(path.join(directory, `app-${day}.log`), { flags: 'a' });
        stream.on('error', error => console.error(`[ERROR|logger] ${error.message}`));
        streamDay = day;
        try { prune(directory, retentionDays); } catch (error) { console.error(`[ERROR|logger] ${error.message}`); }
    }
    return stream;
}

const useColor = process.env.NO_COLOR === undefined && process.env.NODE_ENV !== 'test';

const ANSI = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    red: '\x1b[31m',
    brightRed: '\x1b[91m',
    green: '\x1b[32m',
    brightGreen: '\x1b[92m',
    yellow: '\x1b[33m',
    brightYellow: '\x1b[93m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

function formatConsole(level, context, ts, message, meta) {
    if (!useColor) {
        const details = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${level.toUpperCase()}|${context}|${ts}] ${message}${details}`;
    }

    const badge = level === 'error'
        ? `${ANSI.brightRed}${ANSI.bold}[ERROR]${ANSI.reset}`
        : level === 'warn'
        ? `${ANSI.brightYellow}${ANSI.bold}[WARN ]${ANSI.reset}`
        : level === 'info'
        ? `${ANSI.brightGreen}${ANSI.bold}[INFO ]${ANSI.reset}`
        : `${ANSI.gray}${ANSI.bold}[DEBUG]${ANSI.reset}`;

    const ctx = `${ANSI.cyan}[${context}]${ANSI.reset}`;
    const time = `${ANSI.gray}${ts}${ANSI.reset}`;
    const msgColor = level === 'error' ? ANSI.brightRed : level === 'warn' ? ANSI.brightYellow : level === 'debug' ? ANSI.gray : ANSI.reset;
    let line = `${badge} ${ctx} ${time} ${msgColor}${message}${ANSI.reset}`;

    if (meta && typeof meta === 'object') {
        const { stack, ...rest } = meta;
        if (Object.keys(rest).length > 0) {
            line += ` ${ANSI.gray}${JSON.stringify(rest)}${ANSI.reset}`;
        }
        if (stack) {
            line += `\n${ANSI.red}${stack}${ANSI.reset}`;
        }
    }
    return line;
}

function write(level, context, message, meta) {
    const config = settings();
    if (levels[level] > config.threshold)
        return;
    const ts = new Date().toISOString();
    console[consoleMethod[level]](formatConsole(level, context, ts, message, meta));
    if (config.toFile)
        fileStream(config).write(`${JSON.stringify({ ts, level, context, message, ...meta })}\n`);
}

export function createLogger(context) {
    return Object.fromEntries(Object.keys(levels).map(level => [level, (message, meta) => write(level, context, message, meta)]));
}
