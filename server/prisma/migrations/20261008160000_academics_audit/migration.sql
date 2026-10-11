-- Step 3: academic structure, student/teacher profiles, cohorts and the audit log.
CREATE TABLE "acdmc_yr_lst_t" (
    "acdmc_yr_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "acdmc_yr_nm" TEXT NOT NULL,
    "start_dt" DATE NOT NULL,
    "end_dt" DATE NOT NULL,
    "is_crnt_in" SMALLINT NOT NULL DEFAULT 0,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "acdmc_yr_lst_t_pkey" PRIMARY KEY ("acdmc_yr_id")
);

CREATE TABLE "dept_lst_t" (
    "dept_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "dept_cd" TEXT NOT NULL,
    "dept_nm" TEXT NOT NULL,
    "hod_usr_id" TEXT,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "dept_lst_t_pkey" PRIMARY KEY ("dept_id")
);

CREATE TABLE "prgm_lst_t" (
    "prgm_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "dept_id" TEXT NOT NULL,
    "prgm_cd" TEXT NOT NULL,
    "prgm_nm" TEXT NOT NULL,
    "duration_yrs_ct" INTEGER NOT NULL,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "prgm_lst_t_pkey" PRIMARY KEY ("prgm_id")
);

CREATE TABLE "btch_lst_t" (
    "btch_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "prgm_id" TEXT NOT NULL,
    "acdmc_yr_id" TEXT NOT NULL,
    "btch_nm" TEXT NOT NULL,
    "section_tx" TEXT NOT NULL DEFAULT '',
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "btch_lst_t_pkey" PRIMARY KEY ("btch_id")
);

CREATE TABLE "stdnt_prfl_dtl_t" (
    "stdnt_prfl_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "roll_no" TEXT NOT NULL,
    "btch_id" TEXT,
    "admsn_yr" INTEGER,
    "dob_dt" DATE,
    "gndr_cd" TEXT,
    "grdn_phone_no" TEXT,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "stdnt_prfl_dtl_t_pkey" PRIMARY KEY ("stdnt_prfl_id")
);

CREATE TABLE "tchr_prfl_dtl_t" (
    "tchr_prfl_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "emp_cd" TEXT NOT NULL,
    "dept_id" TEXT,
    "dsgntn_tx" TEXT,
    "qlfctn_tx" TEXT,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "tchr_prfl_dtl_t_pkey" PRIMARY KEY ("tchr_prfl_id")
);

CREATE TABLE "chrt_lst_t" (
    "chrt_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "chrt_nm" TEXT NOT NULL,
    "chrt_dscn_tx" TEXT NOT NULL DEFAULT '',
    "btch_id" TEXT,
    "archived_in" SMALLINT NOT NULL DEFAULT 0,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "chrt_lst_t_pkey" PRIMARY KEY ("chrt_id")
);

CREATE TABLE "chrt_mbr_rel_t" (
    "chrt_mbr_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "chrt_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "chrt_mbr_rel_t_pkey" PRIMARY KEY ("chrt_mbr_id")
);

CREATE TABLE "adt_log_dtl_t" (
    "adt_log_id" TEXT NOT NULL,
    "college_id" TEXT,
    "actor_usr_id" TEXT,
    "acting_as_sa_in" SMALLINT NOT NULL DEFAULT 0,
    "action_cd" TEXT NOT NULL,
    "entity_type_cd" TEXT NOT NULL,
    "entity_id" TEXT,
    "before_json" JSONB,
    "after_json" JSONB,
    "ip_addr_tx" TEXT,
    "user_agent_tx" TEXT,
    "request_id" TEXT,
    "occurred_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adt_log_dtl_t_pkey" PRIMARY KEY ("adt_log_id")
);

CREATE UNIQUE INDEX "acdmc_yr_lst_t_college_id_acdmc_yr_nm_key" ON "acdmc_yr_lst_t"("college_id", "acdmc_yr_nm");

CREATE UNIQUE INDEX "dept_lst_t_college_id_dept_cd_key" ON "dept_lst_t"("college_id", "dept_cd");

CREATE UNIQUE INDEX "prgm_lst_t_college_id_prgm_cd_key" ON "prgm_lst_t"("college_id", "prgm_cd");

CREATE UNIQUE INDEX "btch_lst_t_college_id_prgm_id_acdmc_yr_id_btch_nm_section_t_key" ON "btch_lst_t"("college_id", "prgm_id", "acdmc_yr_id", "btch_nm", "section_tx");

CREATE UNIQUE INDEX "stdnt_prfl_dtl_t_user_id_key" ON "stdnt_prfl_dtl_t"("user_id");

CREATE INDEX "stdnt_prfl_dtl_t_btch_id_idx" ON "stdnt_prfl_dtl_t"("btch_id");

CREATE UNIQUE INDEX "stdnt_prfl_dtl_t_college_id_roll_no_key" ON "stdnt_prfl_dtl_t"("college_id", "roll_no");

CREATE UNIQUE INDEX "tchr_prfl_dtl_t_user_id_key" ON "tchr_prfl_dtl_t"("user_id");

CREATE UNIQUE INDEX "tchr_prfl_dtl_t_college_id_emp_cd_key" ON "tchr_prfl_dtl_t"("college_id", "emp_cd");

CREATE UNIQUE INDEX "chrt_lst_t_college_id_chrt_nm_key" ON "chrt_lst_t"("college_id", "chrt_nm");

CREATE INDEX "chrt_mbr_rel_t_user_id_idx" ON "chrt_mbr_rel_t"("user_id");

CREATE UNIQUE INDEX "chrt_mbr_rel_t_chrt_id_user_id_key" ON "chrt_mbr_rel_t"("chrt_id", "user_id");

CREATE INDEX "adt_log_dtl_t_college_id_occurred_ts_idx" ON "adt_log_dtl_t"("college_id", "occurred_ts");

CREATE INDEX "adt_log_dtl_t_entity_type_cd_entity_id_idx" ON "adt_log_dtl_t"("entity_type_cd", "entity_id");

CREATE INDEX "adt_log_dtl_t_actor_usr_id_idx" ON "adt_log_dtl_t"("actor_usr_id");

ALTER TABLE "dept_lst_t" ADD CONSTRAINT "dept_lst_t_hod_usr_id_fkey" FOREIGN KEY ("hod_usr_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prgm_lst_t" ADD CONSTRAINT "prgm_lst_t_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "dept_lst_t"("dept_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "btch_lst_t" ADD CONSTRAINT "btch_lst_t_prgm_id_fkey" FOREIGN KEY ("prgm_id") REFERENCES "prgm_lst_t"("prgm_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "btch_lst_t" ADD CONSTRAINT "btch_lst_t_acdmc_yr_id_fkey" FOREIGN KEY ("acdmc_yr_id") REFERENCES "acdmc_yr_lst_t"("acdmc_yr_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stdnt_prfl_dtl_t" ADD CONSTRAINT "stdnt_prfl_dtl_t_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stdnt_prfl_dtl_t" ADD CONSTRAINT "stdnt_prfl_dtl_t_btch_id_fkey" FOREIGN KEY ("btch_id") REFERENCES "btch_lst_t"("btch_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tchr_prfl_dtl_t" ADD CONSTRAINT "tchr_prfl_dtl_t_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tchr_prfl_dtl_t" ADD CONSTRAINT "tchr_prfl_dtl_t_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "dept_lst_t"("dept_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "chrt_lst_t" ADD CONSTRAINT "chrt_lst_t_btch_id_fkey" FOREIGN KEY ("btch_id") REFERENCES "btch_lst_t"("btch_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "chrt_mbr_rel_t" ADD CONSTRAINT "chrt_mbr_rel_t_chrt_id_fkey" FOREIGN KEY ("chrt_id") REFERENCES "chrt_lst_t"("chrt_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chrt_mbr_rel_t" ADD CONSTRAINT "chrt_mbr_rel_t_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Value checks.
ALTER TABLE "acdmc_yr_lst_t" ADD CONSTRAINT "acdmc_yr_lst_t_dates_check" CHECK ("end_dt" > "start_dt"), ADD CONSTRAINT "acdmc_yr_lst_t_flags_check" CHECK ("is_crnt_in" IN (0, 1) AND "a_in" IN (0, 1));
ALTER TABLE "prgm_lst_t" ADD CONSTRAINT "prgm_lst_t_duration_check" CHECK ("duration_yrs_ct" BETWEEN 1 AND 10), ADD CONSTRAINT "prgm_lst_t_a_in_check" CHECK ("a_in" IN (0, 1));
ALTER TABLE "chrt_lst_t" ADD CONSTRAINT "chrt_lst_t_flags_check" CHECK ("archived_in" IN (0, 1) AND "a_in" IN (0, 1));
ALTER TABLE "dept_lst_t" ADD CONSTRAINT "dept_lst_t_a_in_check" CHECK ("a_in" IN (0, 1));
ALTER TABLE "btch_lst_t" ADD CONSTRAINT "btch_lst_t_a_in_check" CHECK ("a_in" IN (0, 1));
ALTER TABLE "stdnt_prfl_dtl_t" ADD CONSTRAINT "stdnt_prfl_dtl_t_a_in_check" CHECK ("a_in" IN (0, 1));
ALTER TABLE "tchr_prfl_dtl_t" ADD CONSTRAINT "tchr_prfl_dtl_t_a_in_check" CHECK ("a_in" IN (0, 1));
ALTER TABLE "chrt_mbr_rel_t" ADD CONSTRAINT "chrt_mbr_rel_t_a_in_check" CHECK ("a_in" IN (0, 1));
ALTER TABLE "adt_log_dtl_t" ADD CONSTRAINT "adt_log_dtl_t_flags_check" CHECK ("acting_as_sa_in" IN (0, 1));

-- APCMMS audit column behaviour on the master tables (the audit log itself is append-only).
CREATE TRIGGER "acdmc_yr_lst_t_audit_timestamps" BEFORE UPDATE ON "acdmc_yr_lst_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "dept_lst_t_audit_timestamps" BEFORE UPDATE ON "dept_lst_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "prgm_lst_t_audit_timestamps" BEFORE UPDATE ON "prgm_lst_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "btch_lst_t_audit_timestamps" BEFORE UPDATE ON "btch_lst_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "stdnt_prfl_dtl_t_audit_timestamps" BEFORE UPDATE ON "stdnt_prfl_dtl_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "tchr_prfl_dtl_t_audit_timestamps" BEFORE UPDATE ON "tchr_prfl_dtl_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "chrt_lst_t_audit_timestamps" BEFORE UPDATE ON "chrt_lst_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "chrt_mbr_rel_t_audit_timestamps" BEFORE UPDATE ON "chrt_mbr_rel_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();

-- Menus: Academics (academic structure) and Audit log, granted to Super Admin and College Admin.
INSERT INTO "app_mnu_itm_lst_t" ("mnu_itm_id", "mnu_itm_cd", "mnu_itm_nm", "mnu_dscn_tx", "mnu_itm_icn_tx", "mnu_itm_url_tx", "prnt_mnu_itm_id", "sqnce_id", "hdr_in", "shw_in") VALUES
  (8, 'academics', 'Academics', 'Academic years, departments, programmes, batches and cohorts', 'Layers', '/academics', NULL, 35, 0, 1),
  (9, 'audit-log', 'Audit log', 'Who changed what, and when', 'ScrollText', '/audit-log', NULL, 38, 0, 1);
SELECT setval(pg_get_serial_sequence('"app_mnu_itm_lst_t"', 'mnu_itm_id'), (SELECT MAX("mnu_itm_id") FROM "app_mnu_itm_lst_t"));
INSERT INTO "app_rle_mnu_itm_rel_t" ("role_id", "mnu_itm_id", "slct_in", "insrt_in", "updt_in", "dlte_in", "exprt_in") VALUES
  (1, 8, 1, 1, 1, 1, 0),
  (2, 8, 1, 1, 1, 1, 0),
  (1, 9, 1, 0, 0, 0, 1),
  (2, 9, 1, 0, 0, 0, 1);