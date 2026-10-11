import test from 'node:test';
import assert from 'node:assert/strict';

const reply = (status, data) => ({ status, ok: status >= 200 && status < 300, json: async () => data });

test('response header tokens are reused and permission denial does not log out', async () => {
    const originalFetch = globalThis.fetch;
    try {
        const api = await import(`./api.js?headers=${Date.now()}`);
        let calls = 0;
        globalThis.fetch = async (_url, options) => {
            calls++;
            assert.equal(options.cache, 'no-store');
            if (calls === 1) return { ...reply(200, {}), headers: { get: key => key === 'x-access-token' ? 'header-token' : null } };
            assert.equal(options.headers['x-access-token'], 'header-token');
            assert.equal(options.headers['x-csrf-token'], undefined);
            if (calls === 2) return reply(403, { message: 'Not permitted' });
            return reply(200, {});
        };
        await api.request('/auth/login', 'POST', {});
        await assert.rejects(api.request('/restricted'), { status: 403 });
        await api.request('/allowed');
    } finally { globalThis.fetch = originalFetch; }
});

test('storage cleanup preserves other applications', async () => {
    const { clearLmsStorage } = await import('./browserStorage.js');
    const values = new Map([['lms-code:old', 'draft'], ['x-access-token', 'old'], ['other-app', 'keep'], ['lms-sidebar-closed', '1'], ['lms-code-lang', 'java']]);
    const storage = { get length() { return values.size; }, key: i => [...values.keys()][i], removeItem: key => values.delete(key) };
    clearLmsStorage(storage);
    assert.deepEqual([...values], [['other-app', 'keep'], ['lms-sidebar-closed', '1'], ['lms-code-lang', 'java']]);
});

test('lesson loading recovers stale credentials before refreshing', async () => {
    const originalFetch = globalThis.fetch;
    const originalStorage = globalThis.sessionStorage;
    globalThis.sessionStorage = { removeItem() {} };
    try {
        const api = await import(`./api.js?recovery=${Date.now()}`);
        const calls = [];
        let reads = 0;
        globalThis.fetch = async (url, options) => {
            calls.push(url);
            assert.equal(options.credentials, 'include');
            if (url === '/api/auth/login') return reply(200, { token: 'old', csrfToken: 'stale' });
            if (url === '/api/auth/session') return reply(200, { token: 'current', csrfToken: 'current-csrf' });
            if (url === '/api/auth/refresh') {
                assert.equal(options.headers['x-csrf-token'], 'current-csrf');
                return reply(200, { token: 'renewed', csrfToken: 'current-csrf' });
            }
            if (++reads === 1) return reply(401, { message: 'Access token expired' });
            assert.equal(options.headers['x-access-token'], 'renewed');
            return reply(200, { content: '# Readable lesson' });
        };
        await api.request('/auth/login', 'POST', {});
        assert.equal((await api.request('/lessons/example/content')).content, '# Readable lesson');
        assert.deepEqual(calls.slice(1), ['/api/lessons/example/content', '/api/auth/session', '/api/auth/refresh', '/api/lessons/example/content']);
    } finally {
        globalThis.fetch = originalFetch;
        globalThis.sessionStorage = originalStorage;
    }
});

test('an expired cookie session does not trigger refresh or retry', async () => {
    const originalFetch = globalThis.fetch;
    const originalStorage = globalThis.sessionStorage;
    globalThis.sessionStorage = { removeItem() {} };
    try {
        const api = await import(`./api.js?expired=${Date.now()}`);
        const calls = [];
        globalThis.fetch = async url => {
            calls.push(url);
            return reply(401, { message: 'Session expired' });
        };
        await assert.rejects(api.request('/lessons/example/content'), { status: 401 });
        assert.deepEqual(calls, ['/api/lessons/example/content', '/api/auth/session']);
    } finally {
        globalThis.fetch = originalFetch;
        globalThis.sessionStorage = originalStorage;
    }
});
