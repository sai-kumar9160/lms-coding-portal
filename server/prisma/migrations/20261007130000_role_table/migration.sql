CREATE TABLE "role_t" (
  "role_id" INTEGER NOT NULL PRIMARY KEY,
  "role_code" "Role" NOT NULL UNIQUE,
  "role_name" TEXT NOT NULL,
  "i_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "u_ts" TIMESTAMP(3),
  "crte_usr_id" TEXT,
  "updte_usr_id" TEXT,
  "a_in" SMALLINT NOT NULL DEFAULT 1 CHECK ("a_in" IN (0, 1)),
  "d_ts" TIMESTAMP(3)
);

INSERT INTO "role_t" ("role_id", "role_code", "role_name") VALUES
  (1, 'SUPER_ADMIN', 'Super Admin'),
  (2, 'COLLEGE_ADMIN', 'College Admin'),
  (3, 'TEACHER', 'Teacher'),
  (4, 'STUDENT', 'Student');

-- Link existing users without replacing their role values or accounts.
ALTER TABLE "User" ADD CONSTRAINT "User_role_fkey"
  FOREIGN KEY ("role") REFERENCES "role_t"("role_code")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER "role_t_audit_timestamps" BEFORE UPDATE ON "role_t"
FOR EACH ROW EXECUTE FUNCTION campus_set_audit_timestamps();
