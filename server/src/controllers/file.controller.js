import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { fileModel } from '../models/file.model.js';
import { tmpDir, resolveKey } from '../services/file-storage.service.js';
import { uploadConfig } from '../../config/upload.config.js';
import { createLogger } from '../utils/logger.js';
import { fail } from '../utils/http-error.js';
import { audit } from '../services/audit.service.js';

const log = createLogger('file.controller');
const storage = multer.diskStorage({ destination: tmpDir, filename: (_req, _file, callback) => callback(null, randomUUID()) });
const uploaders = Object.fromEntries(Object.entries(uploadConfig.maxBytes).map(([purpose, fileSize]) => [purpose, multer({ storage, limits: { fileSize, files: 1, fields: 0, parts: 1 } }).single('file')]));
const purposeSchema = z.enum(['VIDEO', 'DOCUMENT']);

// Content-Disposition with an ASCII fallback and the UTF-8 original name.
function disposition(type, name) {
    const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

// POST /api/files?purpose=VIDEO|DOCUMENT, multipart field "file".
export async function upload(req, res) {
    const purpose = purposeSchema.parse(req.query.purpose);
    try {
        await new Promise((resolve, reject) => uploaders[purpose](req, res, error => error ? reject(error) : resolve()));
    }
    catch (error) {
        if (error instanceof multer.MulterError) {
            const tooLarge = error.code === 'LIMIT_FILE_SIZE';
            fail(tooLarge ? 413 : 400, tooLarge ? `File is larger than ${uploadConfig.maxBytes[purpose] / 1048576} MB` : 'Send one file in the "file" field');
        }
        throw error;
    }
    if (!req.file)
        fail(400, 'Choose a file to upload');
    const file = await fileModel.store(req.identity, req.collegeId, purpose, req.file);
    await audit(req, { action: 'upload', entityType: 'file', entityId: file.id, after: file });
    res.status(201).json(file);
}

// GET /api/files/:id/content[?download=1]. Streams with HTTP Range support so videos can seek.
export async function content(req, res, next) {
    const download = req.query.download === '1';
    const file = await fileModel.accessible(req.identity, req.collegeId, req.params.id, { download });
    // The API-wide CSP blocks the browser's PDF viewer; these are validated video/PDF files served with nosniff.
    res.removeHeader('Content-Security-Policy');
    res.setHeader('Content-Disposition', disposition(download ? 'attachment' : 'inline', file.originalName));
    res.setHeader('Cache-Control', 'private, no-cache');
    res.sendFile(resolveKey(file.storageKey), { headers: { 'Content-Type': file.mimeType }, cacheControl: false, dotfiles: 'deny' }, error => {
        // Video players routinely abort range requests while seeking; that is not a server error.
        if (!error || res.headersSent || error.code === 'ECONNABORTED')
            return;
        if (error.code === 'ENOENT') {
            log.error('Stored file is missing', { fileId: file.id, requestId: req.id });
            return next(Object.assign(new Error('File not found'), { status: 404 }));
        }
        next(error);
    });
}
