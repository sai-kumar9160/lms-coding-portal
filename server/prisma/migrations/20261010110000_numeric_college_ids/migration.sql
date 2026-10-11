-- Assign existing colleges 1, 2, 3... in creation order and preserve all tenant links.
BEGIN;
LOCK TABLE "College" IN ACCESS EXCLUSIVE MODE;
CREATE TEMP TABLE college_id_map ON COMMIT DROP AS
SELECT id AS old_id, row_number() OVER (ORDER BY i_ts, id)::integer AS new_id
FROM "College";
CREATE UNIQUE INDEX ON college_id_map(old_id);
-- Deleted colleges can remain in the audit trail. Preserve their tenant grouping,
-- reserving IDs after the current colleges without recreating deleted records.
INSERT INTO college_id_map(old_id, new_id)
SELECT old_id, (SELECT COALESCE(MAX(new_id), 0) FROM college_id_map)
  + row_number() OVER (ORDER BY old_id)::integer
FROM (SELECT DISTINCT college_id AS old_id FROM adt_log_dtl_t
      WHERE college_id IS NOT NULL
        AND college_id NOT IN (SELECT old_id FROM college_id_map)) historical;

-- Keep the original foreign key definitions, including their delete/update actions.
CREATE TEMP TABLE college_foreign_keys ON COMMIT DROP AS
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE contype = 'f' AND confrelid = '"College"'::regclass;
DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT * FROM college_foreign_keys LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', item.table_name, item.conname);
  END LOOP;
END $$;

CREATE FUNCTION pg_temp.numeric_college_id(old_id text) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE mapped_id integer;
BEGIN
  IF old_id IS NULL THEN RETURN NULL; END IF;
  SELECT new_id INTO mapped_id FROM college_id_map WHERE college_id_map.old_id = $1;
  IF mapped_id IS NULL THEN RAISE EXCEPTION 'Unmapped college ID: %', old_id; END IF;
  RETURN mapped_id;
END $$;

-- Include tenant columns without declared foreign keys (academics, progress, audits, coding).
DO $$
DECLARE item record;
BEGIN
  FOR item IN
    SELECT c.table_schema, c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t USING (table_schema, table_name)
    WHERE c.table_schema = current_schema() AND t.table_type = 'BASE TABLE'
      AND c.column_name IN ('collegeId', 'college_id')
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE integer USING pg_temp.numeric_college_id(%I)',
      item.table_schema, item.table_name, item.column_name, item.column_name);
  END LOOP;
END $$;

ALTER TABLE "College" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE "College" ALTER COLUMN id TYPE integer USING pg_temp.numeric_college_id(id);
CREATE SEQUENCE "College_id_seq" AS integer OWNED BY "College".id;
ALTER TABLE "College" ALTER COLUMN id SET DEFAULT nextval('"College_id_seq"');
SELECT setval('"College_id_seq"', COALESCE(MAX(new_id), 1), MAX(new_id) IS NOT NULL) FROM college_id_map;

DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT * FROM college_foreign_keys LOOP
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s', item.table_name, item.conname, item.definition);
  END LOOP;
END $$;
-- Embedded JWTs contain the former college IDs; users sign in again after this migration.
DELETE FROM "Session";
COMMIT;
