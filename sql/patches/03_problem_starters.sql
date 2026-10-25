-- Starting code a student sees in the editor, per language, as JSON such as {"c": "...", "java": "..."}.
-- Used where the starting lines are written by hand (C, Java, React); Python and the multi-language DSA problems get theirs automatically.
-- For databases built before this column existed. A new database gets it from sql/22.
--   psql -h localhost -p 5433 -U postgres -d LMS_PORTAL -v ON_ERROR_STOP=1 -f sql/patches/03_problem_starters.sql
ALTER TABLE public.cdng_prblm_lst_t ADD COLUMN IF NOT EXISTS starters_json jsonb;
