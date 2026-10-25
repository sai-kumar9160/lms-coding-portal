import { Router } from 'express';
import { requirePermission as can } from '../../../middleware/permission.middleware.js';
import * as auditLogs from '../controllers/auditCtrl.js';
import { numericIds } from '../../../utils/ids.js';

export const auditRoutes = numericIds(Router());
// Audit trail: own college for College Admins; chosen college or all colleges for Super Admin.
auditRoutes.get('/audit-logs', can('audit-log'), auditLogs.listCtrl);
