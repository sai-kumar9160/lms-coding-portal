BEGIN;
INSERT INTO app_mnu_itm_lst_t
  (mnu_itm_cd, mnu_itm_nm, mnu_dscn_tx, mnu_itm_icn_tx, mnu_itm_url_tx, prnt_mnu_itm_id, sqnce_id, hdr_in, shw_in)
VALUES ('coding-problems', 'Coding Problems', 'Manage the shared coding problem library for all colleges', 'Code2', '/coding-problems',
  (SELECT mnu_itm_id FROM app_mnu_itm_lst_t WHERE mnu_itm_cd = 'platform'), 15, 0, 1);

INSERT INTO app_rle_mnu_itm_rel_t
  (role_id, mnu_itm_id, slct_in, insrt_in, updt_in, dlte_in, exprt_in)
SELECT r.role_id, m.mnu_itm_id,
  CASE WHEN r.role_code = 'SUPER_ADMIN' THEN 1 ELSE 0 END,
  CASE WHEN r.role_code = 'SUPER_ADMIN' THEN 1 ELSE 0 END,
  CASE WHEN r.role_code = 'SUPER_ADMIN' THEN 1 ELSE 0 END,
  CASE WHEN r.role_code = 'SUPER_ADMIN' THEN 1 ELSE 0 END,
  CASE WHEN r.role_code = 'SUPER_ADMIN' THEN 1 ELSE 0 END
FROM role_t r CROSS JOIN app_mnu_itm_lst_t m WHERE m.mnu_itm_cd = 'coding-problems';

UPDATE app_rle_mnu_itm_rel_t p
SET slct_in = 0, insrt_in = 0, updt_in = 0, dlte_in = 0, exprt_in = 0
FROM role_t r, app_mnu_itm_lst_t m
WHERE p.role_id = r.role_id AND p.mnu_itm_id = m.mnu_itm_id
  AND r.role_code = 'SUPER_ADMIN' AND m.mnu_itm_cd = 'coding';
COMMIT;
