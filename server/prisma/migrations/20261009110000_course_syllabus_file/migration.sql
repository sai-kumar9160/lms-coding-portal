-- The course's original syllabus / notes PDF, stored with the other uploads in file_upld_dtl_t.
ALTER TABLE "Course" ADD COLUMN "syllabus_file_id" TEXT;
ALTER TABLE "Course" ADD CONSTRAINT "Course_syllabus_file_id_fkey" FOREIGN KEY ("syllabus_file_id") REFERENCES "file_upld_dtl_t"("file_id") ON DELETE SET NULL ON UPDATE CASCADE;
