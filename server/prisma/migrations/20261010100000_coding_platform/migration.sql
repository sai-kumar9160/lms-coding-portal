-- Phase 4: judge queue, problem authoring (visibility, languages, checker, scoring, reference solution), weighted test cases, coding questions in assessments.
-- CreateEnum
CREATE TYPE "CodingVisibility" AS ENUM ('PRACTICE', 'SHARED', 'ASSESSMENT');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "CheckerMode" AS ENUM ('TRIMMED', 'EXACT', 'TOKEN', 'CASE_INSENSITIVE', 'NUMERIC', 'UNORDERED');

-- CreateEnum
CREATE TYPE "ScoringMode" AS ENUM ('WEIGHTED', 'GROUP', 'BINARY');

-- CreateEnum
CREATE TYPE "JudgeStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'INTERNAL_ERROR');

-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('RUN', 'SUBMIT');

-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'CODING';

-- AlterTable
ALTER TABLE "cdng_prblm_lst_t" ADD COLUMN     "checker_cd" "CheckerMode" NOT NULL DEFAULT 'TRIMMED',
ADD COLUMN     "epsilon_ct" DOUBLE PRECISION NOT NULL DEFAULT 0.000001,
ADD COLUMN     "languages_json" JSONB,
ADD COLUMN     "max_score_ct" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "memory_limit_mb_ct" INTEGER NOT NULL DEFAULT 256,
ADD COLUMN     "reference_lang_cd" TEXT,
ADD COLUMN     "reference_solution_tx" TEXT,
ADD COLUMN     "scoring_cd" "ScoringMode" NOT NULL DEFAULT 'WEIGHTED',
ADD COLUMN     "status_cd" "ProblemStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "validated_ts" TIMESTAMP(3),
ADD COLUMN     "visibility_cd" "CodingVisibility" NOT NULL DEFAULT 'PRACTICE';

-- AlterTable
ALTER TABLE "cdng_sbmsn_dtl_t" ADD COLUMN     "atmpt_id" TEXT,
ADD COLUMN     "custom_input_tx" TEXT,
ADD COLUMN     "job_status_cd" "JudgeStatus" NOT NULL DEFAULT 'QUEUED',
ADD COLUMN     "judged_ts" TIMESTAMP(3),
ADD COLUMN     "kind_cd" "SubmissionKind" NOT NULL DEFAULT 'SUBMIT',
ADD COLUMN     "limits_json" JSONB,
ADD COLUMN     "max_score_ct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "qstn_id" TEXT,
ADD COLUMN     "score_ct" DOUBLE PRECISION,
ADD COLUMN     "started_ts" TIMESTAMP(3),
ADD COLUMN     "tries_ct" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "worker_tx" TEXT,
ALTER COLUMN "status_cd" DROP NOT NULL,
ALTER COLUMN "results_json" DROP NOT NULL;

-- AlterTable
ALTER TABLE "cdng_tst_cs_lst_t" ADD COLUMN     "explanation_tx" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "group_tx" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "weight_ct" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "qstn_lst_t" ADD COLUMN     "cdng_prblm_id" TEXT;

-- CreateIndex
CREATE INDEX "cdng_sbmsn_dtl_t_job_status_cd_i_ts_idx" ON "cdng_sbmsn_dtl_t"("job_status_cd", "i_ts");

-- CreateIndex
CREATE INDEX "cdng_sbmsn_dtl_t_atmpt_id_idx" ON "cdng_sbmsn_dtl_t"("atmpt_id");

-- AddForeignKey
ALTER TABLE "qstn_lst_t" ADD CONSTRAINT "qstn_lst_t_cdng_prblm_id_fkey" FOREIGN KEY ("cdng_prblm_id") REFERENCES "cdng_prblm_lst_t"("cdng_prblm_id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Value checks.
ALTER TABLE "cdng_prblm_lst_t" ADD CONSTRAINT "cdng_prblm_lst_t_judge_check" CHECK ("memory_limit_mb_ct" BETWEEN 16 AND 2048 AND "epsilon_ct" >= 0 AND "max_score_ct" > 0);
ALTER TABLE "cdng_tst_cs_lst_t" ADD CONSTRAINT "cdng_tst_cs_lst_t_weight_check" CHECK ("weight_ct" >= 0);
ALTER TABLE "cdng_sbmsn_dtl_t" ADD CONSTRAINT "cdng_sbmsn_dtl_t_tries_check" CHECK ("tries_ct" >= 0);

-- The existing platform library is validated (reference solutions pass every case) and may be used in practice and assessments.
UPDATE "cdng_prblm_lst_t" SET "status_cd" = 'PUBLISHED', "visibility_cd" = 'SHARED', "validated_ts" = CURRENT_TIMESTAMP WHERE "college_id" IS NULL;
-- Submissions made before the queue existed were judged synchronously.
UPDATE "cdng_sbmsn_dtl_t" SET "job_status_cd" = 'DONE', "judged_ts" = "i_ts", "max_score_ct" = 100,
  "score_ct" = CASE WHEN "total_ct" > 0 THEN ROUND(("passed_ct"::numeric / "total_ct") * 100, 2) ELSE 0 END;
