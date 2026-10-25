import { Router } from 'express';
import { requirePermission as can } from '../../../middleware/permission.middleware.js';
import * as access from '../controllers/accessCtrl.js';
import { numericIds } from '../../../utils/ids.js';

export const accessRoutes = numericIds(Router());
accessRoutes.get('/menu', access.menuCtrl);
accessRoutes.get('/access/roles', can('access-control'), access.listRolesCtrl);
accessRoutes.get('/access/roles/:roleId/permissions', can('access-control'), access.rolePermissionsCtrl);
accessRoutes.put('/access/roles/:roleId/permissions', can('access-control', 'update'), access.saveRolePermissionsCtrl);
