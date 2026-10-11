// Writes the complete database schema to sql/ as one file per table (or per group of closely related tables).
// Each file holds every command for its tables: CREATE TABLE, sequences and defaults, primary/unique/check
// constraints, indexes, triggers, reference data (roles, menus, permissions) and foreign keys. Files run in
// numeric order on an empty database; a foreign key to a table in a later file is placed in that later file.
//
// Source: the database in DATABASE_URL (it must have every Prisma migration applied). The Prisma migrations in
// server/prisma/migrations stay the history Prisma applies; never edit an applied migration.
// Usage (from E:\LMS): npm run db:export      Needs pg_dump (PostgreSQL bin) on PATH or in PG_BIN.
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const server = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
config({ path: path.join(server, '.env') }); // works from the workspace root or from server/
const destination = path.resolve(server, '..', 'sql');

// File order follows the foreign keys. Tables with reference data get their rows exported too.
const GROUPS = [
    { file: 'types_and_functions', about: 'Enum types and the audit/role trigger functions used by the tables', tables: [] },
    { file: 'roles', about: 'Role master (Super Admin, College Admin, Teacher, Student) with its rows', tables: ['role_t'], data: true },
    { file: 'colleges', about: 'Colleges (tenants)', tables: ['College'] },
    { file: 'users', about: 'Users of every role, with status, mobile number and role checks', tables: ['User'] },
    { file: 'password_resets', about: 'One-time password reset links (token hashes only)', tables: ['pwd_rst_tkn_dtl_t'] },
    { file: 'sessions', about: 'Signed-in sessions behind the JWTs', tables: ['Session'] },
    { file: 'menus_and_permissions', about: 'Sidebar menu items and role permissions (view/create/update/delete/export) with their rows', tables: ['app_mnu_itm_lst_t', 'app_rle_mnu_itm_rel_t'], data: true },
    { file: 'academic_years', about: 'Academic years', tables: ['acdmc_yr_lst_t'] },
    { file: 'departments', about: 'Departments and their heads', tables: ['dept_lst_t'] },
    { file: 'programs', about: 'Programmes offered by departments', tables: ['prgm_lst_t'] },
    { file: 'batches', about: 'Batches (programme + academic year + section)', tables: ['btch_lst_t'] },
    { file: 'profiles', about: 'Student and teacher profiles', tables: ['stdnt_prfl_dtl_t', 'tchr_prfl_dtl_t'] },
    { file: 'cohorts', about: 'Cohorts and their members', tables: ['chrt_lst_t', 'chrt_mbr_rel_t'] },
    { file: 'courses', about: 'Courses (syllabus fields, status, sharing) and co-instructors', tables: ['Course', 'crse_instrctr_rel_t'] },
    { file: 'course_modules', about: 'Course units (modules)', tables: ['CourseModule'] },
    { file: 'lessons', about: 'Lessons: text, Markdown, video and PDF, with prerequisites', tables: ['Lesson'] },
    { file: 'files', about: 'Uploaded files (videos, PDFs, images) and the course/lesson links to them', tables: ['file_upld_dtl_t'] },
    { file: 'enrollments_and_progress', about: 'Course progress and per-lesson progress', tables: ['Enrollment', 'LessonProgress'] },
    { file: 'audit_log', about: 'Append-only audit trail of writes', tables: ['adt_log_dtl_t'] },
    { file: 'question_bank', about: 'Assessment questions and their options', tables: ['qstn_lst_t', 'qstn_optn_lst_t'] },
    { file: 'assessments', about: 'Assessments, their questions and their windows', tables: ['asmt_lst_t', 'asmt_qstn_rel_t', 'asmt_wndw_lst_t'] },
    { file: 'attempts', about: 'Student attempts and answers', tables: ['atmpt_dtl_t', 'atmpt_ans_dtl_t'] },
    { file: 'coding_practice', about: 'Coding problems, test cases and submissions (problem rows: npm run coding:import)', tables: ['cdng_prblm_lst_t', 'cdng_tst_cs_lst_t', 'cdng_sbmsn_dtl_t'] },
];
const SKIP_BLOCK = Symbol('skip');
const SKIP = new Set(['_prisma_migrations', SKIP_BLOCK]);

function pgDump(args) {
    const exe = process.env.PG_BIN ? path.join(process.env.PG_BIN, 'pg_dump') : ['C:/Program Files/PostgreSQL/18/bin/pg_dump.exe'].find(p => fs.existsSync(p)) ?? 'pg_dump';
    const url = new URL(process.env.DATABASE_URL);
    url.search = ''; // Prisma's ?schema=public is not a libpq option
    return execFileSync(exe, [`--dbname=${url}`, '--no-owner', '--no-privileges', '--no-comments', '--schema=public', ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
        .replace(/\r\n/g, '\n'); // pg_dump writes CRLF on Windows
}

// Splits pg_dump's plain output into its "-- Name: ...; Type: ...;" blocks.
function blocks(dump) {
    const out = [];
    const header = /^--\n-- (?:Data for )?Name: (.+?); Type: ([A-Z ]+); Schema: [^\n]*\n--\n/gm;
    const matches = [...dump.matchAll(header)];
    matches.forEach((m, i) => {
        const end = i + 1 < matches.length ? matches[i + 1].index : dump.length;
        const sql = dump.slice(m.index + m[0].length, end)
            .split('\n').filter(line => !/^\\(un)?restrict /.test(line) && !/^SET |^SELECT pg_catalog\.set_config/.test(line)).join('\n')
            .replace(/\n*-- PostgreSQL database dump complete[\s\S]*$/, '').trim();
        if (sql) out.push({ name: m[1], type: m[2].trim(), sql });
    });
    return out;
}

const quoted = name => /[A-Z]/.test(name) ? `"${name}"` : name;
const dump = blocks(pgDump(['--schema-only']));
const dataTables = GROUPS.filter(g => g.data).flatMap(g => g.tables);
const data = blocks(pgDump(['--data-only', '--column-inserts', ...dataTables.flatMap(t => ['-t', `public.${quoted(t)}`])]));

const groupOf = new Map(GROUPS.flatMap((g, i) => g.tables.map(t => [t, i])));
const sequenceTable = new Map();
for (const b of dump) {
    const owned = b.type === 'SEQUENCE OWNED BY' && b.sql.match(/OWNED BY public\.("?)([^".]+)\1\./);
    if (owned) sequenceTable.set(b.name, owned[2]);
}
// Which table a block belongs to, and (for foreign keys) which table it points at.
function owner(b) {
    switch (b.type) {
        case 'SCHEMA': return { table: SKIP_BLOCK }; // public already exists in a new database
        case 'TYPE': case 'FUNCTION': return { table: null };
        case 'TABLE': case 'TABLE DATA': return { table: b.name };
        case 'SEQUENCE': case 'SEQUENCE OWNED BY': case 'SEQUENCE SET': return { table: sequenceTable.get(b.name) };
        case 'DEFAULT': case 'CONSTRAINT': case 'TRIGGER': return { table: b.name.split(' ')[0] };
        case 'FK CONSTRAINT': return { table: b.name.split(' ')[0], references: b.sql.match(/REFERENCES public\.("?)([^"(]+)\1\(/)?.[2] };
        case 'INDEX': return { table: b.sql.match(/ ON (?:ONLY )?public\.("?)([^" ]+)\1 /)?.[2] };
        default: throw new Error(`Unhandled pg_dump block type ${b.type} (${b.name})`);
    }
}

const files = GROUPS.map(() => ({ schema: [], data: [], foreign: [] }));
const unknown = new Set();
for (const b of dump) {
    const { table, references } = owner(b);
    if (SKIP.has(table)) continue;
    if (table && !groupOf.has(table)) { unknown.add(table); continue; }
    const index = table ? groupOf.get(table) : 0;
    if (b.type === 'FK CONSTRAINT') files[Math.max(index, groupOf.get(references) ?? index)].foreign.push(b.sql);
    else files[index].schema.push(b.sql);
}
for (const b of data) {
    const { table } = owner(b);
    if (groupOf.has(table)) files[groupOf.get(table)].data.push(b.sql);
}
if (unknown.size)
    throw new Error(`Add these tables to GROUPS in scripts/export-sql.mjs: ${[...unknown].join(', ')}`);

for (const old of fs.readdirSync(destination).filter(name => /^\d{3}_.+\.sql$/.test(name)))
    fs.rmSync(path.join(destination, old));
GROUPS.forEach((group, i) => {
    const { schema, data: rows, foreign } = files[i];
    const name = `${String(i).padStart(2, '0')}_${group.file}.sql`;
    const sections = [schema.join('\n\n')];
    if (rows.length) sections.push(`-- Reference data\n${rows.join('\n\n')}`);
    if (foreign.length) sections.push(`-- Foreign keys\n${foreign.join('\n\n')}`);
    const header = [
        `-- ${group.about}.`,
        group.tables.length ? `-- Tables: ${group.tables.join(', ')}` : '-- Run this file first.',
        '-- Generated by server/scripts/export-sql.mjs from the migrated database. Run the files in numeric order on an empty database.',
    ].join('\n');
    fs.writeFileSync(path.join(destination, name), `${header}\n\nBEGIN;\n\n${sections.join('\n\n')}\n\nCOMMIT;\n`, 'utf8');
    console.log(`Exported sql/${name}`);
});
