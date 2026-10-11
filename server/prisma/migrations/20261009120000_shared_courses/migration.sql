-- Courses shared with every college: visible read-only to all colleges' students and teachers once published.
ALTER TABLE "Course" ADD COLUMN "shared_in" SMALLINT NOT NULL DEFAULT 0,
ADD CONSTRAINT "Course_shared_in_check" CHECK ("shared_in" IN (0, 1));
CREATE INDEX "Course_shared_in_idx" ON "Course"("shared_in") WHERE "shared_in" = 1;
