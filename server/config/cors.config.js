import { createLogger } from '../src/utils/logger.js';

const log = createLogger('cors.config');

// Single allowlist used by both CORS and the API origin guard. Set CLIENT_ORIGINS in server/.env.
export const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173').split(',').map(origin => origin.trim()).filter(Boolean);

export const isAllowedOrigin = (origin) => allowedOrigins.includes(origin);

export const corsOptions = {
    // Requests without an Origin header (same-origin, curl, server-to-server) are not CORS requests.
    // Disallowed origins get no CORS headers; originGuard then rejects them with 403.
    origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin))
            return callback(null, true);
        log.warn('Blocked CORS origin', { origin });
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-access-token', 'x-csrf-token', 'x-request-id', 'x-college-id'],
    // The client reads refreshed access tokens and request IDs from these response headers.
    exposedHeaders: ['x-access-token', 'x-request-id'],
    maxAge: 600,
};
