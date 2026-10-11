INSERT INTO app_rle_mnu_itm_rel_t (role_id, mnu_itm_id, slct_in)
SELECT r.role_id, m.mnu_itm_id, 1
FROM role_t r CROSS JOIN app_mnu_itm_lst_t m
WHERE r.role_code = 'COLLEGE_ADMIN' AND m.mnu_itm_cd = 'audit-log'
ON CONFLICT (role_id, mnu_itm_id)
DO UPDATE SET slct_in = 1, a_in = 1, d_ts = NULL, u_ts = CURRENT_TIMESTAMP;
