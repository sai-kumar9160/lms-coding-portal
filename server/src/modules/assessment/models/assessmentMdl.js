import { db, params } from '../../../../config/db.config.js';
import { fail, notFound } from '../../../utils/http-error.js';
import { totalAttempt } from '../../../services/grading.service.js';
import { instructsSql } from '../../course/models/courseMdl.js';

// Columns returned by INSERT / UPDATE ... RETURNING (no table alias needed).
const ASSESSMENT_RETURNING = `asmt_id AS "id", college_id AS "collegeId", course_id AS "courseId", asmt_type_cd AS "assessmentType", asmt_ttl AS "title",
    instructions_tx AS "instructions", duration_min_ct AS "durationMin", pass_pct AS "passPct", max_attempts_ct AS "maxAttempts", attempt_strategy_cd AS "attemptStrategy",
    shuffle_qstn_in AS "shuffleQuestions", shuffle_optn_in AS "shuffleOptions", result_visibility_cd AS "resultVisibility", results_published_in AS "resultsPublished",
    status_cd AS "status", i_ts AS "createdAt", u_ts AS "updatedAt", crte_usr_id AS "createdBy", updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`;
const WINDOW_RETURNING = `asmt_wndw_id AS "id", asmt_id AS "assessmentId", chrt_id AS "cohortId", opens_ts AS "opensAt", closes_ts AS "closesAt",
    extra_time_min_ct AS "extraTimeMin", i_ts AS "createdAt", u_ts AS "updatedAt", crte_usr_id AS "createdBy", updte_usr_id AS "updatedBy", a_in AS "activeIndicator", d_ts AS "deletedAt"`;

// Every column of a coding problem (attempts need the whole problem to show it to the student).
const CODING_PROBLEM_COLUMNS = `p.cdng_prblm_id AS "id", p.college_id AS "collegeId", p.prblm_slug_tx AS "slug", p.prblm_ttl AS "title", p.difficulty_cd AS "difficulty", p.topic_tx AS "topic", p.track_tx AS "track", p.starters_json AS "starters",
    p.statement_tx AS "statement", p.input_format_tx AS "inputFormat", p.output_format_tx AS "outputFormat", p.constraints_tx AS "constraints",
    p.time_limit_ms_ct AS "timeLimitMs", p.memory_limit_mb_ct AS "memoryLimitMb", p.sqnce_id AS "sequence", p.status_cd AS "status", p.visibility_cd AS "visibility",
    p.languages_json AS "languages", p.checker_cd AS "checker", p.epsilon_ct AS "epsilon", p.scoring_cd AS "scoring", p.max_score_ct AS "maxScore",
    p.reference_lang_cd AS "referenceLanguage", p.reference_solution_tx AS "referenceSolution", p.validated_ts AS "validatedAt",
    p.i_ts AS "createdAt", p.u_ts AS "updatedAt", p.crte_usr_id AS "createdBy", p.updte_usr_id AS "updatedBy", p.a_in AS "activeIndicator", p.d_ts AS "deletedAt"`;

const isAdmin = (identity) => identity.role === 'COLLEGE_ADMIN' || identity.role === 'SUPER_ADMIN';

// Teachers work with what they created plus items linked to courses they instruct; admins with the whole college.
// `a` is the alias of an assessment or question row (both have college_id, a_in, crte_usr_id and course_id).
function editorScope(q, identity, collegeId, a = 'x') {
    const base = `${a}.college_id = ${q.add(collegeId)} AND ${a}.a_in = 1`;
    if (isAdmin(identity))
        return base;
    return `${base} AND (${a}.crte_usr_id = ${q.add(identity.id)} OR ${a}.course_id IN (SELECT c.id FROM "Course" c WHERE c."collegeId" = ${q.add(collegeId)} AND c.a_in = 1 AND ${instructsSql(q, identity)}))`;
}
async function checkCourse(identity, collegeId, courseId) {
    if (!courseId) return;
    const q = params();
    const own = isAdmin(identity) ? '' : ` AND ${instructsSql(q, identity)}`;
    if (!await db.one(`SELECT 1 FROM "Course" c WHERE c.id = ${q.add(courseId)} AND c."collegeId" = ${q.add(collegeId)} AND c.a_in = 1${own}`, q.values))
        fail(400, 'Choose one of your courses in this college');
}

// A coding question must use a published problem this college can see that is allowed in assessments.
async function checkCodingProblem(collegeId, data) {
    if (data.questionType !== 'CODING') return;
    const problem = await db.one(
        `SELECT 1 FROM cdng_prblm_lst_t WHERE cdng_prblm_id = $1 AND a_in = 1 AND status_cd = 'PUBLISHED' AND visibility_cd IN ('SHARED', 'ASSESSMENT')
         AND (college_id IS NULL OR college_id = $2)`, [data.codingProblemId, collegeId]);
    if (!problem) fail(400, 'Choose a published coding problem that may be used in assessments');
}

// Points a question is worth inside an assessment.
export const pointsOf = (link) => link.marksOverride ?? link.question.marks;

async function findAssessment(identity, collegeId, id) {
    const q = params();
    const assessment = await db.one(`SELECT x.asmt_id AS "id", x.college_id AS "collegeId", x.course_id AS "courseId", x.asmt_type_cd AS "assessmentType",
            x.asmt_ttl AS "title", x.instructions_tx AS "instructions", x.duration_min_ct AS "durationMin",
            x.pass_pct AS "passPct", x.max_attempts_ct AS "maxAttempts", x.attempt_strategy_cd AS
            "attemptStrategy", x.shuffle_qstn_in AS "shuffleQuestions", x.shuffle_optn_in AS "shuffleOptions",
            x.result_visibility_cd AS "resultVisibility", x.results_published_in AS "resultsPublished",
            x.status_cd AS "status", x.i_ts AS "createdAt", x.u_ts AS "updatedAt", x.crte_usr_id AS
            "createdBy", x.updte_usr_id AS "updatedBy", x.a_in AS "activeIndicator", x.d_ts AS "deletedAt" FROM asmt_lst_t x WHERE x.asmt_id = ${q.add(id)} AND ${editorScope(q, identity, collegeId)}`, q.values);
    if (!assessment) notFound('Assessment');
    return assessment;
}
async function findQuestion(identity, collegeId, id) {
    const q = params();
    const question = await db.one(`SELECT x.qstn_id AS "id", x.college_id AS "collegeId", x.course_id AS "courseId", x.qstn_type_cd AS "questionType",
            x.stem_tx AS "stem", x.explanation_tx AS "explanation", x.difficulty_cd AS "difficulty",
            x.marks_ct AS "marks", x.negative_marks_ct AS "negativeMarks", x.answer_key_json AS "answerKey",
            x.topic_tx AS "topic", x.cdng_prblm_id AS "codingProblemId", x.i_ts AS "createdAt", x.u_ts AS
            "updatedAt", x.crte_usr_id AS "createdBy", x.updte_usr_id AS "updatedBy", x.a_in AS
            "activeIndicator", x.d_ts AS "deletedAt" FROM qstn_lst_t x WHERE x.qstn_id = ${q.add(id)} AND ${editorScope(q, identity, collegeId)}`, q.values);
    if (!question) notFound('Question');
    return question;
}

async function hasAttempts(assessmentId) {
    return !!await db.one('SELECT 1 FROM atmpt_dtl_t WHERE asmt_id = $1 LIMIT 1', [assessmentId]);
}

// Adds each question's options (in order) and its coding problem. With fullProblem the problem carries all its
// columns and test cases (attempts need them); otherwise only { id, title, difficulty } (editor screens).
export async function withQuestionParts(client, questions, { fullProblem = false } = {}) {
    const ids = questions.map(question => question.id);
    const problemIds = [...new Set(questions.map(question => question.codingProblemId).filter(Boolean))];
    const [options, problems, cases] = await Promise.all([
        client.many(`SELECT o.qstn_optn_id AS "id", o.qstn_id AS "questionId", o.optn_tx AS "text", o.is_correct_in AS "isCorrect",
            o.sqnce_id AS "sequence", o.i_ts AS "createdAt" FROM qstn_optn_lst_t o WHERE o.qstn_id = ANY($1::int[]) ORDER BY o.sqnce_id ASC`, [ids]),
        client.many(`SELECT ${fullProblem ? CODING_PROBLEM_COLUMNS : 'p.cdng_prblm_id AS "id", p.prblm_ttl AS "title", p.difficulty_cd AS "difficulty"'} FROM cdng_prblm_lst_t p WHERE p.cdng_prblm_id = ANY($1::int[])`, [problemIds]),
        fullProblem ? client.many(`SELECT t.cdng_tst_cs_id AS "id", t.cdng_prblm_id AS "problemId", t.input_tx AS "input", t.expected_output_tx AS
            "expectedOutput", t.is_sample_in AS "isSample", t.weight_ct AS "weight", t.group_tx AS "group",
            t.explanation_tx AS "explanation", t.sqnce_id AS "sequence", t.i_ts AS "createdAt" FROM cdng_tst_cs_lst_t t WHERE t.cdng_prblm_id = ANY($1::int[]) ORDER BY t.sqnce_id ASC`, [problemIds]) : [],
    ]);
    return questions.map(question => {
        const problem = problems.find(p => p.id === question.codingProblemId);
        return {
            ...question,
            options: options.filter(o => o.questionId === question.id),
            codingProblem: problem ? (fullProblem ? { ...problem, testCases: cases.filter(c => c.problemId === problem.id) } : problem) : null,
        };
    });
}
async function loadQuestion(client, id) {
    const question = await client.one(`SELECT x.qstn_id AS "id", x.college_id AS "collegeId", x.course_id AS "courseId", x.qstn_type_cd AS "questionType",
            x.stem_tx AS "stem", x.explanation_tx AS "explanation", x.difficulty_cd AS "difficulty",
            x.marks_ct AS "marks", x.negative_marks_ct AS "negativeMarks", x.answer_key_json AS "answerKey",
            x.topic_tx AS "topic", x.cdng_prblm_id AS "codingProblemId", x.i_ts AS "createdAt", x.u_ts AS
            "updatedAt", x.crte_usr_id AS "createdBy", x.updte_usr_id AS "updatedBy", x.a_in AS
            "activeIndicator", x.d_ts AS "deletedAt" FROM qstn_lst_t x WHERE x.qstn_id = $1`, [id]);
    return (await withQuestionParts(client, [question]))[0];
}

// The ordered question links of assessments, each with its question: { ...link, question: {..., options, codingProblem} }.
export async function assessmentLinks(client, assessmentIds, options = {}) {
    const links = await client.many(`SELECT l.asmt_qstn_id AS "id", l.asmt_id AS "assessmentId", l.qstn_id AS "questionId", l.sqnce_id AS "sequence",
            l.marks_override_ct AS "marksOverride" FROM asmt_qstn_rel_t l WHERE l.asmt_id = ANY($1::int[]) ORDER BY l.sqnce_id ASC`, [assessmentIds]);
    const questions = await client.many(`SELECT x.qstn_id AS "id", x.college_id AS "collegeId", x.course_id AS "courseId", x.qstn_type_cd AS "questionType",
            x.stem_tx AS "stem", x.explanation_tx AS "explanation", x.difficulty_cd AS "difficulty",
            x.marks_ct AS "marks", x.negative_marks_ct AS "negativeMarks", x.answer_key_json AS "answerKey",
            x.topic_tx AS "topic", x.cdng_prblm_id AS "codingProblemId", x.i_ts AS "createdAt", x.u_ts AS
            "updatedAt", x.crte_usr_id AS "createdBy", x.updte_usr_id AS "updatedBy", x.a_in AS
            "activeIndicator", x.d_ts AS "deletedAt" FROM qstn_lst_t x WHERE x.qstn_id = ANY($1::int[])`, [[...new Set(links.map(link => link.questionId))]]);
    const loaded = await withQuestionParts(client, questions, options);
    return links.map(link => ({ ...link, question: loaded.find(question => question.id === link.questionId) }));
}
const windowsOf = (client, assessmentIds) =>
    client.many(`SELECT w.asmt_wndw_id AS "id", w.asmt_id AS "assessmentId", w.chrt_id AS "cohortId", w.opens_ts AS "opensAt",
            w.closes_ts AS "closesAt", w.extra_time_min_ct AS "extraTimeMin", w.i_ts AS "createdAt", w.u_ts AS
            "updatedAt", w.crte_usr_id AS "createdBy", w.updte_usr_id AS "updatedBy", w.a_in AS
            "activeIndicator", w.d_ts AS "deletedAt" FROM asmt_wndw_lst_t w WHERE w.asmt_id = ANY($1::int[]) AND w.a_in = 1 ORDER BY w.opens_ts ASC`, [assessmentIds]);
const totalMarks = links => links.reduce((n, link) => n + pointsOf(link), 0);

export const assessmentMdl = {
    // Choices for the editor forms: courses the user may link, and the college's cohorts for windows.
    async options(identity, collegeId) {
        const q = params();
        const own = isAdmin(identity) ? '' : ` AND ${instructsSql(q, identity)}`;
        const [courses, cohorts, codingProblems] = await Promise.all([
            db.many(`SELECT c.id, c.title, c.course_cd AS code FROM "Course" c WHERE c."collegeId" = ${q.add(collegeId)} AND c.a_in = 1${own} ORDER BY c.title ASC`, q.values),
            db.many(
                `SELECT c.chrt_id AS id, c.chrt_nm AS name, (SELECT COUNT(*) FROM chrt_mbr_rel_t m WHERE m.chrt_id = c.chrt_id AND m.a_in = 1) AS members
                 FROM chrt_lst_t c WHERE c.college_id = $1 AND c.a_in = 1 AND c.archived_in = 0 ORDER BY c.chrt_nm ASC`, [collegeId]),
            // Coding problems usable in assessments: published, shared or assessment-only, platform or this college.
            db.many(
                `SELECT p.cdng_prblm_id AS "id", p.prblm_ttl AS "title", p.difficulty_cd AS "difficulty", p.topic_tx AS "topic",
            p.college_id AS "collegeId" FROM cdng_prblm_lst_t p
                 WHERE p.a_in = 1 AND p.status_cd = 'PUBLISHED' AND p.visibility_cd IN ('SHARED', 'ASSESSMENT') AND (p.college_id IS NULL OR p.college_id = $1)
                 ORDER BY p.college_id ASC, p.sqnce_id ASC, p.prblm_ttl ASC`, [collegeId]),
        ]);
        return { courses, codingProblems, cohorts };
    },
    // ---- Question bank ----
    async listQuestions(identity, collegeId, { courseId, type, search }) {
        const q = params();
        const where = [editorScope(q, identity, collegeId)];
        if (courseId) where.push(`x.course_id = ${q.add(courseId)}`);
        if (type) where.push(`x.qstn_type_cd = ${q.add(type)}`);
        if (search) where.push(`position(lower(${q.add(search)}) in lower(x.stem_tx)) > 0`);
        const rows = await db.many(
            `SELECT x.qstn_id AS "id", x.college_id AS "collegeId", x.course_id AS "courseId", x.qstn_type_cd AS "questionType",
            x.stem_tx AS "stem", x.explanation_tx AS "explanation", x.difficulty_cd AS "difficulty",
            x.marks_ct AS "marks", x.negative_marks_ct AS "negativeMarks", x.answer_key_json AS "answerKey",
            x.topic_tx AS "topic", x.cdng_prblm_id AS "codingProblemId", x.i_ts AS "createdAt", x.u_ts AS
            "updatedAt", x.crte_usr_id AS "createdBy", x.updte_usr_id AS "updatedBy", x.a_in AS
            "activeIndicator", x.d_ts AS "deletedAt", (SELECT COUNT(*) FROM asmt_qstn_rel_t l WHERE l.qstn_id = x.qstn_id) AS "assessmentCount"
             FROM qstn_lst_t x WHERE ${where.join(' AND ')} ORDER BY x.i_ts DESC LIMIT 500`, q.values);
        const loaded = await withQuestionParts(db, rows);
        return loaded.map(({ assessmentCount, ...question }) => ({ ...question, _count: { assessments: assessmentCount } }));
    },
    async createQuestion(identity, collegeId, data) {
        await checkCourse(identity, collegeId, data.courseId);
        await checkCodingProblem(collegeId, data);
        const { options, ...fields } = data;
        return db.transaction(async tx => {
            const question = await tx.one(
                `INSERT INTO qstn_lst_t (qstn_id, college_id, course_id, qstn_type_cd, stem_tx, explanation_tx, difficulty_cd, marks_ct, negative_marks_ct, answer_key_json, topic_tx, cdng_prblm_id, crte_usr_id)
                 VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12) RETURNING qstn_id AS "id"`,
                [collegeId, fields.courseId, fields.questionType, fields.stem, fields.explanation, fields.difficulty, fields.marks, fields.negativeMarks,
                    fields.answerKey ? JSON.stringify(fields.answerKey) : null, fields.topic, fields.codingProblemId ?? null, identity.id]);
            for (const [i, o] of (options || []).entries())
                await tx.run('INSERT INTO qstn_optn_lst_t (qstn_optn_id, qstn_id, optn_tx, is_correct_in, sqnce_id) VALUES (DEFAULT, $1, $2, $3, $4)', [question.id, o.text, o.isCorrect ? 1 : 0, i]);
            return loadQuestion(tx, question.id);
        });
    },
    async updateQuestion(identity, collegeId, id, data) {
        await findQuestion(identity, collegeId, id);
        const before = await loadQuestion(db, id);
        // Saved answers point at option ids, so a question students have answered is frozen.
        if (await db.one('SELECT 1 FROM atmpt_ans_dtl_t WHERE qstn_id = $1 LIMIT 1', [id]))
            fail(409, 'Students have already answered this question. Create a new question instead of changing it.');
        await checkCourse(identity, collegeId, data.courseId);
        await checkCodingProblem(collegeId, data);
        const { options, ...fields } = data;
        const after = await db.transaction(async tx => {
            await tx.run('DELETE FROM qstn_optn_lst_t WHERE qstn_id = $1', [id]);
            await tx.run(
                `UPDATE qstn_lst_t SET course_id = $2, qstn_type_cd = $3, stem_tx = $4, explanation_tx = $5, difficulty_cd = $6, marks_ct = $7, negative_marks_ct = $8,
                        answer_key_json = $9::jsonb, topic_tx = $10, cdng_prblm_id = $11, updte_usr_id = $12 WHERE qstn_id = $1`,
                [id, fields.courseId, fields.questionType, fields.stem, fields.explanation, fields.difficulty, fields.marks, fields.negativeMarks,
                    fields.answerKey ? JSON.stringify(fields.answerKey) : null, fields.topic, fields.codingProblemId ?? null, identity.id]);
            for (const [i, o] of (options || []).entries())
                await tx.run('INSERT INTO qstn_optn_lst_t (qstn_optn_id, qstn_id, optn_tx, is_correct_in, sqnce_id) VALUES (DEFAULT, $1, $2, $3, $4)', [id, o.text, o.isCorrect ? 1 : 0, i]);
            return loadQuestion(tx, id);
        });
        return { before, after };
    },
    async deleteQuestion(identity, collegeId, id) {
        const question = await findQuestion(identity, collegeId, id);
        await db.run('UPDATE qstn_lst_t SET a_in = 0, updte_usr_id = $2 WHERE qstn_id = $1', [id, identity.id]);
        return question;
    },

    // ---- Assessments ----
    async list(identity, collegeId) {
        const q = params();
        const rows = await db.many(`SELECT x.asmt_id AS "id", x.college_id AS "collegeId", x.course_id AS "courseId", x.asmt_type_cd AS "assessmentType",
            x.asmt_ttl AS "title", x.instructions_tx AS "instructions", x.duration_min_ct AS "durationMin",
            x.pass_pct AS "passPct", x.max_attempts_ct AS "maxAttempts", x.attempt_strategy_cd AS
            "attemptStrategy", x.shuffle_qstn_in AS "shuffleQuestions", x.shuffle_optn_in AS "shuffleOptions",
            x.result_visibility_cd AS "resultVisibility", x.results_published_in AS "resultsPublished",
            x.status_cd AS "status", x.i_ts AS "createdAt", x.u_ts AS "updatedAt", x.crte_usr_id AS
            "createdBy", x.updte_usr_id AS "updatedBy", x.a_in AS "activeIndicator", x.d_ts AS "deletedAt" FROM asmt_lst_t x WHERE ${editorScope(q, identity, collegeId)} ORDER BY x.i_ts DESC`, q.values);
        const ids = rows.map(row => row.id);
        const [links, windows, attempts] = await Promise.all([
            db.many(
                `SELECT l.asmt_id AS "assessmentId", l.marks_override_ct AS "marksOverride", x.marks_ct AS marks
                 FROM asmt_qstn_rel_t l JOIN qstn_lst_t x ON x.qstn_id = l.qstn_id WHERE l.asmt_id = ANY($1::int[])`, [ids]),
            windowsOf(db, ids),
            db.many('SELECT asmt_id AS "assessmentId", COUNT(*) AS total FROM atmpt_dtl_t WHERE asmt_id = ANY($1::int[]) GROUP BY asmt_id', [ids]),
        ]);
        return rows.map(a => {
            const own = links.filter(link => link.assessmentId === a.id).map(link => ({ marksOverride: link.marksOverride, question: { marks: link.marks } }));
            return { ...a, windows: windows.filter(w => w.assessmentId === a.id), _count: { attempts: attempts.find(t => t.assessmentId === a.id)?.total ?? 0 }, questionCount: own.length, totalMarks: totalMarks(own) };
        });
    },
    async detail(identity, collegeId, id) {
        const assessment = await findAssessment(identity, collegeId, id);
        const [questions, windows, cohorts, attempts] = await Promise.all([
            assessmentLinks(db, [id]),
            windowsOf(db, [id]),
            db.many('SELECT chrt_id AS id, chrt_nm AS name FROM chrt_lst_t WHERE chrt_id IN (SELECT chrt_id FROM asmt_wndw_lst_t WHERE asmt_id = $1)', [id]),
            db.one('SELECT COUNT(*) AS total FROM atmpt_dtl_t WHERE asmt_id = $1', [id]),
        ]);
        return {
            ...assessment, questions, _count: { attempts: attempts.total },
            windows: windows.map(w => ({ ...w, cohort: cohorts.find(c => c.id === w.cohortId) ?? null })),
            totalMarks: totalMarks(questions),
        };
    },
    async create(identity, collegeId, data) {
        await checkCourse(identity, collegeId, data.courseId);
        return db.one(
            `INSERT INTO asmt_lst_t (asmt_id, college_id, course_id, asmt_type_cd, asmt_ttl, instructions_tx, duration_min_ct, pass_pct, max_attempts_ct, attempt_strategy_cd,
                                     shuffle_qstn_in, shuffle_optn_in, result_visibility_cd, crte_usr_id)
             VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING ${ASSESSMENT_RETURNING}`,
            [collegeId, data.courseId, data.assessmentType, data.title, data.instructions, data.durationMin, data.passPct, data.maxAttempts, data.attemptStrategy,
                data.shuffleQuestions, data.shuffleOptions, data.resultVisibility, identity.id]);
    },
    async update(identity, collegeId, id, data) {
        const before = await findAssessment(identity, collegeId, id);
        await checkCourse(identity, collegeId, data.courseId);
        const after = await db.one(
            `UPDATE asmt_lst_t SET course_id = $2, asmt_type_cd = $3, asmt_ttl = $4, instructions_tx = $5, duration_min_ct = $6, pass_pct = $7, max_attempts_ct = $8,
                    attempt_strategy_cd = $9, shuffle_qstn_in = $10, shuffle_optn_in = $11, result_visibility_cd = $12, updte_usr_id = $13
             WHERE asmt_id = $1 RETURNING ${ASSESSMENT_RETURNING}`,
            [id, data.courseId, data.assessmentType, data.title, data.instructions, data.durationMin, data.passPct, data.maxAttempts, data.attemptStrategy,
                data.shuffleQuestions, data.shuffleOptions, data.resultVisibility, identity.id]);
        return { before, after };
    },
    async remove(identity, collegeId, id) {
        const assessment = await findAssessment(identity, collegeId, id);
        if (await hasAttempts(id))
            fail(409, 'This assessment already has attempts. Close it instead of deleting it.');
        await db.run('UPDATE asmt_lst_t SET a_in = 0, updte_usr_id = $2 WHERE asmt_id = $1', [id, identity.id]);
        return assessment;
    },
    // Replaces the ordered question list. Locked once students have attempted, so scores stay comparable.
    async setQuestions(identity, collegeId, id, items) {
        await findAssessment(identity, collegeId, id);
        if (await hasAttempts(id))
            fail(409, 'Questions cannot change after students have attempted this assessment.');
        const q = params();
        const found = await db.many(`SELECT x.qstn_id AS id FROM qstn_lst_t x WHERE x.qstn_id = ANY(${q.add(items.map(i => i.questionId))}::int[]) AND ${editorScope(q, identity, collegeId)}`, q.values);
        if (found.length !== new Set(items.map(i => i.questionId)).size)
            fail(400, 'Use questions from your question bank in this college');
        await db.transaction(async tx => {
            await tx.run('DELETE FROM asmt_qstn_rel_t WHERE asmt_id = $1', [id]);
            for (const [i, item] of items.entries())
                await tx.run('INSERT INTO asmt_qstn_rel_t (asmt_qstn_id, asmt_id, qstn_id, sqnce_id, marks_override_ct) VALUES (DEFAULT, $1, $2, $3, $4)', [id, item.questionId, i, item.marksOverride ?? null]);
        });
        return this.detail(identity, collegeId, id);
    },
    async saveWindow(identity, collegeId, assessmentId, windowId, data) {
        await findAssessment(identity, collegeId, assessmentId);
        if (data.cohortId && !await db.one('SELECT 1 FROM chrt_lst_t WHERE chrt_id = $1 AND college_id = $2 AND a_in = 1', [data.cohortId, collegeId]))
            fail(400, 'Choose a cohort of this college');
        if (windowId) {
            const window = await db.one(
                `UPDATE asmt_wndw_lst_t SET chrt_id = $3, opens_ts = $4, closes_ts = $5, extra_time_min_ct = $6, updte_usr_id = $7
                 WHERE asmt_wndw_id = $1 AND asmt_id = $2 AND a_in = 1 RETURNING ${WINDOW_RETURNING}`,
                [windowId, assessmentId, data.cohortId, data.opensAt, data.closesAt, data.extraTimeMin, identity.id]);
            if (!window) notFound('Window');
            return window;
        }
        return db.one(
            `INSERT INTO asmt_wndw_lst_t (asmt_wndw_id, asmt_id, chrt_id, opens_ts, closes_ts, extra_time_min_ct, crte_usr_id)
             VALUES (DEFAULT, $1, $2, $3, $4, $5, $6) RETURNING ${WINDOW_RETURNING}`,
            [assessmentId, data.cohortId, data.opensAt, data.closesAt, data.extraTimeMin, identity.id]);
    },
    async removeWindow(identity, collegeId, assessmentId, windowId) {
        await findAssessment(identity, collegeId, assessmentId);
        if (await db.one('SELECT 1 FROM atmpt_dtl_t WHERE asmt_wndw_id = $1 LIMIT 1', [windowId]))
            fail(409, 'Students have attempted in this window; change its closing time instead.');
        const changed = await db.run('UPDATE asmt_wndw_lst_t SET a_in = 0, updte_usr_id = $3 WHERE asmt_wndw_id = $1 AND asmt_id = $2 AND a_in = 1', [windowId, assessmentId, identity.id]);
        if (!changed) notFound('Window');
        return { success: true };
    },
    // DRAFT -> PUBLISHED (needs questions and a window) -> CLOSED (no new attempts); CLOSED can be reopened.
    async setStatus(identity, collegeId, id, status) {
        const assessment = await findAssessment(identity, collegeId, id);
        const [links, windows] = await Promise.all([
            db.one('SELECT COUNT(*) AS total FROM asmt_qstn_rel_t WHERE asmt_id = $1', [id]),
            db.one('SELECT COUNT(*) AS total FROM asmt_wndw_lst_t WHERE asmt_id = $1 AND a_in = 1', [id]),
        ]);
        if (status === 'PUBLISHED' && (!links.total || !windows.total))
            fail(400, 'Add at least one question and one window before publishing.');
        if (status === 'DRAFT' && await hasAttempts(id))
            fail(409, 'Students have attempted this assessment; close it instead.');
        await db.run('UPDATE asmt_lst_t SET status_cd = $2, updte_usr_id = $3 WHERE asmt_id = $1', [id, status, identity.id]);
        return { before: { status: assessment.status }, after: { status } };
    },
    async publishResults(identity, collegeId, id, published) {
        await findAssessment(identity, collegeId, id);
        await db.run('UPDATE asmt_lst_t SET results_published_in = $2, updte_usr_id = $3 WHERE asmt_id = $1', [id, published ? 1 : 0, identity.id]);
        return { success: true };
    },

    // ---- Results and grading ----
    async attempts(identity, collegeId, id) {
        await findAssessment(identity, collegeId, id);
        const attempts = await db.many(
            `SELECT a.atmpt_id AS "id", a.user_id AS "userId", a.atmpt_no AS "attemptNo", a.status_cd AS "status", a.started_ts AS
            "startedAt", a.submitted_ts AS "submittedAt", a.expires_ts AS "expiresAt", a.score_ct AS "score",
            a.max_score_ct AS "maxScore", a.is_passed_in AS "isPassed", a.needs_grading_in AS "needsGrading"
             FROM atmpt_dtl_t a WHERE a.asmt_id = $1 ORDER BY a.user_id ASC, a.atmpt_no ASC`, [id]);
        const users = await db.many(
            `SELECT u.id, u.name, u.email, s.user_id IS NOT NULL AS "hasProfile", s.roll_no AS "rollNumber"
             FROM "User" u LEFT JOIN stdnt_prfl_dtl_t s ON s.user_id = u.id WHERE u.id = ANY($1::int[])`, [[...new Set(attempts.map(a => a.userId))]]);
        const byId = new Map(users.map(u => [u.id, { id: u.id, name: u.name, email: u.email, studentProfile: u.hasProfile ? { rollNumber: u.rollNumber } : null }]));
        return attempts.map(a => ({ ...a, student: byId.get(a.userId) ?? null }));
    },
    // Full attempt with correct answers, for the assessment's editors.
    async review(identity, collegeId, attemptId) {
        const attempt = await db.one(`SELECT a.atmpt_id AS "id", a.college_id AS "collegeId", a.asmt_id AS "assessmentId", a.asmt_wndw_id AS "windowId",
            a.user_id AS "userId", a.atmpt_no AS "attemptNo", a.status_cd AS "status", a.started_ts AS
            "startedAt", a.expires_ts AS "expiresAt", a.submitted_ts AS "submittedAt", a.layout_json AS
            "layout", a.score_ct AS "score", a.max_score_ct AS "maxScore", a.is_passed_in AS "isPassed",
            a.needs_grading_in AS "needsGrading", a.i_ts AS "createdAt", a.u_ts AS "updatedAt" FROM atmpt_dtl_t a WHERE a.atmpt_id = $1`, [attemptId]);
        if (!attempt) notFound('Attempt');
        attempt.answers = await db.many(`SELECT w.atmpt_ans_id AS "id", w.atmpt_id AS "attemptId", w.qstn_id AS "questionId", w.answer_json AS "answer",
            w.is_correct_in AS "isCorrect", w.marks_awarded_ct AS "marksAwarded", w.feedback_tx AS "feedback",
            w.evaluated_by AS "evaluatedBy", w.evaluated_ts AS "evaluatedAt", w.saved_ts AS "savedAt" FROM atmpt_ans_dtl_t w WHERE w.atmpt_id = $1`, [attemptId]);
        const assessment = await findAssessment(identity, collegeId, attempt.assessmentId);
        const questionLinks = await assessmentLinks(db, [assessment.id]);
        const student = await db.one('SELECT name, email FROM "User" WHERE id = $1', [attempt.userId]);
        const links = new Map(questionLinks.map(q => [q.questionId, q]));
        const answers = new Map(attempt.answers.map(a => [a.questionId, a]));
        return {
            ...attempt, student, assessment: { id: assessment.id, title: assessment.title },
            questions: attempt.layout.map(({ questionId }) => {
                const link = links.get(questionId);
                return { ...link.question, points: pointsOf(link), response: answers.get(questionId) ?? null };
            }),
        };
    },
    // Teacher marks (or re-marks) one answer; the attempt's score and pass state are recalculated.
    async grade(identity, collegeId, attemptId, questionId, { marks, feedback }) {
        const attempt = await db.one(`SELECT a.atmpt_id AS "id", a.college_id AS "collegeId", a.asmt_id AS "assessmentId", a.asmt_wndw_id AS "windowId",
            a.user_id AS "userId", a.atmpt_no AS "attemptNo", a.status_cd AS "status", a.started_ts AS
            "startedAt", a.expires_ts AS "expiresAt", a.submitted_ts AS "submittedAt", a.layout_json AS
            "layout", a.score_ct AS "score", a.max_score_ct AS "maxScore", a.is_passed_in AS "isPassed",
            a.needs_grading_in AS "needsGrading", a.i_ts AS "createdAt", a.u_ts AS "updatedAt" FROM atmpt_dtl_t a WHERE a.atmpt_id = $1`, [attemptId]);
        if (!attempt) notFound('Attempt');
        if (attempt.status === 'IN_PROGRESS')
            fail(409, 'The attempt is still in progress');
        const assessment = await findAssessment(identity, collegeId, attempt.assessmentId);
        const link = (await assessmentLinks(db, [assessment.id])).find(l => l.questionId === questionId);
        if (!link) notFound('Question');
        const max = pointsOf(link);
        if (marks < -link.question.negativeMarks || marks > max)
            fail(400, `Marks must be between ${-link.question.negativeMarks} and ${max}`);
        const before = await db.one(`SELECT w.atmpt_ans_id AS "id", w.atmpt_id AS "attemptId", w.qstn_id AS "questionId", w.answer_json AS "answer",
            w.is_correct_in AS "isCorrect", w.marks_awarded_ct AS "marksAwarded", w.feedback_tx AS "feedback",
            w.evaluated_by AS "evaluatedBy", w.evaluated_ts AS "evaluatedAt", w.saved_ts AS "savedAt" FROM atmpt_ans_dtl_t w WHERE w.atmpt_id = $1 AND w.qstn_id = $2`, [attemptId, questionId]);
        await db.run(
            `INSERT INTO atmpt_ans_dtl_t (atmpt_ans_id, atmpt_id, qstn_id, marks_awarded_ct, is_correct_in, feedback_tx, evaluated_by, evaluated_ts)
             VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (atmpt_id, qstn_id) DO UPDATE
             SET marks_awarded_ct = $3, is_correct_in = $4, feedback_tx = $5, evaluated_by = $6, evaluated_ts = $7`,
            [attemptId, questionId, marks, marks >= max ? 1 : 0, feedback ?? '', identity.id, new Date()]);
        const answers = await db.many('SELECT marks_awarded_ct AS marks FROM atmpt_ans_dtl_t WHERE atmpt_id = $1', [attemptId]);
        const totals = totalAttempt(answers, attempt.maxScore, assessment.passPct);
        await db.run('UPDATE atmpt_dtl_t SET score_ct = $2, needs_grading_in = $3, is_passed_in = $4 WHERE atmpt_id = $1', [attemptId, totals.score, totals.needsGrading, totals.isPassed]);
        return { before, after: { questionId, marks, feedback }, totals };
    },
};
