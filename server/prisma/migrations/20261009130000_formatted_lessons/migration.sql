-- Formatted lesson content (Markdown) with embedded images stored as lesson assets.
CREATE TYPE "ContentFormat" AS ENUM ('TEXT', 'MARKDOWN');
ALTER TYPE "FilePurpose" ADD VALUE 'IMAGE';

ALTER TABLE "Lesson" ADD COLUMN "content_fmt_cd" "ContentFormat" NOT NULL DEFAULT 'TEXT';

ALTER TABLE "file_upld_dtl_t" ADD COLUMN "lesson_id" TEXT;
ALTER TABLE "file_upld_dtl_t" ADD CONSTRAINT "file_upld_dtl_t_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "file_upld_dtl_t_lesson_id_idx" ON "file_upld_dtl_t"("lesson_id") WHERE "lesson_id" IS NOT NULL;
