import { clearBrowserSession } from './browserStorage.js';
let accessToken = '';
let csrfToken = '';
let renewing = null;
// Super Admin college switcher: the college whose data requests act on (sent as x-college-id).
let collegeContext = '';
export function setCollegeContext(collegeId) { collegeContext = collegeId || ''; }
export function clearAuth(clearStorage = true) {
    accessToken = ''; csrfToken = '';
    if (clearStorage) { collegeContext = ''; clearBrowserSession(); }
    try { sessionStorage.removeItem('lms-token'); } catch { /* unavailable */ }
}
function remember(data) {
    if (data.token)
        accessToken = data.token;
    if (data.csrfToken)
        csrfToken = data.csrfToken;
}
async function send(path, method, body) {
    const response = await fetch(`/api${path}`, { method, credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(accessToken ? { 'x-access-token': accessToken } : {}), ...(csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method) ? { 'x-csrf-token': csrfToken } : {}), ...(collegeContext ? { 'x-college-id': collegeContext } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const token = response.ok && response.headers?.get('x-access-token');
    if (token) accessToken = token;
    return response;
}
// Uploads a lesson file with progress events (fetch cannot report upload progress, so this uses XHR).
export function uploadFile(file, purpose, onProgress) {
    return uploadForm(`/files?purpose=${purpose}`, { file }, onProgress);
}
// Posts a multipart form (files and text fields) with upload progress. onProgress(100) means the upload is done;
// the server may still be working (for example converting a PDF) until the promise settles.
export async function uploadForm(path, fields, onProgress) {
    // Any authenticated request renews an expired access token before the upload starts.
    await request('/me');
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api${path}`);
        xhr.withCredentials = true;
        xhr.setRequestHeader('x-access-token', accessToken);
        xhr.setRequestHeader('x-csrf-token', csrfToken);
        if (collegeContext)
            xhr.setRequestHeader('x-college-id', collegeContext);
        xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100)); };
        xhr.onload = () => {
            const token = xhr.status >= 200 && xhr.status < 300 && xhr.getResponseHeader('x-access-token');
            if (token) accessToken = token;
            let data = {};
            try { data = JSON.parse(xhr.responseText); } catch { /* non-JSON error page */ }
            if (xhr.status >= 200 && xhr.status < 300) resolve(data);
            else reject(Object.assign(new Error(data.message || 'Upload failed'), { status: xhr.status }));
        };
        // A server that rejects the request before the file finishes uploading (for example a missing route) also lands here.
        xhr.onerror = () => reject(new Error('Upload failed: the server closed the connection. Check your connection and that the backend is running the latest version, then try again.'));
        const form = new FormData();
        // Text fields first, file last, so the server reads the fields before the file arrives.
        for (const [key, value] of Object.entries(fields))
            if (!(value instanceof Blob) && value !== undefined && value !== null) form.append(key, value);
        for (const [key, value] of Object.entries(fields))
            if (value instanceof Blob) form.append(key, value);
        xhr.send(form);
    });
}
// Downloads an authenticated API response (for example the generated syllabus PDF) as a file.
export async function downloadFile(path, fallbackName) {
    await request('/me'); // renews an expired access token first
    const response = await send(path, 'GET');
    if (!response.ok) {
        let message = 'Download failed';
        try { message = (await response.json()).message || message; } catch { /* not JSON */ }
        throw Object.assign(new Error(message), { status: response.status });
    }
    const name = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || fallbackName;
    const url = URL.createObjectURL(await response.blob());
    const link = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Media elements cannot send headers, so the Super Admin's college goes in the query string.
export function fileUrl(fileId, download = false) {
    const query = new URLSearchParams({ ...(download ? { download: '1' } : {}), ...(collegeContext ? { college: collegeContext } : {}) }).toString();
    return `/api/files/${fileId}/content${query ? `?${query}` : ''}`;
}
export async function restoreSession() {
    // The server cookie restores a session; access tokens stay in memory.
    clearAuth(false);
    const response = await send('/auth/session', 'GET');
    if (response.status === 401)
        return null;
    const data = await response.json();
    if (!response.ok)
        throw new Error(data.message || 'Unable to restore session');
    remember(data);
    return data;
}
export async function request(path, method = 'GET', body) {
    let response = await send(path, method, body);
    if (response.status === 401 && !path.startsWith('/auth/')) {
        // Serialize refreshes so simultaneous requests use the same renewed token.
        if (!renewing)
            renewing = (async () => {
                // A dev reload or another tab can leave in-memory credentials stale.
                // Recover the current cookie session's credentials before the CSRF-protected refresh.
                const session = await send('/auth/session', 'GET');
                const current = await session.json();
                if (!session.ok) {
                    clearAuth();
                    throw Object.assign(new Error(current.message || 'Session expired'), { status: session.status });
                }
                remember(current);
                const refresh = await send('/auth/refresh', 'POST');
                const data = await refresh.json();
                if (!refresh.ok) {
                    clearAuth();
                    throw Object.assign(new Error(data.message || 'Session expired'), { status: refresh.status });
                }
                remember(data);
            })().finally(() => { renewing = null; });
        await renewing;
        response = await send(path, method, body);
    }
    const data = await response.json();
    if (!response.ok) {
        if (response.status === 401)
            clearAuth();
        throw Object.assign(new Error(data.message || 'Request failed'), { status: response.status });
    }
    if (path === '/auth/login')
        remember(data);
    if (path === '/auth/logout')
        clearAuth();
    return data;
}
