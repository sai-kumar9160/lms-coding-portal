import { Router } from 'express';
import { requirePermission as can } from '../../../middleware/permission.middleware.js';
import * as users from '../controllers/userCtrl.js';
import { numericIds } from '../../../utils/ids.js';

export const userRoutes = numericIds(Router());
userRoutes.get('/users', can('people'), users.listUsersCtrl);
userRoutes.get('/users/branch-options', can('people', 'update'), users.branchOptionsCtrl);
userRoutes.put('/users/:id/branches', can('people', 'update'), users.saveBranchesCtrl);
userRoutes.post('/users', can('people', 'create'), users.createUserCtrl);
userRoutes.post('/users/:id/approve', can('people', 'update'), users.approveUserCtrl);
userRoutes.delete('/users/:id', can('people', 'delete'), users.deactivateUserCtrl);
userRoutes.put('/users/:id/profile', can('people', 'update'), users.saveProfileCtrl);
