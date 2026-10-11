-- Step 2: uploaded files, video/PDF lessons, prerequisites, course status, co-instructors, progress tracking.
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LessonType" AS ENUM ('TEXT', 'VIDEO', 'DOCUMENT');
CREATE TYPE "InstructorRole" AS ENUM ('OWNER', 'CO_INSTRUCTOR');
CREATE TYPE "FilePurpose" AS ENUM ('VIDEO', 'DOCUMENT');

-- Backfills below must not change u_ts/updte_usr_id, so audit triggers are paused for them.
ALTER TABLE "Course" DISABLE TRIGGER "Course_audit_timestamps";
ALTER TABLE "Enrollment" DISABLE TRIGGER "Enrollment_audit_timestamps";

-- Course.published (boolean) becomes Course.status.
ALTER TABLE "Course" ADD COLUMN "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT';
UPDATE "Course" SET "status" = 'PUBLISHED' WHERE "published" = true;
ALTER TABLE "Course" DROP COLUMN "published";

ALTER TABLE "Enrollment" ADD COLUMN "completed_at" TIMESTAMP(3),
ADD COLUMN "progress_pct" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Lesson" ADD COLUMN "allow_download_in" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN "duration_sec" INTEGER,
ADD COLUMN "file_id" TEXT,
ADD COLUMN "lesson_type" "LessonType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN "prerequisite_lesson_id" TEXT,
ADD COLUMN "published_in" SMALLINT NOT NULL DEFAULT 1,
ALTER COLUMN "content" SET DEFAULT '',
ADD CONSTRAINT "Lesson_flags_check" CHECK ("allow_download_in" IN (0, 1) AND "published_in" IN (0, 1)),
ADD CONSTRAINT "Lesson_duration_check" CHECK ("duration_sec" IS NULL OR "duration_sec" >= 0),
ADD CONSTRAINT "Lesson_prerequisite_self_check" CHECK ("prerequisite_lesson_id" IS NULL OR "prerequisite_lesson_id" <> "id");

-- Existing progress rows were completions and keep their completedAt. New rows may be in progress (NULL).
ALTER TABLE "LessonProgress" ADD COLUMN "last_position_sec" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "time_spent_sec" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "completedAt" DROP NOT NULL,
ALTER COLUMN "completedAt" DROP DEFAULT;

CREATE TABLE "crse_instrctr_rel_t" (
    "crse_instrctr_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "instrctr_role_cd" "InstructorRole" NOT NULL DEFAULT 'CO_INSTRUCTOR',
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1 CHECK ("a_in" IN (0, 1)),
    "d_ts" TIMESTAMP(3),
    CONSTRAINT "crse_instrctr_rel_t_pkey" PRIMARY KEY ("crse_instrctr_id")
);

CREATE TABLE "file_upld_dtl_t" (
    "file_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "storage_key_tx" TEXT NOT NULL,
    "orgnl_file_nm" TEXT NOT NULL,
    "mime_type_tx" TEXT NOT NULL,
    "size_bytes_ct" INTEGER NOT NULL CHECK ("size_bytes_ct" >= 0),
    "checksum_tx" TEXT NOT NULL,
    "purpose_cd" "FilePurpose" NOT NULL,
    "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_ts" TIMESTAMP(3),
    "crte_usr_id" TEXT,
    "updte_usr_id" TEXT,
    "a_in" SMALLINT NOT NULL DEFAULT 1 CHECK ("a_in" IN (0, 1)),
    "d_ts" TIMESTAMP(3),
    CONSTRAINT "file_upld_dtl_t_pkey" PRIMARY KEY ("file_id")
);

CREATE INDEX "crse_instrctr_rel_t_college_id_idx" ON "crse_instrctr_rel_t"("college_id");
CREATE UNIQUE INDEX "crse_instrctr_rel_t_course_id_user_id_key" ON "crse_instrctr_rel_t"("course_id", "user_id");
CREATE UNIQUE INDEX "file_upld_dtl_t_storage_key_tx_key" ON "file_upld_dtl_t"("storage_key_tx");
CREATE INDEX "file_upld_dtl_t_college_id_idx" ON "file_upld_dtl_t"("college_id");

ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_upld_dtl_t"("file_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_prerequisite_lesson_id_fkey" FOREIGN KEY ("prerequisite_lesson_id") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crse_instrctr_rel_t" ADD CONSTRAINT "crse_instrctr_rel_t_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crse_instrctr_rel_t" ADD CONSTRAINT "crse_instrctr_rel_t_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "file_upld_dtl_t" ADD CONSTRAINT "file_upld_dtl_t_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER "crse_instrctr_rel_t_audit_timestamps" BEFORE UPDATE ON "crse_instrctr_rel_t"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "file_upld_dtl_t_audit_timestamps" BEFORE UPDATE ON "file_upld_dtl_t"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();

-- Every existing course owner becomes its OWNER instructor.
INSERT INTO "crse_instrctr_rel_t" ("crse_instrctr_id", "college_id", "course_id", "user_id", "instrctr_role_cd", "crte_usr_id")
SELECT gen_random_uuid()::text, "collegeId", "id", "teacherId", 'OWNER', "teacherId" FROM "Course";

-- Progress percentage for existing enrollments: completed active lessons / active lessons.
WITH course_lessons AS (
    SELECT m."courseId" AS course_id, l."id" AS lesson_id FROM "Lesson" l JOIN "CourseModule" m ON m."id" = l."moduleId"
    WHERE l."a_in" = 1 AND m."a_in" = 1
), totals AS (
    SELECT course_id, COUNT(*) AS total FROM course_lessons GROUP BY course_id
), pct AS (
    SELECT en."id", CASE WHEN COALESCE(t.total, 0) = 0 THEN 0 ELSE (100 * COUNT(lp."id") / t.total)::int END AS value
    FROM "Enrollment" en
    LEFT JOIN totals t ON t.course_id = en."courseId"
    LEFT JOIN course_lessons cl ON cl.course_id = en."courseId"
    LEFT JOIN "LessonProgress" lp ON lp."lessonId" = cl.lesson_id AND lp."userId" = en."userId" AND lp."a_in" = 1 AND lp."completedAt" IS NOT NULL
    GROUP BY en."id", t.total
)
UPDATE "Enrollment" e SET "progress_pct" = pct.value, "completed_at" = CASE WHEN pct.value = 100 THEN CURRENT_TIMESTAMP END
FROM pct WHERE e."id" = pct."id";

ALTER TABLE "Course" ENABLE TRIGGER "Course_audit_timestamps";
ALTER TABLE "Enrollment" ENABLE TRIGGER "Enrollment_audit_timestamps";
