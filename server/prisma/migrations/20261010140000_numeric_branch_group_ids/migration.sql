BEGIN;
LOCK TABLE chrt_lst_t, chrt_mbr_rel_t, asmt_wndw_lst_t IN ACCESS EXCLUSIVE MODE;
CREATE TEMP TABLE branch_id_map ON COMMIT DROP AS
SELECT chrt_id AS old_id, row_number() OVER (ORDER BY i_ts, chrt_id)::integer AS new_id FROM chrt_lst_t;
CREATE UNIQUE INDEX ON branch_id_map(old_id);
CREATE TEMP TABLE branch_fks ON COMMIT DROP AS
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE contype = 'f' AND confrelid = 'chrt_lst_t'::regclass;
DO $$ DECLARE item record; BEGIN
FOR item IN SELECT * FROM branch_fks LOOP
EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', item.table_name, item.conname);
END LOOP; END $$;
CREATE FUNCTION pg_temp.branch_number(value text) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE result integer; BEGIN
IF value IS NULL THEN RETURN NULL; END IF;
SELECT new_id INTO result FROM branch_id_map WHERE old_id = value;
IF result IS NULL THEN RAISE EXCEPTION 'Missing branch mapping: %', value; END IF;
RETURN result; END $$;
ALTER TABLE chrt_mbr_rel_t ALTER COLUMN chrt_id TYPE integer USING pg_temp.branch_number(chrt_id);
ALTER TABLE asmt_wndw_lst_t ALTER COLUMN chrt_id TYPE integer USING pg_temp.branch_number(chrt_id);
ALTER TABLE chrt_lst_t ALTER COLUMN chrt_id DROP DEFAULT;
ALTER TABLE chrt_lst_t ALTER COLUMN chrt_id TYPE integer USING pg_temp.branch_number(chrt_id);
CREATE SEQUENCE chrt_lst_t_chrt_id_seq AS integer OWNED BY chrt_lst_t.chrt_id;
ALTER TABLE chrt_lst_t ALTER COLUMN chrt_id SET DEFAULT nextval('chrt_lst_t_chrt_id_seq');
SELECT setval('chrt_lst_t_chrt_id_seq', COALESCE(MAX(new_id), 1), MAX(new_id) IS NOT NULL) FROM branch_id_map;
DO $$ DECLARE item record; BEGIN
FOR item IN SELECT * FROM branch_fks LOOP
EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s', item.table_name, item.conname, item.definition);
END LOOP; END $$;
COMMIT;
