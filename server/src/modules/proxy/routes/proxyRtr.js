import { Router } from 'express';
import * as proxy from '../controllers/proxyCtrl.js';
import { numericIds } from '../../../utils/ids.js';

export const proxyRoutes = numericIds(Router());
// Allowlisted upstream services (PROXY_TARGETS); roles are configured per service.
proxyRoutes.all('/proxy/:service{/*path}', proxy.forwardCtrl);
