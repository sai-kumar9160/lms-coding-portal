-- College Admins may create courses (they already edit, publish and delete them).
UPDATE "app_rle_mnu_itm_rel_t" SET "insrt_in" = 1 WHERE "role_id" = 2 AND "mnu_itm_id" = 2;

-- Super Admins get full course access; they work inside a college chosen with the college switcher (x-college-id).
INSERT INTO "app_rle_mnu_itm_rel_t" ("role_id", "mnu_itm_id", "slct_in", "insrt_in", "updt_in", "dlte_in", "exprt_in")
VALUES (1, 2, 1, 1, 1, 1, 0)
ON CONFLICT ("role_id", "mnu_itm_id") DO UPDATE SET "slct_in" = 1, "insrt_in" = 1, "updt_in" = 1, "dlte_in" = 1, "a_in" = 1;
