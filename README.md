# Campus LMS

React + JavaScript client and Express + JavaScript server backed by PostgreSQL and Prisma.

Development is local in `client` and `server`. The complete database schema is in the root [`sql`](sql/README.md) folder, one file per table (or group of related tables), with every command for that table. Run `npm run db:export` to regenerate it after applying a new Prisma migration.

Database connection configuration lives in [`server/config/db.config.js`](server/config/db.config.js). The API, session store, and seed script use this shared Prisma client; credentials come from the ignored `server/.env`. The server starts from `server/nodeapp.js` (`npm start -w server`); no TypeScript compilation is required. React source files use `.jsx`.

## Run locally

Prerequisites: Node.js 22+, npm, PostgreSQL (or Docker Desktop).

```powershell
npm install
Copy-Item server/.env.example server/.env
# Set separate random JWT_SECRET and SESSION_SECRET values (32+ characters).
docker compose up -d postgres
npm run db:generate -w server
npm run db:setup
npm run dev
```

Run in two separate terminals using the current configured database:

Terminal 1 - backend:

```powershell
cd E:\LMS\server
npm run dev
# Alternatively: node nodeapp.js
```

Terminal 2 - frontend:

```powershell
cd E:\LMS\client
npm run dev
```

Stop any previously running copy with Ctrl+C before starting it again. Open the frontend URL printed by Vite (normally http://localhost:5173). The API runs at http://localhost:4000. `src/index.js` configures Express; `nodeapp.js` starts the listener.

The current local setup uses your existing PostgreSQL 18 service at `localhost:5432`, database `Lms_portsl`, user `postgres`. Its password is stored only in the ignored `server/.env`; the `@` character is URL-encoded in DATABASE_URL. Both migrations and demo seed data have been applied to this database. Keep your existing `.env` when restarting the app.

During initial implementation, a separate local PostgreSQL cluster was created in `.local/postgres` on port 5433. It is no longer the application's configured database. If you choose to use that alternative, it uses local trust authentication and listens only on 127.0.0.1. To restart it after reboot:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D 'E:\LMS\.local\postgres' -l 'E:\LMS\.local\postgres.log' -o '-p 5433 -h 127.0.0.1' start
```

If using Docker instead, set DATABASE_URL to the value in `server/.env.example`. Database data and secrets are ignored by Git.

## Demo logins

The initial screen now offers registration first, with a Sign in tab for existing accounts. Register as Student or Teacher using an active college code (for example `alpha`), name, email, mobile number, password (10+ characters), and confirmation. Successful registration takes you to sign in; it does not automatically create a login session. Public registration cannot create College Admin or Super Admin accounts.

Login and registration validation are in `server/src/controllers/auth.controller.js`; account database operations and password hashing are in `server/src/models/auth.model.js`. The required mobile number is stored as `User.mobile_no` and must be unique within a college. Existing accounts retain null until a real number is provided. Admin-created student and teacher accounts also require a mobile number. Self-registered students are active immediately; self-registered teachers wait for approval (see below). Tables: `sql/03_users.sql`.

All demo passwords: `DemoPass123!`. Seed accounts are for local development only and are not shown on the sign-in page.

## Forgot password

Tables: `sql/04_password_resets.sql` (table `pwd_rst_tkn_dtl_t`).

1. On the sign-in form, **Forgot password?** asks for the college code (left empty for Super Admin) and email, then calls `POST /api/auth/forgot-password`.
2. The answer is always the same, so it does not reveal whether an account exists.
3. For a matching active account, the server emails a one-time link `<frontend>/reset-password?token=…`. The link expires after 30 minutes, and only the token's SHA-256 is stored.
4. A new request replaces the previous link. At most one email per account is sent per minute, and both endpoints share the login rate limit.
5. The link opens **Choose a new password**, which calls `POST /api/auth/reset-password`. Saving uses up the link, updates the password and signs the account out on every device.

Email settings are `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` and `MAIL_FROM` in `server/.env` (see `.env.example`). Without `SMTP_HOST`, development writes the email text, including the link, to the server log so it can be tested. Production only logs that the email could not be sent.

| Role | College code | Email |
| --- | --- | --- |
| Super Admin | leave empty | super@lms.local |
| College Admin | alpha | admin@alpha.local |
| Teacher | alpha | teacher@alpha.local |
| Student | alpha | student@alpha.local |

Use `beta` and replace `alpha` with `beta` in the email for the second college.

## Teacher approval and account status

`User.status` is `PENDING` or `ACTIVE` (`sql/03_users.sql`). Students who self-register are `ACTIVE` immediately. Teachers who self-register are `PENDING` and receive 403 on sign-in until a College Admin approves them on the **People** page (`POST /api/users/:id/approve`). College Admins can also reject or deactivate teachers and students (`DELETE /api/users/:id`). This sets `a_in = 0` and deletes the user's sessions. Admin-created accounts start `ACTIVE`. Pending accounts are hidden from teachers' user lists.

Super Admin emails are unique through the partial index `User_platform_email_key`, because `(collegeId, email)` does not cover NULL college IDs. Prisma cannot model partial indexes. If a future `prisma migrate dev` generates `DROP INDEX "User_platform_email_key"`, delete that line from the generated migration.

## Code layout

Server (`server/`):

| Path | Purpose |
| --- | --- |
| `nodeapp.js` | Loads `.env` and starts the listener |
| `src/index.js` | Express setup: request logger, helmet, CORS, JSON body, `/api` routes, error handler |
| `src/routes/api.routes.js` | URL → middleware → controller. `can(menuCode, action)` guards each route |
| `src/controllers/*` | zod validation and responses only |
| `src/models/*` | All Prisma queries, tenant scoping and permission data |
| `src/middleware/*` | `auth` (origin guard, JWT + session, college context), `permission`, `request-logger`, `error` |
| `src/services/*` | Session store and token helpers, upstream proxy |
| `src/utils/*` | `logger`, `http-error` (`fail`, `notFound`), `tree` (menu tree builder) |
| `config/*` | `db.config`, `cors.config` (single origin allowlist), `proxy.config` (trust proxy, proxy targets) |

Client (`client/src/`): `main.jsx` mounts React Router. `App.jsx` restores the session and creates routes from the database menu. `workspace.jsx` holds the signed-in state, including `menu` and `can(code, action)`. `components/AppLayout.jsx` renders the database sidebar. `pages/registry.js` maps menu URLs to pages.

## Database menus and permissions

The sidebar, routes, buttons and API permissions all come from two tables (`sql/06_menus_and_permissions.sql`), named in the APCMMS style:

- `app_mnu_itm_lst_t`: menu items.
  - `mnu_itm_cd` is the permission code.
  - `mnu_itm_nm`, `mnu_itm_icn_tx` (lucide icon name) and `mnu_itm_url_tx` (route) describe the menu entry.
  - `prnt_mnu_itm_id` and `sqnce_id` set the tree and ordering.
  - `hdr_in = 1` makes a section header.
  - `shw_in = 0` makes a permission object that never appears in the sidebar, such as `enrollments`.
- `app_rle_mnu_itm_rel_t`: role ↔ menu item.
  - `slct_in` (view, which also controls sidebar visibility), `insrt_in` (create), `updt_in` (update), `dlte_in` (delete) and `exprt_in` (export).

The server returns the signed-in role's tree and flags from `GET /api/menu`. API routes use `requirePermission(code, action)` against the same rows, so a visible menu and its API access cannot disagree. Header rows need no permission; they appear when any child is visible. Super Admins edit the matrix on **Platform → Access control** (`GET/PUT /api/access/roles/:roleId/permissions`). Changes apply to that role in every college and take effect immediately on the server that saved them. Other server processes pick them up within 60 seconds. Super Admin cannot remove its own Access control view and update permissions.

**Super Admin college switcher** (`sql/06_menus_and_permissions.sql`):
- A Super Admin belongs to no college. To manage a college's courses, they pick it in **Working in** at the top of the page.
- The client then sends `x-college-id` with API requests, or `?college=` on media URLs.
- The server accepts the header only from Super Admin sessions and only for an existing college; other roles always stay in their own college.
- Every such request is logged with `actingAsSuperAdmin: true`.
- The choice is remembered for the browser tab. Choose **Platform (no college)** to leave the college.

To add a page:
1. Insert a row in `app_mnu_itm_lst_t` with a unique code, URL and icon.
2. Grant roles in `app_rle_mnu_itm_rel_t`.
3. Register the URL and component in `client/src/pages/registry.js`, and the icon in `components/menuIcons.js` if it is new.
4. Protect its API routes with `can('<code>', '<action>')`.

| Code | Super Admin | College Admin | Teacher | Student |
| --- | --- | --- | --- | --- |
| overview | view | view | view | view |
| courses | view, create, update, delete (in the college chosen with "Working in") | view, create, update, delete | view, create, update, delete (own courses) | view |
| people | view, create, update, delete (in the college chosen with "Working in") | view, create, update, delete | view | none |
| colleges (under Platform) | view, create, update | none | none | none |
| access-control (under Platform) | view, update | none | none | none |
| enrollments, shown as "Learning progress" (not in sidebar) | none | none | none | view, update (record progress, complete lessons) |
| academics | view, create, update, delete (in the chosen college) | view, create, update, delete | none | none |
| audit-log | view, export (all colleges, or the chosen one) | view, export (own college) | none | none |

## Logging, CORS and proxy

- **Logging** (`src/utils/logger.js`):
  - Write logs with `createLogger('module').info|warn|error|debug(message, meta)`.
  - Each entry prints a readable console line and is also written as JSON lines to `server/logs/app-YYYY-MM-DD.log`. Files are kept for `LOG_RETENTION_DAYS` (default 14).
  - Every request gets an `x-request-id`, and `request-logger` logs its method, path, status, duration, user and college.
  - Request bodies, query strings and headers are never logged.
  - Unexpected 500 errors are logged with their stack trace and return the request ID as a reference.
- **CORS** (`config/cors.config.js`):
  - One `CLIENT_ORIGINS` allowlist is used by both CORS and the API origin guard.
  - Credentials are allowed; `x-access-token` and `x-request-id` are exposed.
  - Requests from other origins get no CORS headers and a 403.
- **Trust proxy**: `TRUST_PROXY` accepts a hop count, `loopback`, or the proxy's IP addresses. `true` is rejected.
- **Upstream proxy**:
  - `ALL /api/proxy/:service/*` forwards signed-in requests to services allowlisted in `PROXY_TARGETS` (see `server/.env.example`), with the allowed roles set per service.
  - The upstream receives `x-lms-user-id`, `x-lms-role`, `x-lms-college-id`, `x-request-id` and its own API key. The user's cookie, JWT and CSRF token are never forwarded.
  - Path traversal is rejected, redirects are not followed, responses are size-limited and requests time out (504).
  - No services are configured by default.
- The Vite dev server proxies `/api` to the backend on port 4000.

## Implemented workflow

Database settings in `server/config/db.config.js` now use APCMMS-style constants (`DB_HOST_NAME`, `DB_PORT`, `USER`, `PWD`, `DATABASE`). They are resolved from the ignored `.env`, with DATABASE_URL as the default source. Prisma manages a shared PostgreSQL pool capped at 10 connections per process by default, with a 10-second pool wait timeout. Adjust DB_CONNECTION_LIMIT and DB_POOL_TIMEOUT in `.env`. Optional connection overrides must match DATABASE_URL so runtime and migration commands target the same database.

Teachers and College Admins can click **Manage course** to edit the course title, description and status, add, edit or delete modules and lessons, change their order, and manage co-instructors. Deletion is a soft delete (`a_in = 0`). Lessons in a deleted module are hidden and can no longer be completed. These operations use `server/src/controllers/course.controller.js` and `server/src/models/course.model.js`, preserve audit metadata, and enforce instructor scope and college isolation.

- Super Admin creates a college with its first admin and suspends/reactivates colleges.
- College Admin creates teachers and students and manages every course in the college.
- Teacher creates a course, adds text, video and PDF lessons, and publishes, unpublishes or archives it.
- Student opens any published course of their college (there is no enrollment step), reads text, watches videos, reads PDFs, and records completion.

## Lessons, uploads and progress

Tables: `sql/13_courses.sql`, `sql/15_lessons.sql`, `sql/16_files.sql`. New tables use lowercase APCMMS names, so pgAdmin queries need no quotes.

- **Courses**:
  - `Course.status` is `DRAFT`, `PUBLISHED` or `ARCHIVED`; it replaces the old `published` flag, and existing published courses were migrated.
  - Students only see published courses. Archived courses and their files are hidden from students but kept.
- **Instructors** (`crse_instrctr_rel_t`):
  - Every course has an `OWNER`; existing courses were backfilled from `teacherId`. Teachers can edit only courses where they are owner or co-instructor.
  - The owner or a College Admin can add active teachers of the same college as co-instructors (`POST/DELETE /api/courses/:id/instructors`). The owner cannot be removed.
- **Lessons**:
  - `lesson_type` is `TEXT`, `VIDEO` or `DOCUMENT` (PDF), with `file_id`, `duration_sec`, `allow_download_in`, `published_in` and `prerequisite_lesson_id`.
  - Hidden lessons (`published_in = 0`) are not shown to students. A lesson's prerequisite must be completed before students can open its file, save progress or complete it.
  - Prerequisites must be in the same course and cannot form a loop.
- **Uploads**:
  - `POST /api/files?purpose=VIDEO|DOCUMENT` takes the multipart field `file`, and requires `courses` update permission.
  - The type is decided from the file's first bytes: MP4/WebM for video, PDF for documents. The file name and browser MIME type are not trusted.
  - Size limits: `UPLOAD_MAX_VIDEO_MB` (default 500) and `UPLOAD_MAX_DOCUMENT_MB` (default 50).
  - Files are stored as `server/uploads/colleges/<collegeId>/<yyyy>/<mm>/<fileId>.<ext>` with a SHA-256 checksum, and recorded in `file_upld_dtl_t`.
  - Storage paths are never sent to the browser.
- **Viewing files**:
  - Files are served from `GET /api/files/:id/content` with HTTP Range support, so videos can seek.
  - `<video>` and `<iframe>` cannot send the access-token header, so this read-only route accepts the HttpOnly, SameSite=Lax session cookie.
  - Students need the course to be published in their own college and the prerequisite done; there is no enrollment step. Teachers need to have uploaded the file or instruct the course. College Admins can open any file in their college. Any other request gets 404.
  - `?download=1` downloads the file and is allowed only when the lesson permits it.
- **Progress**:
  - The video player resumes at the saved position. Every 15 seconds and on pause it saves the position and real watch time (`POST /api/lessons/:id/progress`); seeking does not count as watch time. A finished video completes the lesson.
  - The `Enrollment` row only stores a student's progress in a course. It is created automatically the first time the student saves video progress or completes a lesson; students never enrol manually (`sql/17_enrollments_and_progress.sql`).
  - `Enrollment.progress_pct` is completed published lessons divided by published lessons. It is recalculated when a student completes a lesson and when lessons are added, hidden, shown or deleted. `completed_at` is set at 100%.
- Lesson files are not deleted from disk when a lesson is deleted (soft delete). Move `UPLOAD_DIR` to shared storage, or switch to S3, before running more than one server.

## Courses page, syllabus and shared courses

Tables: `sql/13_courses.sql`, `sql/15_lessons.sql`, `sql/16_files.sql`.

- **Courses page:**
  - It lists one card per course (code, level, units, lessons). Clicking a card opens its syllabus at `/courses?course=<id>`, with **All courses** to go back.
  - Units start collapsed. Clicking a lesson opens it as a reading page with **Back to syllabus**, previous/next lesson, **Mark complete** for students, and **View original PDF** / **Download chapter PDF** when the lesson has a PDF.
- **Syllabus details** on `Course`:
  - Code (unique per college, upper-cased), level (`level_cd`), duration (`duration_hrs_ct`), objectives and outcomes (one per line), and `syllabus_file_id` (the original notes PDF, stored with other uploads).
  - Units (`CourseModule`) have a description.
- **Generated syllabus PDF:** `GET /api/courses/:id/syllabus/pdf` (PDFKit) produces the course details, objectives, every unit with its lessons, outcomes and page numbers. Visibility follows the course list.
- **Formatted lessons:**
  - `Lesson.content_fmt_cd` is `TEXT` (shown as written) or `MARKDOWN` (headings, lists, code, tables, images). Images are uploads with `purpose_cd = IMAGE` and `lesson_id` set, and are readable wherever the lesson is.
  - Course lists omit Markdown chapter text; `GET /api/lessons/:id/content` returns one lesson's content under the same visibility rules (hidden lessons only for editors; students need the prerequisite).
  - The client renders it with react-markdown, which does not render raw HTML.
- **Shared courses** (`Course.shared_in`):
  - A College Admin or Super Admin can tick **Shared with all colleges**.
  - Once published, the course appears read-only to students and teachers of every college, labelled "Shared · from <college>". Its files and images open for them, and download rules still apply.
  - Only the owning college edits it. Each student's progress is stored under their own college.
- **Teachers** see every published course of their college and every shared course, read-only, and edit only the courses they own or co-instruct. Every course in the list carries `canEdit`.

### Create course from a PDF (in the app)

College Admins, Teachers and Super Admins (in the chosen college) see **Create course → From a PDF**. They enter a course name, an optional code, level and description, and choose a PDF.

- **Endpoint:** `POST /api/courses/from-pdf` (multipart: `file`, `title`, `code`, `level`, `description`; needs `courses` create permission). The PDF is stored and linked as the course's notes PDF. The response comes once the course is built, which can take a minute or two for large PDFs.
- **Conversion** (`scripts/pdf-course.py`, run with `python -I`, 5-minute limit, at most 2 at a time):
  - **Chapters** come from the PDF bookmarks if it has them (top level = units, next level = lessons); otherwise each of the largest repeated headings starts a lesson.
  - **Inside a lesson:** smaller headings become `##`/`###`/`####`, monospace text becomes code blocks (indentation kept), bullet and numbered lines become lists, detected tables become tables, and images become figures.
  - **Repeated page headers and footers** are removed.
- **Result:**
  - The course is created as a **Draft** owned by the uploader.
  - Each lesson gets its formatted text (`MARKDOWN`), its figures and its own chapter PDF.
  - If anything fails, the half-built course is removed. The action is recorded in the audit log as `create_from_pdf`.
- **Requirements:** Python 3 with PyMuPDF on the server (`pip install pymupdf`; set `PYTHON_PATH` if `python` is not on the PATH). Without it, the endpoint answers 503 and explains why.
- **Limits:** scanned PDFs (images of text) cannot be converted. PDFs with unusual layouts may need headings or tables tidied in **Manage course** afterwards. Editing an imported lesson loads its full text first.

### Assessments

The **Assessments** menu (`/assessments`) covers quizzes, assignments and exams.

- **Question bank:** single choice, multiple choice (all-or-nothing), true/false, numeric (with ± tolerance) and short answer. Short answers are auto-marked against a list of accepted answers; with an empty list, the teacher grades them. Each question has marks, optional negative marks, difficulty, topic, an optional course and an explanation. Once students have answered a question, it is frozen.
- **Who edits:** College Admins see everything in their college. Teachers see what they created plus items linked to courses they teach.
- **Assessment settings:** time limit, pass mark, attempts allowed (the best or the latest attempt counts), shuffled questions and options, and when results are shown: right after submitting, after the window closes, or when the teacher publishes them.
- **Windows:** say when, and for whom (all students or one cohort), the assessment is open, with optional extra minutes.
- **Status:** Draft → Published (needs questions and a window) → Closed, which can be reopened. Questions, deletion and windows that have attempts are locked.
- **Attempts:**
  - The server fixes the end time when the attempt starts: start + time limit + extra minutes, but never after the window closes.
  - Answers autosave. Reloading resumes the attempt. Answer keys are never sent during an attempt.
  - When time runs out, the browser submits. A sweep in `nodeapp.js` also auto-submits abandoned attempts every minute.
  - Grading is automatic. The score never goes below 0.
- **Results and grading:** a table of every attempt, then a per-question review where the teacher sets marks and feedback. The score and pass state are recalculated. With "when I publish them", a **Publish results** button releases them.
- **API:**
  - Editors (`assessments` update): `/api/assessments` (CRUD), `/api/assessments/questions` (CRUD), `PUT /api/assessments/:id/questions`, `/api/assessments/:id/windows`, `POST /api/assessments/:id/status`, `POST /api/assessments/:id/results`, `GET /api/assessments/:id/attempts`, `GET /api/attempts/:id/review`, `PUT /api/attempts/:id/answers/:questionId/grade`.
  - Students: `GET /api/assessments/mine`, `POST /api/assessments/:id/attempts`, `GET /api/attempts/:id`, `PUT /api/attempts/:id/answers/:questionId`, `POST /api/attempts/:id/submit`.

### Coding platform (Phase 4)

The **Coding Practice** menu (`/coding`) is a HackerRank-style platform. Students solve problems in the language of their choice. Teachers and admins also write problems, and coding questions can be used in Assessments.

- **Library:** 55 platform problems (`college_id` null), Easy → Hard: basics, conditions, loops, strings, arrays, matrices, searching, stacks, backtracking and dynamic programming. Each has sample and hidden stdin/stdout test cases.
  - Source: `server/prisma/data/coding/build-problems.py`. Expected outputs are generated by running each problem's reference solution. Rebuild with `python -I prisma/data/coding/build-problems.py`, then load with `npm run coding:import` (also part of `npm run db:setup`; it upserts by slug). Library problems are published as **Practice and assessments**.
- **Editor:** Monaco (the VS Code editor), bundled locally and loaded only on coding screens. It has syntax highlighting for every judge language. A draft is kept per problem and per language, and the last language used is remembered.
- **Practice screens:**
  - The problem list has filters, solved/attempted state, each problem's success rate in the college, and **Random unsolved**.
  - The solving screen shows the statement and samples on the left and the editor on the right.
  - **Run Code** uses the samples or custom input, and is not counted. **Submit Code** runs all cases and gives a score.
  - Results show "Test case 0, 1, …" tabs. Hidden cases show only the verdict and time.
- **Judge queue** (`src/services/judge.service.js`):
  - Every run and submission is a row in `cdng_sbmsn_dtl_t`, moving from `QUEUED` to `RUNNING` to `DONE` (or `INTERNAL_ERROR`).
  - Workers claim jobs with `FOR UPDATE SKIP LOCKED`, so several processes can share the queue.
  - Colleges take turns (least recently served first), with at most `JUDGE_COLLEGE_SLOTS` running per college, so one college's exam cannot starve another.
  - Internal errors are retried up to 3 times and never counted against the student. Jobs left by a crashed worker are re-queued after 5 minutes.
  - Each result stores the verdict, per-case results, score, runtime and the **limits applied**.
  - The API answers `202` with the queued submission. Clients long-poll `GET …/submissions/:id?wait=1`, which waits up to 15 s, so a lab sharing one IP address does not hit the rate limit.
  - The worker runs inside the API process by default. For more capacity, set `JUDGE_WORKER=off` on the API and run `npm run judge -w server` (`judge-worker.js`) on one or more machines.
- **Problem authoring:** teachers manage the problems they wrote; College Admins manage every problem of the college. The **Manage problems** tab covers:
  - statement (Markdown), input/output format and constraints;
  - time and memory limits, and the allowed languages (none ticked = all);
  - output comparison: trimmed, exact, tokens, case-insensitive, numbers within epsilon, or lines in any order;
  - scoring: weighted, groups (all or nothing per group), or all or nothing;
  - where the problem appears: practice only, practice and assessments, or assessments only;
  - test cases (sample/hidden, weight, group, explanation for samples, bulk add from `1.in`/`1.out` files) and a reference solution in Monaco.
- **Publishing rules:**
  - **Validate & publish** runs the reference solution against every case within the limits, and refuses to publish (listing the failing cases) if any case fails.
  - Changing test cases, limits, comparison, scoring, languages or the reference solution sends the problem back to draft.
  - Validation rejects duplicate cases and empty expected outputs, and needs at least one sample.
- **Visibility:**
  - "Assessments only" problems never appear in practice.
  - While an assessment window is open, the problems in that assessment are hidden from the college's practice list. They come back when it closes.
- **Coding questions in Assessments:**
  - In the question bank, choose type **Coding** and a published problem that is allowed in assessments.
  - In the exam, students see the statement and samples beside the editor and can Run and Submit up to 20 times per question.
  - Marks = question points × the best judged submission's score / max score.
  - A submission still being judged when the attempt ends leaves the attempt "grading pending". The judge fills in the marks when it finishes, unless a teacher has already marked the question by hand.
  - Teachers see the submitted code in the review.
- **API:**
  - Practice: `GET /api/coding/problems`, `GET /api/coding/problems/:id` (samples only), `POST /api/coding/problems/:id/run` and `/submit` (`202`), `GET /api/coding/submissions[?problemId=&all=1]`, `GET /api/coding/submissions/:id[?wait=1]`.
  - Authoring (`coding` update): `/api/coding/manage` (CRUD), `PUT /api/coding/manage/:id/test-cases`, `POST /api/coding/manage/:id/publish` and `/unpublish`, `GET /api/coding/queue`.
  - Exams: `POST /api/attempts/:id/questions/:questionId/run` and `/code`, `GET /api/attempts/:id/code/:submissionId[?wait=1]`.
  - Run, submit and publish are limited to 30 per minute per user.
- **Runner** (`CODE_RUNNER`, see `.env.example`):
  - `local`, the development default, runs the program on this server in a temporary folder with a wall-clock limit per test (Java ×2, Go ×1.5) and a 2 MB output cap. It is **not a sandbox**: the program has the server's operating-system permissions. Use it only for development or a trusted lab machine.
  - `judge0`, recommended for production, sends programs to a [Judge0](https://github.com/judge0/judge0) server (`JUDGE0_URL`, `JUDGE0_KEY`). Judge0 isolates programs and enforces CPU and memory limits, and offers every listed language.
  - `off`, the production default, keeps problems readable but disables Run and Submit.
  - The language picker lists Python 3, Java, C, C++, JavaScript, C#, Go, Kotlin, Ruby and PHP, restricted to the problem's allowed languages. In local mode a language can be used only when its toolchain is installed: Python (`PYTHON_PATH`), Java (`JAVA_HOME` or `javac`/`java` on PATH), C (`gcc`), C++ (`g++`), JavaScript (Node.js), Go, Ruby and PHP. Others show "(not installed)". C# and Kotlin run only through Judge0. Restart the server after installing a toolchain.
- **Verdicts:** Accepted, Wrong answer, Compilation error, Runtime error and Time limit exceeded. The overall verdict is the first failing case.

### Importing a course from a PDF (Python PY101)

The data lives in `server/prisma/data/courses/`: `python-basics-to-oop.json` (syllabus, units, lessons, page ranges) and `python-basics-to-oop/` (converted chapters: `chapter-N.md`, figure PNGs, `manifest.json`).

```powershell
cd E:\LMS\server
# 1. Create the course (units, lessons, syllabus details) and link the notes PDF; chapter PDFs are cut from the page ranges.
node scripts/import-course.mjs --file prisma/data/courses/python-basics-to-oop.json --college <college code> --owner <teacher or admin email> --notes "<path to notes.pdf>" --publish
# 2. Load the formatted chapter text and figures into the lessons.
node scripts/import-chapter-content.mjs --file prisma/data/courses/python-basics-to-oop.json --college <college code> --content prisma/data/courses/python-basics-to-oop
# Optional: attach chapter PDFs to a course imported without --notes.
node scripts/attach-chapters.mjs --file prisma/data/courses/python-basics-to-oop.json --college <college code> --notes "<path to notes.pdf>"
```

To convert another PDF with the same layout, run `python -I scripts/pdf-to-markdown.py <notes.pdf> <course.json> <output folder>` (needs PyMuPDF). It reads fonts and positions: blue 13pt headings, Consolas code boxes, "Output:" blocks, bullet lists, white-header tables and captioned figures. A PDF with a different layout needs its rules adjusted.

## Academic structure and audit log

Tables: `sql/07_academic_years.sql` â€¦ `sql/12_cohorts.sql`, `sql/18_audit_log.sql`. Tables use lowercase APCMMS names and audit columns.

- **Academics** page (`academics` permission; Super Admin works in the college chosen in "Working in"):
  - **Academic years** (`acdmc_yr_lst_t`): name, start and end date. Only one is current per college.
  - **Departments** (`dept_lst_t`): code (upper-cased, unique per college), name, head of department (an active teacher).
  - **Programmes** (`prgm_lst_t`): department, code, name, duration in years (1–10).
  - **Batches** (`btch_lst_t`): programme, academic year, name, optional section.
  - **Cohorts** (`chrt_lst_t`, members in `chrt_mbr_rel_t`): named groups of students, optionally tied to a batch. They will be used for assessment windows. Archived cohorts cannot change. "Add all students of the batch" adds every student whose profile has that batch.
  - API: `GET/POST /api/academics/:resource` and `PATCH/DELETE /api/academics/:resource/:id`, where `:resource` is `academic-years`, `departments`, `programs`, `batches` or `cohorts`. Cohort members use `GET/POST /api/academics/cohorts/:id/members` and `DELETE …/members/:userId`.
  - References must point to active rows of the same college. Removing is a soft delete and is refused (409) while something still depends on the item, for example a department with programmes or a batch with students.
  - Cohorts do not limit which courses students see: every student sees all published courses of their college.
- **Profiles** (People → **Profile**, `PUT /api/users/:id/profile`, `people` update permission):
  - Students: roll number (unique per college), batch, admission year, date of birth, gender, guardian phone (`stdnt_prfl_dtl_t`).
  - Teachers: employee code (unique per college), department, designation, qualification (`tchr_prfl_dtl_t`).
  - Teachers see only students' roll number and batch, not personal details.
- **Audit log** (`adt_log_dtl_t`, page **Audit log**, `GET /api/audit-logs`):
  - Records writes to colleges, people, profiles, role permissions, courses, modules, lessons, instructors, uploads, academics and password resets.
  - Each entry holds the actor, the `actingAsSuperAdmin` flag, college, action, entity, before/after values, IP, browser and request ID.
  - Passwords, tokens, hashes and storage paths are removed before saving. Learner activity (progress, completions) is not audited.
  - College Admins see their own college. Super Admins see every college, or only the one chosen in "Working in".
  - Filters: what changed, date range. 50 entries per page, newest first.
- Responsive dashboards, role-specific navigation, persisted database data, input validation, hashed passwords, and login rate limiting.
- JWTs paired with PostgreSQL-backed sessions: 15-minute access tokens, 30-minute rolling idle timeout, and an eight-hour absolute session limit.
- Queries constrain records to the authenticated college. On `alpha.localhost` / `beta.localhost`, tokens must match that hostname. Plain localhost supports college-code login for development.

## Validation

All eight application tables use APCMMS-style audit columns: `crte_usr_id` (creator), `updte_usr_id` (updater), `i_ts` (insert time), `u_ts` (update time), `a_in` (1 active / 0 inactive), and `d_ts` (deactivation time). Prisma maps these to camelCase properties. PostgreSQL triggers keep creation metadata unchanged, update `u_ts` on SQL updates, set `d_ts` on deactivation, and clear it on reactivation. The API supplies the authenticated actor on writes and excludes inactive records. College suspension remains the separate `active` setting. Session logout still deletes its session record for revocation. Legacy/seed creator IDs stay null when the original actor is unknown; timestamps that already existed are retained. Tables: `sql/00_types_and_functions.sql`.

```powershell
npm run build
npm test
```

Tests require the migrated, seeded database. They create two temporary colleges, test the learning workflow, duplicate submissions, role restrictions, cross-college IDs and hostnames, and suspension. Temporary test records are removed.

## Authentication and security

Users also store `role_id` (1 Super Admin, 2 College Admin, 3 Teacher, 4 Student). A composite foreign key and database trigger keep numeric IDs consistent with the role code used by existing API permissions. View these with `SELECT id, name, email, role_id, role FROM public."User";`.

The `public.role_t` table contains the four role definitions (IDs 1-4): Super Admin, College Admin, Teacher, Student. It includes APCMMS-style audit columns. Each `User.role` references its `role_code` through a foreign key, while the existing enum and API role values remain compatible. Inactive roles cannot sign in or continue a session. Public registration remains restricted to Student and Teacher. Inspect roles in pgAdmin with `SELECT * FROM public.role_t ORDER BY role_id;`.

The implementation references APCMMS's database session store, `x-access-token` request/response header, cookie/JWT matching, credentialed requests, and server-side logout. Its MySQL store is adapted to this project's PostgreSQL database. APCMMS files and credentials were not copied or changed.

1. `POST /api/auth/login` validates credentials, regenerates the session ID, saves a session in PostgreSQL, and returns an access token and CSRF token.
2. The browser receives an HttpOnly, SameSite=Lax session cookie. Access tokens and CSRF tokens stay in memory, rather than browser storage.
3. Protected requests send the cookie plus `x-access-token`. The server verifies the JWT signature, algorithm, issuer, audience, subject, expiry, user, and matching session ID/token, then applies role and college checks. Bearer headers are also accepted, but still require the matching cookie.
4. Mutating requests also require `x-csrf-token`. Allowed origins are checked against CLIENT_ORIGINS. Authentication responses are not cached.
5. `GET /api/auth/session` restores the current credentials after a reload. `POST /api/auth/refresh` renews a token only with a live session and its CSRF token. The client serializes refresh requests and retries once after a 401. Renewal never extends the absolute session deadline.
6. `POST /api/auth/logout` destroys the database session and clears its cookie. Old tokens cannot recreate it. A new login regenerates the session ID to prevent session fixation.

Expired sessions are rejected immediately and removed when accessed. Add a scheduled deletion of expired Session rows for long-running deployments. Sessions persist across API restarts as long as the database and signing secrets remain unchanged. Clearing either signing secret invalidates existing authentication.

In production, set NODE_ENV=production, use HTTPS, and set distinct JWT_SECRET and SESSION_SECRET values. The cookie becomes Secure and uses the `__Host-campus.sid` name. If HTTPS terminates at a reverse proxy, configure TRUST_PROXY to that proxy's actual addresses. Do not trust arbitrary forwarded headers. Keep CLIENT_ORIGINS limited to the college frontends you serve.

Authentication tests cover missing/mismatched cookies, tampered and expired JWTs, CSRF failures, disallowed origins, session restoration, renewal, old-token replay, logout revocation, idle expiry, and the absolute deadline, alongside the learning workflow and college isolation tests.

## Remaining document phases

This is not the complete requirements document. Next: assessments (question bank, quizzes, timed assignments, exams, attempts with server timers, cohort assessment windows), server timers, sandboxed coding evaluation, certificates, reports, notifications, branding, and an audited Super Admin college switcher.

Before production, add PostgreSQL Row-Level Security with a restricted application database role, configured college domains, password recovery, audit logs, deployment secrets, backups, and load testing. Current tenant isolation is enforced by API query scoping; database RLS is not yet enabled. The frontend uses standard CSS, rather than Tailwind, for this initial interface.
