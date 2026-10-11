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

function write(level, context, message, meta) {
    const config = settings();
    if (levels[level] > config.threshold)
        return;
    const ts = new Date().toISOString();
    const details = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console[consoleMethod[level]](`[${level.toUpperCase()}|${context}|${ts}] ${message}${details}`);
    if (config.toFile)
        fileStream(config).write(`${JSON.stringify({ ts, level, context, message, ...meta })}\n`);
}

export function createLogger(context) {
    return Object.fromEntries(Object.keys(levels).map(level => [level, (message, meta) => write(level, context, message, meta)]));
}
