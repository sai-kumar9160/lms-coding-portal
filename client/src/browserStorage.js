const preferenceKeys = new Set(['lms-sidebar-closed', 'lms-code-lang']);
// Preserve harmless preferences; remove credentials, drafts and college context.
export function clearLmsStorage(storage) {
    try {
        for (let index = storage.length - 1; index >= 0; index--) {
            const key = storage.key(index);
            if (!preferenceKeys.has(key) && (key?.startsWith('lms-') || key === 'x-access-token')) storage.removeItem(key);
        }
    } catch { /* Storage can be disabled by browser policy. */ }
}
export function clearBrowserSession() {
    try { clearLmsStorage(localStorage); } catch { /* unavailable */ }
    try { clearLmsStorage(sessionStorage); } catch { /* unavailable */ }
}
// Remove legacy persistent source code and credentials while keeping preferences.
try { clearLmsStorage(localStorage); } catch { /* unavailable */ }
// Persist initial preferences as well as later user changes.
try {
    for (const [key, value] of Object.entries({ 'lms-sidebar-closed': '0', 'lms-code-lang': 'python' })) {
        if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
    }
} catch { /* unavailable */ }
