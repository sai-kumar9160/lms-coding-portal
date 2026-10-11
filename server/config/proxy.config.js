import { z } from 'zod';
import { Role } from '@prisma/client';

// Express "trust proxy": only set when a reverse proxy (nginx, load balancer) terminates HTTPS.
// TRUST_PROXY accepts a hop count (1), 'loopback', 'uniquelocal', or comma-separated proxy IPs/subnets.
// 'true' would trust any X-Forwarded-For value from any client, so it is rejected.
export function trustProxySetting(value = process.env.TRUST_PROXY) {
    if (!value)
        return null;
    if (value === 'true')
        throw new Error('TRUST_PROXY=true trusts every client. Use a hop count or the proxy addresses.');
    return /^\d+$/.test(value) ? Number(value) : value;
}

// Allowlisted upstream services for /api/proxy/:service/* (APCMMS cfms/erp proxy controllers, as one registry).
// PROXY_TARGETS is JSON, for example:
// {"judge":{"url":"http://localhost:2358","roles":["TEACHER","STUDENT"],"timeoutMs":10000,"apiKeyHeader":"x-api-key","apiKeyEnv":"JUDGE_API_KEY"}}
// The API key itself stays in its own environment variable (apiKeyEnv), never in PROXY_TARGETS.
const targetSchema = z.object({
    url: z.string().url().refine(url => ['http:', 'https:'].includes(new URL(url).protocol), 'Proxy URL must be http or https'),
    roles: z.array(z.nativeEnum(Role)).min(1),
    timeoutMs: z.number().int().min(100).max(120000).default(10000),
    maxResponseBytes: z.number().int().min(1024).max(50 * 1024 * 1024).default(5 * 1024 * 1024),
    apiKeyHeader: z.string().regex(/^[A-Za-z0-9-]+$/).optional(),
    apiKeyEnv: z.string().regex(/^[A-Z0-9_]+$/).optional(),
});
const targetsSchema = z.record(z.string().regex(/^[a-z0-9-]+$/), targetSchema);

export function loadProxyTargets(value = process.env.PROXY_TARGETS) {
    if (!value)
        return {};
    let parsed;
    try {
        parsed = JSON.parse(value);
    }
    catch {
        throw new Error('PROXY_TARGETS must be valid JSON');
    }
    return targetsSchema.parse(parsed);
}
