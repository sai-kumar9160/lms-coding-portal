-- Syllabus details: course code, level, duration, objectives and outcomes; a description per module (unit).
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

ALTER TABLE "Course" ADD COLUMN "course_cd" TEXT,
ADD COLUMN "duration_hrs_ct" INTEGER,
ADD COLUMN "level_cd" "CourseLevel",
ADD COLUMN "objectives_tx" TEXT NOT NULL DEFAULT '',
ADD COLUMN "outcomes_tx" TEXT NOT NULL DEFAULT '',
ADD CONSTRAINT "Course_duration_check" CHECK ("duration_hrs_ct" IS NULL OR "duration_hrs_ct" BETWEEN 1 AND 2000);

ALTER TABLE "CourseModule" ADD COLUMN "module_dscn_tx" TEXT NOT NULL DEFAULT '';

-- Course codes are unique within a college (courses without a code are allowed).
CREATE UNIQUE INDEX "Course_collegeId_course_cd_key" ON "Course"("collegeId", "course_cd");
