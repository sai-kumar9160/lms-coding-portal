import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Lesson files are stored on local disk under UPLOAD_DIR (default server/uploads):
//   colleges/<collegeId>/<yyyy>/<mm>/<fileId>.<ext>   and   tmp/ for uploads in progress.
// Move UPLOAD_DIR to shared storage (or replace the storage service with S3) when running several servers.
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const megabytes = (name, fallback) => {
    const value = Number(process.env[name] || fallback);
    if (!Number.isInteger(value) || value < 1 || value > 4096)
        throw new Error(`${name} must be a whole number of megabytes between 1 and 4096`);
    return value * 1024 * 1024;
};

export const uploadConfig = {
    root: path.resolve(serverRoot, process.env.UPLOAD_DIR || 'uploads'),
    maxBytes: {
        VIDEO: megabytes('UPLOAD_MAX_VIDEO_MB', 500),
        DOCUMENT: megabytes('UPLOAD_MAX_DOCUMENT_MB', 50),
    },
};
