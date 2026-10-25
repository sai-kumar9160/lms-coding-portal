import { Router } from 'express';
import { requirePermission as can } from '../../../middleware/permission.middleware.js';
import * as platform from '../controllers/platformCtrl.js';
import { numericIds } from '../../../utils/ids.js';

export const platformRoutes = numericIds(Router());
// Public: used by load balancers before anyone signs in.
export const healthRoutes = numericIds(Router());
healthRoutes.get('/health', platform.healthCtrl);

platformRoutes.get('/me', platform.meCtrl);
platformRoutes.get('/colleges', can('colleges'), platform.listCollegesCtrl);
platformRoutes.get('/colleges/:id/members', can('colleges'), platform.collegeMembersCtrl);
platformRoutes.patch('/colleges/:id/members/:userId', can('colleges', 'update'), platform.updateCollegeMemberCtrl);
platformRoutes.post('/colleges', can('colleges', 'create'), platform.createCollegeCtrl);
platformRoutes.patch('/colleges/:id', can('colleges', 'update'), platform.updateCollegeCtrl);
platformRoutes.get('/vendors', can('colleges'), platform.listVendorsCtrl);
platformRoutes.post('/vendors', can('colleges', 'create'), platform.createVendorCtrl);
platformRoutes.delete('/vendors/:id', can('colleges', 'update'), platform.deactivateVendorCtrl);
