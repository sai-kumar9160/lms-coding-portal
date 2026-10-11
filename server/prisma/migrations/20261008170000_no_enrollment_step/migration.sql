-- There is no enrollment step: students open every published course of their college directly.
-- The hidden 'enrollments' permission now only covers recording progress and completing lessons (update).
UPDATE "app_mnu_itm_lst_t" SET "mnu_itm_nm" = 'Learning progress', "mnu_dscn_tx" = 'Record lesson progress and completion (update)' WHERE "mnu_itm_cd" = 'enrollments';
UPDATE "app_rle_mnu_itm_rel_t" SET "insrt_in" = 0 WHERE "mnu_itm_id" = (SELECT "mnu_itm_id" FROM "app_mnu_itm_lst_t" WHERE "mnu_itm_cd" = 'enrollments');
