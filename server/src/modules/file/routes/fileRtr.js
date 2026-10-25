import { Router } from 'express';
import { authenticateSessionCookie, requireCollege } from '../../../middleware/auth.middleware.js';
import { requirePermission as can } from '../../../middleware/permission.middleware.js';
import * as files from '../controllers/fileCtrl.js';
import { numericIds } from '../../../utils/ids.js';

export const fileRoutes = numericIds(Router());
// Lesson media for <video>/<iframe>: authenticated by the session cookie because media elements cannot send headers.
// Mounted before the JWT check.
export const fileMediaRoutes = numericIds(Router());
fileMediaRoutes.get('/files/:id/content', authenticateSessionCookie, requireCollege, can('courses'), files.contentCtrl);

fileRoutes.post('/files', can('courses', 'update'), files.uploadCtrl);
