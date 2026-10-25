-- Pseudocode and a plain-language explanation for a coding problem, shown from the problem page.
-- For databases built before these columns existed. A new database gets them from sql/22.
--   psql -h localhost -p 5433 -U postgres -d LMS_PORTAL -v ON_ERROR_STOP=1 -f sql/patches/04_problem_pseudocode.sql
ALTER TABLE public.cdng_prblm_lst_t ADD COLUMN IF NOT EXISTS pseudocode_tx text;
ALTER TABLE public.cdng_prblm_lst_t ADD COLUMN IF NOT EXISTS explanation_tx text;
