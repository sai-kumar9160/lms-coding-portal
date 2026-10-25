// Converts every text (UUID) id in the database to a whole-number id: 1, 2, 3 ... counted up by the database itself.
// Existing rows keep their data and their links; each table's rows are numbered in the order they were created.
//
// Usage (from server/):  DATABASE_URL=postgresql://... node scripts/migrate-integer-ids.mjs
// Run it once on a database that still has text ids (it stops by itself when there is nothing to convert).
// A database built from the sql/ files is already converted and needs nothing.
//
// What it changes, all in one transaction (either everything is converted or nothing is):
//   1. the primary key of 27 tables (User, Course, Lesson, cdng_prblm_lst_t, cdng_sbmsn_dtl_t, ...);
//   2. every column that points at them: foreign keys, and the plain columns without a foreign key
//      (crte_usr_id, updte_usr_id, user_id of a submission, ...).
// It keeps the "Session".sid token id and the audit log's entity_id as text: they are not row ids.
import 'dotenv/config';
import pg from 'pg';

const KEEP_AS_TEXT = new Set(['"Session".sid']);
// Columns that point at another table's id but have no foreign key in the schema.
const SOFT_REFERENCES = [
    ['Session', 'userId', 'User'], ['adt_log_dtl_t', 'actor_usr_id', 'User'], ['atmpt_ans_dtl_t', 'evaluated_by', 'User'],
    ['atmpt_dtl_t', 'user_id', 'User'], ['cdng_sbmsn_dtl_t', 'user_id', 'User'], ['cdng_sbmsn_dtl_t', 'atmpt_id', 'atmpt_dtl_t'],
    ['cdng_sbmsn_dtl_t', 'qstn_id', 'qstn_lst_t'], ['asmt_lst_t', 'course_id', 'Course'], ['qstn_lst_t', 'course_id', 'Course'],
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
let lastSql = '';
const originalQuery = client.query.bind(client);
client.query = (text, values) => { lastSql = typeof text === 'string' ? text : ''; return originalQuery(text, values); };
const q = async (text, values) => (await client.query(text, values)).rows;
const ident = name => `"${name.replace(/"/g, '""')}"`;
const table = name => ident(name);
// Gives an integer column a sequence as its default: 1, 2, 3 ... and carries on after the largest id already there.
async function counter(tbl, col) {
    const seq = `${plainName(tbl)}_${col}_seq`;
    await client.query(`CREATE SEQUENCE IF NOT EXISTS public.${ident(seq)} AS integer`);
    await client.query(`ALTER SEQUENCE public.${ident(seq)} OWNED BY ${tbl}.${ident(col)}`);
    await client.query(`ALTER TABLE ${tbl} ALTER COLUMN ${ident(col)} SET DEFAULT nextval('public.${ident(seq)}'::regclass)`);
    await client.query(`SELECT setval('public.${ident(seq)}', COALESCE((SELECT MAX(${ident(col)}) FROM ${tbl}), 0) + 1, false)`);
}
const plainName = name => name.replace(/^"|"$/g, '');

try {
    await client.query('BEGIN');

    // A database converted by an earlier version of this script has identity columns; switch them to the sequence style.
    for (const { tbl, col } of await q(`SELECT c.table_name AS tbl, c.column_name AS col FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.is_identity = 'YES'`)) {
        await client.query(`ALTER TABLE ${table(tbl)} ALTER COLUMN ${ident(col)} DROP IDENTITY IF EXISTS`);
        await counter(table(tbl), col);
    }

    // 1. The text primary keys to convert.
    const pks = (await q(`SELECT c.conrelid::regclass::text AS tbl, c.conrelid AS oid, a.attname AS col
        FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
        WHERE c.contype = 'p' AND c.connamespace = 'public'::regnamespace AND a.atttypid = 'text'::regtype ORDER BY 1`))
        .filter(pk => !KEEP_AS_TEXT.has(`${pk.tbl}.${pk.col}`));
    if (!pks.length) { console.log('Every id is already a number.'); await client.query('COMMIT'); process.exit(0); }
    const plain = name => name.replace(/^"|"$/g, '');
    const byTable = new Map(pks.map(pk => [plain(pk.tbl), pk]));

    // 2. Number the rows of each table (in creation order) in a mapping table.
    await client.query('CREATE TEMP TABLE id_map (tbl text NOT NULL, old_id text NOT NULL, new_id integer NOT NULL, PRIMARY KEY (tbl, old_id)) ON COMMIT DROP');
    for (const pk of pks) {
        const hasCreated = (await q(`SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'i_ts'`, [plain(pk.tbl)])).length > 0;
        await client.query(`INSERT INTO id_map SELECT $1, ${ident(pk.col)}, ROW_NUMBER() OVER (ORDER BY ${hasCreated ? 'i_ts, ' : ''}ctid) FROM ${pk.tbl}`, [plain(pk.tbl)]);
    }

    // 3. Every column to convert: the keys themselves, foreign keys onto them, and the soft references.
    const columns = new Map(); // "table.column" -> { table, column, target }
    const add = (tbl, column, target) => columns.set(`${tbl}.${column}`, { tbl, column, target });
    for (const pk of pks) add(plain(pk.tbl), pk.col, plain(pk.tbl));
    const fks = await q(`SELECT c.conrelid::regclass::text AS tbl, a.attname AS col, c.confrelid::regclass::text AS parent
        FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
        WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace AND array_length(c.conkey, 1) = 1`);
    for (const fk of fks) if (byTable.has(plain(fk.parent))) add(plain(fk.tbl), fk.col, plain(fk.parent));
    for (const [tbl, column, target] of SOFT_REFERENCES) add(tbl, column, target);
    for (const { table_name: tbl, column_name: column } of await q(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name IN ('crte_usr_id', 'updte_usr_id')`))
        add(tbl, column, 'User');

    // 4. Remember the constraints and indexes that touch these columns, then drop them.
    const touched = new Set([...columns.values()].map(c => c.tbl));
    const defs = { fk: [], other: [], index: [] };
    for (const tbl of touched) {
        const cols = new Set([...columns.values()].filter(c => c.tbl === tbl).map(c => c.column));
        for (const c of await q(`SELECT conname, contype, pg_get_constraintdef(oid) AS def, (SELECT array_agg(attname::text) FROM pg_attribute WHERE attrelid = conrelid AND attnum = ANY(conkey)) AS cols
                                  FROM pg_constraint WHERE conrelid = $1::regclass AND connamespace = 'public'::regnamespace AND contype <> 'n'`, [table(tbl)])) {
            const involved = c.contype === 'f' ? true : (c.cols ?? []).some(col => cols.has(col)) || [...cols].some(col => c.def.includes(ident(col)) || new RegExp(`\\b${col}\\b`).test(c.def));
            if (!involved) continue;
            (c.contype === 'f' ? defs.fk : defs.other).push({ tbl, name: c.conname, def: c.def, type: c.contype });
        }
        for (const i of await q(`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = $1
                                  AND indexname NOT IN (SELECT conname FROM pg_constraint WHERE conrelid = $2::regclass)`, [tbl, table(tbl)]))
            if ([...cols].some(col => i.indexdef.includes(ident(col)) || new RegExp(`\\b${col}\\b`).test(i.indexdef))) defs.index.push({ tbl, name: i.indexname, def: i.indexdef });
    }
    // Foreign keys first, then the primary/unique/check constraints (a primary key cannot go while a foreign key needs it).
    for (const d of defs.fk) await client.query(`ALTER TABLE ${table(d.tbl)} DROP CONSTRAINT ${ident(d.name)}`);
    for (const d of defs.index) await client.query(`DROP INDEX ${ident(d.name)}`);
    for (const d of defs.other.sort((a, b) => (b.type === 'c') - (a.type === 'c'))) await client.query(`ALTER TABLE ${table(d.tbl)} DROP CONSTRAINT ${ident(d.name)}`);

    // The audit triggers keep crte_usr_id and u_ts untouched on UPDATE, so they are switched off while ids are rewritten.
    for (const tbl of touched) await client.query(`ALTER TABLE ${table(tbl)} DISABLE TRIGGER USER`);
    // 5. Replace each old id by its number (as text first), then change the column type in place so the column order stays the same.
    for (const { tbl, column, target } of columns.values()) {
        await client.query(`UPDATE ${table(tbl)} t SET ${ident(column)} = m.new_id::text FROM id_map m WHERE m.tbl = $1 AND m.old_id = t.${ident(column)}`, [target]);
        // Anything left that is not a number points at nothing (for example a "system" actor): it becomes empty.
        await client.query(`UPDATE ${table(tbl)} SET ${ident(column)} = NULL WHERE ${ident(column)} IS NOT NULL AND ${ident(column)} !~ '^[0-9]+$'`);
        await client.query(`ALTER TABLE ${table(tbl)} ALTER COLUMN ${ident(column)} DROP DEFAULT`);
        await client.query(`ALTER TABLE ${table(tbl)} ALTER COLUMN ${ident(column)} TYPE integer USING ${ident(column)}::integer`);
    }
    // The primary keys count up by themselves from now on (a sequence with a default, the same way the College table does it).
    for (const pk of pks) {
        await client.query(`ALTER TABLE ${pk.tbl} ALTER COLUMN ${ident(pk.col)} SET NOT NULL`);
        await counter(pk.tbl, pk.col);
    }
    for (const tbl of touched) await client.query(`ALTER TABLE ${table(tbl)} ENABLE TRIGGER USER`);
    // 6. Put the constraints and indexes back (keys first so the foreign keys have something to point at).
    for (const d of defs.other.sort((a, b) => (a.type === 'c') - (b.type === 'c'))) await client.query(`ALTER TABLE ${table(d.tbl)} ADD CONSTRAINT ${ident(d.name)} ${d.def}`);
    for (const d of defs.index) await client.query(d.def);
    for (const d of defs.fk) await client.query(`ALTER TABLE ${table(d.tbl)} ADD CONSTRAINT ${ident(d.name)} ${d.def}`);

    await client.query('COMMIT');
    console.log(`Converted ${pks.length} tables and ${columns.size} id columns to whole numbers.`);
} catch (error) {
    const failed = lastSql;
    await client.query('ROLLBACK').catch(() => {});
    console.error('Nothing was changed:', error.message, '\n  while running:', failed.slice(0, 200));
    process.exitCode = 1;
} finally {
    await client.end();
}
