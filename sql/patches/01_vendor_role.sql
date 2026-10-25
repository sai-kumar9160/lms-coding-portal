-- Adds the VENDOR role (a platform-level partner account, created by the Super Admin, that manages the shared coding problem library).
-- For databases built before this role existed. A new database gets the same rows from sql/00, 01 and 06.
-- Run it with psql (no surrounding transaction: a new enum value cannot be used in the transaction that adds it):
--   psql -h localhost -p 5433 -U postgres -d LMS_PORTAL -v ON_ERROR_STOP=1 -f sql/patches/01_vendor_role.sql
ALTER TYPE public."Role" ADD VALUE IF NOT EXISTS 'VENDOR';

BEGIN;

INSERT INTO public.role_t (role_id, role_code, role_name) VALUES (5, 'VENDOR', 'Vendor') ON CONFLICT (role_code) DO NOTHING;

-- One permission row per menu item; a vendor sees only the coding problem library.
INSERT INTO public.app_rle_mnu_itm_rel_t (role_id, mnu_itm_id, slct_in, insrt_in, updt_in, dlte_in, exprt_in)
SELECT 5, m.mnu_itm_id,
       CASE WHEN m.mnu_itm_cd = 'coding-problems' THEN 1 ELSE 0 END, CASE WHEN m.mnu_itm_cd = 'coding-problems' THEN 1 ELSE 0 END,
       CASE WHEN m.mnu_itm_cd = 'coding-problems' THEN 1 ELSE 0 END, CASE WHEN m.mnu_itm_cd = 'coding-problems' THEN 1 ELSE 0 END, 0
FROM public.app_mnu_itm_lst_t m
ON CONFLICT (role_id, mnu_itm_id) DO NOTHING;

COMMIT;
