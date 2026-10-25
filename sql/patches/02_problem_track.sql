-- Adds the track (Python, C, Java, DSA, SQL, HTML & CSS, General) a coding problem belongs to; students browse problems by track.
-- For databases built before this column existed. A new database gets it from sql/22.
--   psql -h localhost -p 5433 -U postgres -d LMS_PORTAL -v ON_ERROR_STOP=1 -f sql/patches/02_problem_track.sql
ALTER TABLE public.cdng_prblm_lst_t ADD COLUMN IF NOT EXISTS track_tx text NOT NULL DEFAULT 'General';
