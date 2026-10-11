import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { uploadConfig } from '../../config/upload.config.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('file-storage');
export const tmpDir = path.join(uploadConfig.root, 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

// File types are decided from the file's first bytes, never from the client's name or MIME type.
const signatures = [
    { purpose: 'DOCUMENT', mimeType: 'application/pdf', ext: 'pdf', test: head => head.subarray(0, 5).toString('latin1') === '%PDF-' },
    { purpose: 'VIDEO', mimeType: 'video/mp4', ext: 'mp4', test: head => head.subarray(4, 8).toString('latin1') === 'ftyp' },
    { purpose: 'VIDEO', mimeType: 'video/webm', ext: 'webm', test: head => head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
    { purpose: 'IMAGE', mimeType: 'image/png', ext: 'png', test: head => head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
    { purpose: 'IMAGE', mimeType: 'image/jpeg', ext: 'jpg', test: head => head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff },
];

export async function detectType(filePath) {
    const handle = await fs.promises.open(filePath, 'r');
    try {
        const head = Buffer.alloc(16);
        await handle.read(head, 0, 16, 0);
        return signatures.find(signature => signature.test(head)) ?? null;
    }
    finally {
        await handle.close();
    }
}

export async function sha256(filePath) {
    const hash = createHash('sha256');
    await pipeline(fs.createReadStream(filePath), hash);
    return hash.digest('hex');
}

// Resolves a storage key to an absolute path, refusing anything outside the upload root.
export function resolveKey(storageKey) {
    const absolute = path.resolve(uploadConfig.root, storageKey);
    if (!absolute.startsWith(uploadConfig.root + path.sep))
        throw new Error('Storage key outside upload directory');
    return absolute;
}

export async function moveInto(tmpPath, storageKey) {
    const target = resolveKey(storageKey);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    try {
        await fs.promises.rename(tmpPath, target);
    }
    catch (error) {
        if (error.code !== 'EXDEV')
            throw error;
        // UPLOAD_DIR and tmp on different drives: copy, then remove the temporary file.
        await fs.promises.copyFile(tmpPath, target);
        await fs.promises.rm(tmpPath, { force: true });
    }
}

export const removeFile = (absolutePath) => fs.promises.rm(absolutePath, { force: true }).catch(error => log.warn('Could not remove file', { error: error.message }));

// Uploads interrupted by a crash leave temporary files; remove ones older than a day at startup.
for (const name of fs.readdirSync(tmpDir)) {
    const filePath = path.join(tmpDir, name);
    try {
        if (Date.now() - fs.statSync(filePath).mtimeMs > 86400000)
            fs.rmSync(filePath, { force: true });
    }
    catch (error) {
        log.warn('Could not clean temporary upload', { error: error.message });
    }
}
