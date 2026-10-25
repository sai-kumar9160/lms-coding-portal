import { z } from 'zod';
import { createLogger } from '../utils/logger.js';

const log = createLogger('error.middleware');
// PostgreSQL error code for a duplicate value in a unique index.
const UNIQUE_VIOLATION = '23505';
// An id in the URL that is not a number (for example /courses/abc) reaches PostgreSQL as text and is rejected there.
const INVALID_TEXT = '22P02';
export function notFound(_req, res) { res.status(404).json({ message: 'Endpoint not found' }); }
export function errorHandler(error, req, res, _next) {
    const status = error instanceof z.ZodError ? 400 : error.code === UNIQUE_VIOLATION ? 409 : error.code === INVALID_TEXT ? 400 : error.status || 500;
    const message = error instanceof z.ZodError ? error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') : status === 409 ? 'This record already exists' : error.code === INVALID_TEXT ? 'That id is not valid' : status === 500 ? `An unexpected error occurred (reference ${req.id})` : error.message;
    if (status >= 500) {
        log.error(error.message || 'Internal Server Error', { requestId: req.id, path: req.originalUrl || req.path, status, stack: error.stack });
    } else {
        log.warn(message || 'Request rejected', { requestId: req.id, path: req.originalUrl || req.path, status });
    }
    // The request ID lets users report a failure that can be found in the server log.
    res.status(status).json({ message });
}
