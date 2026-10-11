-- Super Admins manage teachers and students (add, approve, deactivate) in the college chosen with the college switcher.
INSERT INTO "app_rle_mnu_itm_rel_t" ("role_id", "mnu_itm_id", "slct_in", "insrt_in", "updt_in", "dlte_in", "exprt_in")
VALUES (1, 3, 1, 1, 1, 1, 0)
ON CONFLICT ("role_id", "mnu_itm_id") DO UPDATE SET "slct_in" = 1, "insrt_in" = 1, "updt_in" = 1, "dlte_in" = 1, "a_in" = 1;
