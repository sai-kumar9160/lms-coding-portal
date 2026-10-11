ALTER TABLE "User" ADD COLUMN "role_id" INTEGER;

UPDATE "User" AS u SET "role_id" = r."role_id"
FROM "role_t" AS r WHERE u."role" = r."role_code";

ALTER TABLE "User" ALTER COLUMN "role_id" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "role_id" SET DEFAULT 4;
ALTER TABLE "role_t" ADD CONSTRAINT "role_t_role_id_role_code_key"
  UNIQUE ("role_id", "role_code");
ALTER TABLE "User" DROP CONSTRAINT "User_role_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_role_fkey"
  FOREIGN KEY ("role_id", "role") REFERENCES "role_t"("role_id", "role_code")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keep existing role-code API writes and numeric IDs consistent.
CREATE FUNCTION campus_sync_user_role() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role_id IS DISTINCT FROM OLD.role_id AND NEW.role IS NOT DISTINCT FROM OLD.role THEN
      SELECT role_code INTO NEW.role FROM role_t WHERE role_id = NEW.role_id;
    END IF;
  END IF;
  SELECT role_id INTO NEW.role_id FROM role_t WHERE role_code = NEW.role;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "User_sync_role" BEFORE INSERT OR UPDATE OF "role", "role_id" ON "User"
FOR EACH ROW EXECUTE FUNCTION campus_sync_user_role();
