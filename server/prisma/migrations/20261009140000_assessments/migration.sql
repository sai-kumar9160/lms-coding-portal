-- Phase 3: question bank, assessments, windows, attempts and answers; Assessments menu.
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'NUMERIC', 'SHORT_ANSWER');

CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

CREATE TYPE "AssessmentType" AS ENUM ('QUIZ', 'ASSIGNMENT', 'EXAM');

CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

CREATE TYPE "AttemptStrategy" AS ENUM ('BEST', 'LATEST');

CREATE TYPE "ResultVisibility" AS ENUM ('IMMEDIATE', 'AFTER_CLOSE', 'MANUAL');

CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED');

CREATE TABLE "qstn_lst_t" (
    "qstn_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "course_id" TEXT,
    "qstn_type_cd" "QuestionType" NOT NULL,
    "stem_tx" TEXT NOT NULL,
    "explanation_tx" TEXT NOT NULL DEFAULT '',
    "difficulty_cd" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "marks_ct" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "negative_marks_ct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "answer_key_json" JSONB,
    "topic_tx" TEXT NOT NULL DEFAULT '',
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "qstn_lst_t_pkey" PRIMARY KEY ("qstn_id")
);

CREATE TABLE "qstn_optn_lst_t" (
    "qstn_optn_id" TEXT NOT NULL,
    "qstn_id" TEXT NOT NULL,
    "optn_tx" TEXT NOT NULL,
    "is_correct_in" SMALLINT NOT NULL DEFAULT 0,
    "sqnce_id" INTEGER NOT NULL DEFAULT 0,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qstn_optn_lst_t_pkey" PRIMARY KEY ("qstn_optn_id")
);

CREATE TABLE "asmt_lst_t" (
    "asmt_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "course_id" TEXT,
    "asmt_type_cd" "AssessmentType" NOT NULL DEFAULT 'QUIZ',
    "asmt_ttl" TEXT NOT NULL,
    "instructions_tx" TEXT NOT NULL DEFAULT '',
    "duration_min_ct" INTEGER,
    "pass_pct" INTEGER NOT NULL DEFAULT 40,
    "max_attempts_ct" INTEGER NOT NULL DEFAULT 1,
    "attempt_strategy_cd" "AttemptStrategy" NOT NULL DEFAULT 'BEST',
    "shuffle_qstn_in" SMALLINT NOT NULL DEFAULT 0,
    "shuffle_optn_in" SMALLINT NOT NULL DEFAULT 0,
    "result_visibility_cd" "ResultVisibility" NOT NULL DEFAULT 'IMMEDIATE',
    "results_published_in" SMALLINT NOT NULL DEFAULT 0,
    "status_cd" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "asmt_lst_t_pkey" PRIMARY KEY ("asmt_id")
);

CREATE TABLE "asmt_qstn_rel_t" (
    "asmt_qstn_id" TEXT NOT NULL,
    "asmt_id" TEXT NOT NULL,
    "qstn_id" TEXT NOT NULL,
    "sqnce_id" INTEGER NOT NULL DEFAULT 0,
    "marks_override_ct" DOUBLE PRECISION,

    CONSTRAINT "asmt_qstn_rel_t_pkey" PRIMARY KEY ("asmt_qstn_id")
);

CREATE TABLE "asmt_wndw_lst_t" (
    "asmt_wndw_id" TEXT NOT NULL,
    "asmt_id" TEXT NOT NULL,
    "chrt_id" TEXT,
    "opens_ts" TIMESTAMP(3) NOT NULL,
    "closes_ts" TIMESTAMP(3) NOT NULL,
    "extra_time_min_ct" INTEGER NOT NULL DEFAULT 0,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1,
    "d_ts" TIMESTAMP(3),

    CONSTRAINT "asmt_wndw_lst_t_pkey" PRIMARY KEY ("asmt_wndw_id")
);

CREATE TABLE "atmpt_dtl_t" (
    "atmpt_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "asmt_id" TEXT NOT NULL,
    "asmt_wndw_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "atmpt_no" INTEGER NOT NULL,
    "status_cd" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_ts" TIMESTAMP(3) NOT NULL,
    "submitted_ts" TIMESTAMP(3),
    "layout_json" JSONB NOT NULL,
    "score_ct" DOUBLE PRECISION,
    "max_score_ct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_passed_in" SMALLINT,
    "needs_grading_in" SMALLINT NOT NULL DEFAULT 0,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),

    CONSTRAINT "atmpt_dtl_t_pkey" PRIMARY KEY ("atmpt_id")
);

CREATE TABLE "atmpt_ans_dtl_t" (
    "atmpt_ans_id" TEXT NOT NULL,
    "atmpt_id" TEXT NOT NULL,
    "qstn_id" TEXT NOT NULL,
    "answer_json" JSONB,
    "is_correct_in" SMALLINT,
    "marks_awarded_ct" DOUBLE PRECISION,
    "feedback_tx" TEXT NOT NULL DEFAULT '',
    "evaluated_by" TEXT,
    "evaluated_ts" TIMESTAMP(3),
    "saved_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atmpt_ans_dtl_t_pkey" PRIMARY KEY ("atmpt_ans_id")
);

CREATE INDEX "qstn_lst_t_college_id_idx" ON "qstn_lst_t"("college_id");

CREATE INDEX "qstn_lst_t_course_id_idx" ON "qstn_lst_t"("course_id");

CREATE INDEX "qstn_optn_lst_t_qstn_id_idx" ON "qstn_optn_lst_t"("qstn_id");

CREATE INDEX "asmt_lst_t_college_id_idx" ON "asmt_lst_t"("college_id");

CREATE UNIQUE INDEX "asmt_qstn_rel_t_asmt_id_qstn_id_key" ON "asmt_qstn_rel_t"("asmt_id", "qstn_id");

CREATE INDEX "asmt_wndw_lst_t_asmt_id_idx" ON "asmt_wndw_lst_t"("asmt_id");

CREATE INDEX "atmpt_dtl_t_college_id_idx" ON "atmpt_dtl_t"("college_id");

CREATE INDEX "atmpt_dtl_t_user_id_idx" ON "atmpt_dtl_t"("user_id");

CREATE INDEX "atmpt_dtl_t_status_cd_expires_ts_idx" ON "atmpt_dtl_t"("status_cd", "expires_ts");

CREATE UNIQUE INDEX "atmpt_dtl_t_asmt_id_user_id_atmpt_no_key" ON "atmpt_dtl_t"("asmt_id", "user_id", "atmpt_no");

CREATE UNIQUE INDEX "atmpt_ans_dtl_t_atmpt_id_qstn_id_key" ON "atmpt_ans_dtl_t"("atmpt_id", "qstn_id");

ALTER TABLE "qstn_optn_lst_t" ADD CONSTRAINT "qstn_optn_lst_t_qstn_id_fkey" FOREIGN KEY ("qstn_id") REFERENCES "qstn_lst_t"("qstn_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "asmt_qstn_rel_t" ADD CONSTRAINT "asmt_qstn_rel_t_asmt_id_fkey" FOREIGN KEY ("asmt_id") REFERENCES "asmt_lst_t"("asmt_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "asmt_qstn_rel_t" ADD CONSTRAINT "asmt_qstn_rel_t_qstn_id_fkey" FOREIGN KEY ("qstn_id") REFERENCES "qstn_lst_t"("qstn_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "asmt_wndw_lst_t" ADD CONSTRAINT "asmt_wndw_lst_t_asmt_id_fkey" FOREIGN KEY ("asmt_id") REFERENCES "asmt_lst_t"("asmt_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "atmpt_dtl_t" ADD CONSTRAINT "atmpt_dtl_t_asmt_id_fkey" FOREIGN KEY ("asmt_id") REFERENCES "asmt_lst_t"("asmt_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "atmpt_dtl_t" ADD CONSTRAINT "atmpt_dtl_t_asmt_wndw_id_fkey" FOREIGN KEY ("asmt_wndw_id") REFERENCES "asmt_wndw_lst_t"("asmt_wndw_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "atmpt_ans_dtl_t" ADD CONSTRAINT "atmpt_ans_dtl_t_atmpt_id_fkey" FOREIGN KEY ("atmpt_id") REFERENCES "atmpt_dtl_t"("atmpt_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "atmpt_ans_dtl_t" ADD CONSTRAINT "atmpt_ans_dtl_t_qstn_id_fkey" FOREIGN KEY ("qstn_id") REFERENCES "qstn_lst_t"("qstn_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Value checks.
ALTER TABLE "qstn_lst_t" ADD CONSTRAINT "qstn_lst_t_marks_check" CHECK ("marks_ct" > 0 AND "negative_marks_ct" >= 0), ADD CONSTRAINT "qstn_lst_t_a_in_check" CHECK ("a_in" IN (0, 1));
ALTER TABLE "qstn_optn_lst_t" ADD CONSTRAINT "qstn_optn_lst_t_correct_check" CHECK ("is_correct_in" IN (0, 1));
ALTER TABLE "asmt_lst_t" ADD CONSTRAINT "asmt_lst_t_values_check" CHECK ("pass_pct" BETWEEN 0 AND 100 AND "max_attempts_ct" BETWEEN 1 AND 20 AND ("duration_min_ct" IS NULL OR "duration_min_ct" BETWEEN 1 AND 600)), ADD CONSTRAINT "asmt_lst_t_flags_check" CHECK ("shuffle_qstn_in" IN (0, 1) AND "shuffle_optn_in" IN (0, 1) AND "results_published_in" IN (0, 1) AND "a_in" IN (0, 1));
ALTER TABLE "asmt_wndw_lst_t" ADD CONSTRAINT "asmt_wndw_lst_t_times_check" CHECK ("closes_ts" > "opens_ts" AND "extra_time_min_ct" BETWEEN 0 AND 600), ADD CONSTRAINT "asmt_wndw_lst_t_a_in_check" CHECK ("a_in" IN (0, 1));
ALTER TABLE "atmpt_dtl_t" ADD CONSTRAINT "atmpt_dtl_t_flags_check" CHECK ("needs_grading_in" IN (0, 1) AND ("is_passed_in" IS NULL OR "is_passed_in" IN (0, 1)));
ALTER TABLE "asmt_wndw_lst_t" ADD CONSTRAINT "asmt_wndw_lst_t_chrt_id_fkey" FOREIGN KEY ("chrt_id") REFERENCES "chrt_lst_t"("chrt_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- APCMMS audit column behaviour on the master tables.
CREATE TRIGGER "qstn_lst_t_audit_timestamps" BEFORE UPDATE ON "qstn_lst_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "asmt_lst_t_audit_timestamps" BEFORE UPDATE ON "asmt_lst_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "asmt_wndw_lst_t_audit_timestamps" BEFORE UPDATE ON "asmt_wndw_lst_t" FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();

-- Menu: Assessments. Editors (Super Admin in a college, College Admin, Teacher) build and grade; students view and attempt.
INSERT INTO "app_mnu_itm_lst_t" ("mnu_itm_id", "mnu_itm_cd", "mnu_itm_nm", "mnu_dscn_tx", "mnu_itm_icn_tx", "mnu_itm_url_tx", "prnt_mnu_itm_id", "sqnce_id", "hdr_in", "shw_in") VALUES
  (10, 'assessments', 'Assessments', 'Question bank, quizzes, assignments and exams', 'ClipboardCheck', '/assessments', NULL, 25, 0, 1);
SELECT setval(pg_get_serial_sequence('"app_mnu_itm_lst_t"', 'mnu_itm_id'), (SELECT MAX("mnu_itm_id") FROM "app_mnu_itm_lst_t"));
INSERT INTO "app_rle_mnu_itm_rel_t" ("role_id", "mnu_itm_id", "slct_in", "insrt_in", "updt_in", "dlte_in", "exprt_in") VALUES
  (1, 10, 1, 1, 1, 1, 1),
  (2, 10, 1, 1, 1, 1, 1),
  (3, 10, 1, 1, 1, 1, 1),
  (4, 10, 1, 0, 0, 0, 0);
