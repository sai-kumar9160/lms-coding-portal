-- APCMMS-style audit fields. Preserve existing creation timestamps.
ALTER TABLE "Session" ADD COLUMN "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Session"
  ADD COLUMN "u_ts" TIMESTAMP(3),
  ADD COLUMN "crte_usr_id" TEXT,
  ADD COLUMN "updte_usr_id" TEXT,
  ADD COLUMN "a_in" SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN "d_ts" TIMESTAMP(3),
  ADD CONSTRAINT "Session_a_in_check" CHECK ("a_in" IN (0, 1));

ALTER TABLE "College" RENAME COLUMN "createdAt" TO "i_ts";
ALTER TABLE "College"
  ADD COLUMN "u_ts" TIMESTAMP(3),
  ADD COLUMN "crte_usr_id" TEXT,
  ADD COLUMN "updte_usr_id" TEXT,
  ADD COLUMN "a_in" SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN "d_ts" TIMESTAMP(3),
  ADD CONSTRAINT "College_a_in_check" CHECK ("a_in" IN (0, 1));

ALTER TABLE "User" ADD COLUMN "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User"
  ADD COLUMN "u_ts" TIMESTAMP(3),
  ADD COLUMN "crte_usr_id" TEXT,
  ADD COLUMN "updte_usr_id" TEXT,
  ADD COLUMN "a_in" SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN "d_ts" TIMESTAMP(3),
  ADD CONSTRAINT "User_a_in_check" CHECK ("a_in" IN (0, 1));

ALTER TABLE "Course" RENAME COLUMN "createdAt" TO "i_ts";
ALTER TABLE "Course"
  ADD COLUMN "u_ts" TIMESTAMP(3),
  ADD COLUMN "crte_usr_id" TEXT,
  ADD COLUMN "updte_usr_id" TEXT,
  ADD COLUMN "a_in" SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN "d_ts" TIMESTAMP(3),
  ADD CONSTRAINT "Course_a_in_check" CHECK ("a_in" IN (0, 1));

ALTER TABLE "CourseModule" ADD COLUMN "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CourseModule"
  ADD COLUMN "u_ts" TIMESTAMP(3),
  ADD COLUMN "crte_usr_id" TEXT,
  ADD COLUMN "updte_usr_id" TEXT,
  ADD COLUMN "a_in" SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN "d_ts" TIMESTAMP(3),
  ADD CONSTRAINT "CourseModule_a_in_check" CHECK ("a_in" IN (0, 1));

ALTER TABLE "Lesson" ADD COLUMN "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Lesson"
  ADD COLUMN "u_ts" TIMESTAMP(3),
  ADD COLUMN "crte_usr_id" TEXT,
  ADD COLUMN "updte_usr_id" TEXT,
  ADD COLUMN "a_in" SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN "d_ts" TIMESTAMP(3),
  ADD CONSTRAINT "Lesson_a_in_check" CHECK ("a_in" IN (0, 1));

ALTER TABLE "Enrollment" RENAME COLUMN "createdAt" TO "i_ts";
ALTER TABLE "Enrollment"
  ADD COLUMN "u_ts" TIMESTAMP(3),
  ADD COLUMN "crte_usr_id" TEXT,
  ADD COLUMN "updte_usr_id" TEXT,
  ADD COLUMN "a_in" SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN "d_ts" TIMESTAMP(3),
  ADD CONSTRAINT "Enrollment_a_in_check" CHECK ("a_in" IN (0, 1));

ALTER TABLE "LessonProgress" ADD COLUMN "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "LessonProgress"
  ADD COLUMN "u_ts" TIMESTAMP(3),
  ADD COLUMN "crte_usr_id" TEXT,
  ADD COLUMN "updte_usr_id" TEXT,
  ADD COLUMN "a_in" SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN "d_ts" TIMESTAMP(3),
  ADD CONSTRAINT "LessonProgress_a_in_check" CHECK ("a_in" IN (0, 1));

-- Existing progress creation time is known; retain it.
UPDATE "LessonProgress" SET "i_ts" = "completedAt";

-- PostgreSQL equivalent of MySQL ON UPDATE CURRENT_TIMESTAMP.
CREATE FUNCTION campus_set_audit_timestamps() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.i_ts := OLD.i_ts;
  NEW.crte_usr_id := OLD.crte_usr_id;
  NEW.u_ts := CURRENT_TIMESTAMP;
  IF NEW.a_in = 0 AND OLD.a_in = 1 THEN
    NEW.d_ts := CURRENT_TIMESTAMP;
  ELSIF NEW.a_in = 1 THEN
    NEW.d_ts := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "Session_audit_timestamps" BEFORE UPDATE ON "Session"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "College_audit_timestamps" BEFORE UPDATE ON "College"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "User_audit_timestamps" BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "Course_audit_timestamps" BEFORE UPDATE ON "Course"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "CourseModule_audit_timestamps" BEFORE UPDATE ON "CourseModule"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "Lesson_audit_timestamps" BEFORE UPDATE ON "Lesson"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "Enrollment_audit_timestamps" BEFORE UPDATE ON "Enrollment"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
CREATE TRIGGER "LessonProgress_audit_timestamps" BEFORE UPDATE ON "LessonProgress"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
