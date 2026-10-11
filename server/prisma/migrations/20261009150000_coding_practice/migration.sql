-- Coding practice: problem library, test cases and submissions; Coding Practice menu.
-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('ACCEPTED', 'WRONG_ANSWER', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT');

-- CreateTable
CREATE TABLE "cdng_prblm_lst_t" (
    "cdng_prblm_id" TEXT NOT NULL,
    "college_id" TEXT,
    "prblm_slug_tx" TEXT NOT NULL,
    "prblm_ttl" TEXT NOT NULL,
    "difficulty_cd" "Difficulty" NOT NULL DEFAULT 'EASY',
    "topic_tx" TEXT NOT NULL DEFAULT '',
    "statement_tx" TEXT NOT NULL,
    "input_format_tx" TEXT NOT NULL DEFAULT '',
    "output_format_tx" TEXT NOT NULL DEFAULT '',
    "constraints_tx" TEXT NOT NULL DEFAULT '',
    "time_limit_ms_ct" INTEGER NOT NULL DEFAULT 2000,
    "sqnce_id" INTEGER NOT NULL DEFAULT 0,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "cdng_prblm_lst_t_pkey" PRIMARY KEY ("cdng_prblm_id")
);

-- CreateTable
CREATE TABLE "cdng_tst_cs_lst_t" (
    "cdng_tst_cs_id" TEXT NOT NULL,
    "cdng_prblm_id" TEXT NOT NULL,
    "input_tx" TEXT NOT NULL,
    "expected_output_tx" TEXT NOT NULL,
    "is_sample_in" SMALLINT NOT NULL DEFAULT 0,
    "sqnce_id" INTEGER NOT NULL DEFAULT 0,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cdng_tst_cs_lst_t_pkey" PRIMARY KEY ("cdng_tst_cs_id")
);

-- CreateTable
CREATE TABLE "cdng_sbmsn_dtl_t" (
    "cdng_sbmsn_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cdng_prblm_id" TEXT NOT NULL,
    "lang_cd" TEXT NOT NULL,
    "code_tx" TEXT NOT NULL,
    "status_cd" "SubmissionStatus" NOT NULL,
    "passed_ct" INTEGER NOT NULL DEFAULT 0,
    "total_ct" INTEGER NOT NULL DEFAULT 0,
    "runtime_ms_ct" INTEGER NOT NULL DEFAULT 0,
    "results_json" JSONB NOT NULL,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cdng_sbmsn_dtl_t_pkey" PRIMARY KEY ("cdng_sbmsn_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cdng_prblm_lst_t_prblm_slug_tx_key" ON "cdng_prblm_lst_t"("prblm_slug_tx");

-- CreateIndex
CREATE INDEX "cdng_prblm_lst_t_college_id_idx" ON "cdng_prblm_lst_t"("college_id");

-- CreateIndex
CREATE INDEX "cdng_tst_cs_lst_t_cdng_prblm_id_idx" ON "cdng_tst_cs_lst_t"("cdng_prblm_id");

-- CreateIndex
CREATE INDEX "cdng_sbmsn_dtl_t_college_id_idx" ON "cdng_sbmsn_dtl_t"("college_id");

-- CreateIndex
CREATE INDEX "cdng_sbmsn_dtl_t_user_id_cdng_prblm_id_idx" ON "cdng_sbmsn_dtl_t"("user_id", "cdng_prblm_id");

-- AddForeignKey
ALTER TABLE "cdng_tst_cs_lst_t" ADD CONSTRAINT "cdng_tst_cs_lst_t_cdng_prblm_id_fkey" FOREIGN KEY ("cdng_prblm_id") REFERENCES "cdng_prblm_lst_t"("cdng_prblm_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cdng_sbmsn_dtl_t" ADD CONSTRAINT "cdng_sbmsn_dtl_t_cdng_prblm_id_fkey" FOREIGN KEY ("cdng_prblm_id") REFERENCES "cdng_prblm_lst_t"("cdng_prblm_id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Value checks.
ALTER TABLE "cdng_prblm_lst_t" ADD CONSTRAINT "cdng_prblm_lst_t_values_check" CHECK ("time_limit_ms_ct" BETWEEN 100 AND 20000 AND "a_in" IN (0, 1));
ALTER TABLE "cdng_tst_cs_lst_t" ADD CONSTRAINT "cdng_tst_cs_lst_t_sample_check" CHECK ("is_sample_in" IN (0, 1));
ALTER TABLE "cdng_sbmsn_dtl_t" ADD CONSTRAINT "cdng_sbmsn_dtl_t_counts_check" CHECK ("passed_ct" >= 0 AND "passed_ct" <= "total_ct");

-- APCMMS audit column behaviour on the master table.
CREATE TRIGGER "cdng_prblm_lst_t_audit_timestamps" BEFORE UPDATE ON "cdng_prblm_lst_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();

-- Menu: Coding Practice. Everyone solves problems; editors (Super Admin, College Admin, Teacher) may also manage them.
INSERT INTO "app_mnu_itm_lst_t" ("mnu_itm_id", "mnu_itm_cd", "mnu_itm_nm", "mnu_dscn_tx", "mnu_itm_icn_tx", "mnu_itm_url_tx", "prnt_mnu_itm_id", "sqnce_id", "hdr_in", "shw_in") VALUES
  (11, 'coding', 'Coding Practice', 'Solve programming problems in your own language', 'Code2', '/coding', NULL, 27, 0, 1);
SELECT setval(pg_get_serial_sequence('"app_mnu_itm_lst_t"', 'mnu_itm_id'), (SELECT MAX("mnu_itm_id") FROM "app_mnu_itm_lst_t"));
INSERT INTO "app_rle_mnu_itm_rel_t" ("role_id", "mnu_itm_id", "slct_in", "insrt_in", "updt_in", "dlte_in", "exprt_in") VALUES
  (1, 11, 1, 1, 1, 1, 1),
  (2, 11, 1, 1, 1, 1, 1),
  (3, 11, 1, 1, 1, 1, 1),
  (4, 11, 1, 1, 0, 0, 0);
