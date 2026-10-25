# Database SQL (one file per table)

This folder holds the complete Campus LMS schema, split by table. Each file contains **every command for its table or tables**:

- `CREATE TABLE` with all columns, defaults and checks;
- sequences, primary keys and unique keys;
- indexes, including partial ones;
- triggers;
- reference rows, where the table has them;
- foreign keys.

Run the files in numeric order on an **empty** database. A foreign key that points to a table in a later file is placed in that later file. For example, `Course.syllabus_file_id → file_upld_dtl_t` is in `16_files.sql`.

| File | Tables | Contents |
| --- | --- | --- |
| `00_types_and_functions.sql` | – | Enum types (`Role`, `CourseStatus`, `QuestionType`, …) and the trigger functions `campus_set_audit_timestamps` and `campus_sync_user_role` |
| `01_roles.sql` | `role_t` | Role master and its 4 rows |
| `02_colleges.sql` | `College` | Colleges (tenants) |
| `03_users.sql` | `User` | Users, status, mobile number, unique Super Admin email, role sync trigger |
| `04_password_resets.sql` | `pwd_rst_tkn_dtl_t` | One-time password reset links |
| `05_sessions.sql` | `Session` | Signed-in sessions |
| `06_menus_and_permissions.sql` | `app_mnu_itm_lst_t`, `app_rle_mnu_itm_rel_t` | Sidebar menus and role permissions, with their rows |
| `07_academic_years.sql` | `acdmc_yr_lst_t` | Academic years |
| `08_departments.sql` | `dept_lst_t` | Departments |
| `09_programs.sql` | `prgm_lst_t` | Programmes |
| `10_batches.sql` | `btch_lst_t` | Batches |
| `11_profiles.sql` | `stdnt_prfl_dtl_t`, `tchr_prfl_dtl_t` | Student and teacher profiles |
| `12_cohorts.sql` | `chrt_lst_t`, `chrt_mbr_rel_t` | Cohorts and members |
| `13_courses.sql` | `Course`, `crse_instrctr_rel_t` | Courses and co-instructors |
| `14_course_modules.sql` | `CourseModule` | Course units |
| `15_lessons.sql` | `Lesson` | Lessons |
| `16_files.sql` | `file_upld_dtl_t` | Uploaded files, and the course/lesson foreign keys to them |
| `17_enrollments_and_progress.sql` | `Enrollment`, `LessonProgress` | Course and lesson progress |
| `18_audit_log.sql` | `adt_log_dtl_t` | Audit trail |
| `19_question_bank.sql` | `qstn_lst_t`, `qstn_optn_lst_t` | Assessment questions and options |
| `20_assessments.sql` | `asmt_lst_t`, `asmt_qstn_rel_t`, `asmt_wndw_lst_t` | Assessments, their questions and windows |
| `21_attempts.sql` | `atmpt_dtl_t`, `atmpt_ans_dtl_t` | Attempts and answers |
| `22_coding_practice.sql` | `cdng_prblm_lst_t`, `cdng_tst_cs_lst_t`, `cdng_sbmsn_dtl_t` | Coding problems, test cases, submissions |

Each file runs in its own transaction.

## How the database is built

These files **are** the schema. `npm run db:setup` (from the repository root) runs them in numeric order when the database is empty, then loads the demo data (`server/scripts/seed.mjs`) and the coding problem library (`server/scripts/import-problems.mjs`). Running it again on an existing database only refreshes the demo data.

```powershell
npm run db:setup
```

To change the schema, edit the file of the table you are changing, or add a new numbered file for a new table, and update the SQL in the matching model under `server/src/modules/`. For an existing database, apply the same change by hand with `psql`.

Instead of `db:setup` you can run the files yourself:

```powershell
$bin = 'C:\Program Files\PostgreSQL\18\bin'
Get-ChildItem sql\*.sql | Sort-Object Name | ForEach-Object {
    & "$bin\psql.exe" -h localhost -p 5432 -U postgres -d lms_new -v ON_ERROR_STOP=1 -f $_.FullName
}
```

`npm run db:export` rewrites these files from a running database with `pg_dump` (useful after changing a table directly in pgAdmin); it needs `pg_dump` on PATH or in the folder named by `PG_BIN`.

These files contain only the schema and reference rows: roles, menus and permissions. Colleges, users, courses and coding problems come from the seed and import scripts.
