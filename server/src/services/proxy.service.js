import { loadProxyTargets } from '../../config/proxy.config.js';
import { createLogger } from '../utils/logger.js';
import { fail, notFound } from '../utils/http-error.js';

const log = createLogger('proxy.service');
// Validated at startup so a bad PROXY_TARGETS stops the server instead of failing per request.
const targets = loadProxyTargets();
// Only these upstream content types are passed through; anything else is sent as a download.
const passThroughTypes = /^(application\/json|text\/plain|text\/csv|application\/pdf|image\/(png|jpeg|gif|webp))\b/i;

async function readLimited(response, maxBytes) {
    if (Number(response.headers.get('content-length')) > maxBytes)
        fail(502, 'Upstream response is too large');
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body ?? []) {
        size += chunk.length;
        if (size > maxBytes)
            fail(502, 'Upstream response is too large');
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

export const proxyService = {
    // Forwards an authenticated request to an allowlisted service. The caller's cookie, JWT and CSRF
    // token are never forwarded; the upstream receives identity headers and its own API key instead.
    async forward(req) {
        const name = req.params.service;
        if (!Object.hasOwn(targets, name))
            notFound('Proxy service');
        const target = targets[name];
        if (!target.roles.includes(req.identity.role))
            fail(403, 'You do not have permission');
        const segments = req.params.path ?? [];
        if (segments.some(segment => !segment || segment === '.' || segment === '..'))
            fail(400, 'Invalid proxy path');
        const url = new URL(target.url);
        url.pathname = `${url.pathname.replace(/\/$/, '')}/${segments.map(encodeURIComponent).join('/')}`;
        url.search = new URL(req.originalUrl, 'http://localhost').search;
        const headers = { accept: req.get('accept') || 'application/json', 'x-request-id': req.id, 'x-lms-user-id': req.identity.id, 'x-lms-role': req.identity.role };
        if (req.collegeId)
            headers['x-lms-college-id'] = req.collegeId;
        if (target.apiKeyHeader && target.apiKeyEnv) {
            const key = process.env[target.apiKeyEnv];
            if (!key) {
                log.error('Proxy API key is not configured', { service: name, apiKeyEnv: target.apiKeyEnv });
                fail(503, 'Proxy service is not configured');
            }
            headers[target.apiKeyHeader] = key;
        }
        let body;
        if (!['GET', 'HEAD'].includes(req.method) && req.body !== undefined) {
            headers['content-type'] = 'application/json';
            body = JSON.stringify(req.body);
        }
        const started = Date.now();
        try {
            // The timeout covers the whole exchange, including reading the body.
            // Redirects are not followed, so an upstream cannot bounce the request to another host.
            const response = await fetch(url, { method: req.method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(target.timeoutMs) });
            if (response.status >= 300 && response.status < 400)
                fail(502, 'Upstream redirect not followed');
            const contentType = response.headers.get('content-type') || '';
            const result = { status: response.status, contentType: passThroughTypes.test(contentType) ? contentType : 'application/octet-stream', body: await readLimited(response, target.maxResponseBytes) };
            log.info('Proxied request', { service: name, method: req.method, status: response.status, ms: Date.now() - started, requestId: req.id });
            return result;
        }
        catch (error) {
            if (error.status)
                throw error;
            const timedOut = error.name === 'TimeoutError';
            log.warn('Proxy request failed', { service: name, requestId: req.id, error: timedOut ? 'timeout' : error.message });
            fail(timedOut ? 504 : 502, timedOut ? 'Upstream service timed out' : 'Upstream service unavailable');
        }
    },
};
