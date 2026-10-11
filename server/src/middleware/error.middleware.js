import { z } from 'zod';
import { createLogger } from '../utils/logger.js';

const log = createLogger('error.middleware');
export function notFound(_req, res) { res.status(404).json({ message: 'Endpoint not found' }); }
export function errorHandler(error, req, res, _next) {
    const status = error instanceof z.ZodError ? 400 : error.code === 'P2002' ? 409 : error.code === 'P2025' ? 404 : error.status || 500;
    const message = error instanceof z.ZodError ? error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') : status === 409 ? 'This record already exists' : status === 500 ? `An unexpected error occurred (reference ${req.id})` : error.message;
    if (status >= 500) {
        log.error(error.message || 'Internal Server Error', { requestId: req.id, path: req.originalUrl || req.path, status, stack: error.stack });
    } else {
        log.warn(message || 'Request rejected', { requestId: req.id, path: req.originalUrl || req.path, status });
    }
    // The request ID lets users report a failure that can be found in the server log.
    res.status(status).json({ message });
}
