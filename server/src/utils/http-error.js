// Throw an error that error.middleware.js turns into the given HTTP status and message.
export function fail(status, message) {
    throw Object.assign(new Error(message), { status });
}

export function notFound(name) {
    fail(404, `${name} not found`);
}
