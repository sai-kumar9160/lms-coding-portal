-- Database-driven sidebar menus and role permissions (APCMMS app_mnu_itm_lst_t style).
-- One relation table drives both the sidebar (slct_in) and API permission checks.
CREATE TABLE "app_mnu_itm_lst_t" (
    "mnu_itm_id" SERIAL NOT NULL,
    "mnu_itm_cd" TEXT NOT NULL,
    "mnu_itm_nm" TEXT NOT NULL,
    "mnu_dscn_tx" TEXT,
    "mnu_itm_icn_tx" TEXT,
    "mnu_itm_url_tx" TEXT,
    "prnt_mnu_itm_id" INTEGER,
    "sqnce_id" INTEGER NOT NULL DEFAULT 0,
    "hdr_in" SMALLINT NOT NULL DEFAULT 0,
    "shw_in" SMALLINT NOT NULL DEFAULT 1,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),
    CONSTRAINT "app_mnu_itm_lst_t_pkey" PRIMARY KEY ("mnu_itm_id"),
    CONSTRAINT "app_mnu_itm_lst_t_flags_check" CHECK ("hdr_in" IN (0, 1) AND "shw_in" IN (0, 1) AND "a_in" IN (0, 1))
);

CREATE TABLE "app_rle_mnu_itm_rel_t" (
    "rle_mnu_itm_rel_ky" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "mnu_itm_id" INTEGER NOT NULL,
    "slct_in" SMALLINT NOT NULL DEFAULT 0,
    "insrt_in" SMALLINT NOT NULL DEFAULT 0,
    "updt_in" SMALLINT NOT NULL DEFAULT 0,
    "dlte_in" SMALLINT NOT NULL DEFAULT 0,
    "exprt_in" SMALLINT NOT NULL DEFAULT 0,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),
    CONSTRAINT "app_rle_mnu_itm_rel_t_pkey" PRIMARY KEY ("rle_mnu_itm_rel_ky"),
    CONSTRAINT "app_rle_mnu_itm_rel_t_flags_check" CHECK ("slct_in" IN (0, 1) AND "insrt_in" IN (0, 1) AND "updt_in" IN (0, 1) AND "dlte_in" IN (0, 1) AND "exprt_in" IN (0, 1) AND "a_in" IN (0, 1))
);

CREATE UNIQUE INDEX "app_mnu_itm_lst_t_mnu_itm_cd_key" ON "app_mnu_itm_lst_t"("mnu_itm_cd");
CREATE UNIQUE INDEX "app_rle_mnu_itm_rel_t_role_id_mnu_itm_id_key" ON "app_rle_mnu_itm_rel_t"("role_id", "mnu_itm_id");
ALTER TABLE "app_mnu_itm_lst_t" ADD CONSTRAINT "app_mnu_itm_lst_t_prnt_mnu_itm_id_fkey" FOREIGN KEY ("prnt_mnu_itm_id") REFERENCES "app_mnu_itm_lst_t"("mnu_itm_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "app_rle_mnu_itm_rel_t" ADD CONSTRAINT "app_rle_mnu_itm_rel_t_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role_t"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app_rle_mnu_itm_rel_t" ADD CONSTRAINT "app_rle_mnu_itm_rel_t_mnu_itm_id_fkey" FOREIGN KEY ("mnu_itm_id") REFERENCES "app_mnu_itm_lst_t"("mnu_itm_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER "app_mnu_itm_lst_t_audit_timestamps" BEFORE UPDATE ON "app_mnu_itm_lst_t"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "app_rle_mnu_itm_rel_t_audit_timestamps" BEFORE UPDATE ON "app_rle_mnu_itm_rel_t"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();

-- Menu items. Codes are the permission keys used by requirePermission() in the API routes.
-- 'platform' is a header row grouping its children; 'enrollments' is a permission object hidden from the sidebar.
INSERT INTO "app_mnu_itm_lst_t" ("mnu_itm_id", "mnu_itm_cd", "mnu_itm_nm", "mnu_dscn_tx", "mnu_itm_icn_tx", "mnu_itm_url_tx", "prnt_mnu_itm_id", "sqnce_id", "hdr_in", "shw_in") VALUES
  (1, 'overview', 'Overview', 'Dashboard and summary', 'LayoutDashboard', '/overview', NULL, 10, 0, 1),
  (2, 'courses', 'Courses', 'Courses, modules and lessons', 'BookOpen', '/courses', NULL, 20, 0, 1),
  (3, 'people', 'People', 'College users and teacher approvals', 'Users', '/people', NULL, 30, 0, 1),
  (4, 'platform', 'Platform', 'Platform administration', NULL, NULL, NULL, 40, 1, 1),
  (5, 'colleges', 'Colleges', 'College onboarding and suspension', 'Building2', '/colleges', 4, 10, 0, 1),
  (6, 'access-control', 'Access control', 'Menu permissions per role', 'ShieldCheck', '/access-control', 4, 20, 0, 1),
  (7, 'enrollments', 'Enrollments', 'Enroll in courses (create) and complete lessons (update)', NULL, NULL, NULL, 90, 0, 0);
SELECT setval(pg_get_serial_sequence('"app_mnu_itm_lst_t"', 'mnu_itm_id'), (SELECT MAX("mnu_itm_id") FROM "app_mnu_itm_lst_t"));

-- Role permissions (1 Super Admin, 2 College Admin, 3 Teacher, 4 Student). Columns: view, create, update, delete, export.
-- Header rows need no permission: they appear when the role can view at least one child.
INSERT INTO "app_rle_mnu_itm_rel_t" ("role_id", "mnu_itm_id", "slct_in", "insrt_in", "updt_in", "dlte_in", "exprt_in") VALUES
  (1, 1, 1, 0, 0, 0, 0),
  (1, 5, 1, 1, 1, 0, 0),
  (1, 6, 1, 0, 1, 0, 0),
  (2, 1, 1, 0, 0, 0, 0),
  (2, 2, 1, 0, 1, 1, 0),
  (2, 3, 1, 1, 1, 1, 0),
  (3, 1, 1, 0, 0, 0, 0),
  (3, 2, 1, 1, 1, 1, 0),
  (3, 3, 1, 0, 0, 0, 0),
  (4, 1, 1, 0, 0, 0, 0),
  (4, 2, 1, 0, 0, 0, 0),
  (4, 7, 1, 1, 1, 0, 0);
