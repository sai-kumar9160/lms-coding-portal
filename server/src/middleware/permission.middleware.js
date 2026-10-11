import { accessModel, permissionActions } from '../models/access.model.js';
import { fail } from '../utils/http-error.js';

// requirePermission('courses', 'update') allows the request only when the user's role has that flag
// for the menu item code in app_rle_mnu_itm_rel_t. Use after authenticate.
export function requirePermission(code, action = 'view') {
    if (!permissionActions.includes(action))
        throw new Error(`Unknown permission action: ${action}`);
    return async (req, _res, next) => {
        const permissions = await accessModel.permissions(req.identity.role);
        if (!permissions[code]?.[action])
            fail(403, 'You do not have permission');
        next();
    };
}
