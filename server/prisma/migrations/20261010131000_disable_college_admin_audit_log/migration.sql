UPDATE app_rle_mnu_itm_rel_t p
SET slct_in = 0, insrt_in = 0, updt_in = 0, dlte_in = 0, exprt_in = 0,
    u_ts = CURRENT_TIMESTAMP
FROM role_t r, app_mnu_itm_lst_t m
WHERE p.role_id = r.role_id AND p.mnu_itm_id = m.mnu_itm_id
  AND r.role_code = 'COLLEGE_ADMIN' AND m.mnu_itm_cd = 'audit-log';
