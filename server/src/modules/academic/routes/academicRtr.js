import { Router } from 'express';
import { requirePermission as can } from '../../../middleware/permission.middleware.js';
import * as academics from '../controllers/academicCtrl.js';
import { numericIds } from '../../../utils/ids.js';

export const academicRoutes = numericIds(Router());
// Academic structure: :resource is academic-years, departments, programs, batches or cohorts.
academicRoutes.get('/academics/cohorts/:id/members', can('academics'), academics.membersCtrl);
academicRoutes.post('/academics/cohorts/:id/members', can('academics', 'update'), academics.addMembersCtrl);
academicRoutes.delete('/academics/cohorts/:id/members/:userId', can('academics', 'update'), academics.removeMemberCtrl);
academicRoutes.get('/academics/:resource', can('academics'), academics.listCtrl);
academicRoutes.post('/academics/:resource', can('academics', 'create'), academics.createCtrl);
academicRoutes.patch('/academics/:resource/:id', can('academics', 'update'), academics.updateCtrl);
academicRoutes.delete('/academics/:resource/:id', can('academics', 'delete'), academics.removeCtrl);
