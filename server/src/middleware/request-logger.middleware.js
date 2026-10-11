import { randomUUID } from 'node:crypto';
import { createLogger } from '../utils/logger.js';

const log = createLogger('http');
const validRequestId = /^[A-Za-z0-9-]{8,64}$/;

// Gives every request an x-request-id and logs one line when the response finishes.
// Only method, path, status, timing and identity are logged: never bodies, query strings or headers,
// because they can contain passwords and tokens.
export function requestLogger(req, res, next) {
    const incoming = req.get('x-request-id');
    req.id = incoming && validRequestId.test(incoming) ? incoming : randomUUID();
    res.setHeader('x-request-id', req.id);
    const started = process.hrtime.bigint();
    res.on('finish', () => {
        const ms = Number(process.hrtime.bigint() - started) / 1e6;
        // req.path is relative to the router mount point here; originalUrl keeps the /api prefix.
        const path = req.originalUrl.split('?')[0];
        const level = res.statusCode >= 500 ? 'error' : path === '/api/health' ? 'debug' : 'info';
        log[level](`${req.method} ${path} ${res.statusCode} ${ms.toFixed(1)}ms`, { requestId: req.id, userId: req.identity?.id, collegeId: req.collegeId, ...(req.actingAsSuperAdmin ? { actingAsSuperAdmin: true } : {}), ip: req.ip });
    });
    next();
}
