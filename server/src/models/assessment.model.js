import { db } from '../../config/db.config.js';
import { fail, notFound } from '../utils/http-error.js';
import { totalAttempt } from '../services/grading.service.js';

const active = { activeIndicator: 1 };
const isAdmin = (identity) => identity.role === 'COLLEGE_ADMIN' || identity.role === 'SUPER_ADMIN';

// Teachers work with what they created plus items linked to courses they instruct; admins with the whole college.
async function teacherCourseIds(identity, collegeId) {
    const rows = await db.course.findMany({ where: { collegeId, ...active, instructors: { some: { userId: identity.id, ...active } } }, select: { id: true } });
    return rows.map(r => r.id);
}
async function editorScope(identity, collegeId) {
    if (isAdmin(identity))
        return { collegeId, ...active };
    return { collegeId, ...active, OR: [{ createdBy: identity.id }, { courseId: { in: await teacherCourseIds(identity, collegeId) } }] };
}
async function checkCourse(identity, collegeId, courseId) {
    if (!courseId) return;
    const where = { id: courseId, collegeId, ...active, ...(isAdmin(identity) ? {} : { instructors: { some: { userId: identity.id, ...active } } }) };
    if (!await db.course.findFirst({ where }))
        fail(400, 'Choose one of your courses in this college');
}

// A coding question must use a published problem this college can see that is allowed in assessments.
async function checkCodingProblem(collegeId, data) {
    if (data.questionType !== 'CODING') return;
    const problem = await db.codingProblem.findFirst({ where: { id: data.codingProblemId, ...active, status: 'PUBLISHED', visibility: { in: ['SHARED', 'ASSESSMENT'] }, OR: [{ collegeId: null }, { collegeId }] } });
    if (!problem) fail(400, 'Choose a published coding problem that may be used in assessments');
}

// Points a question is worth inside an assessment.
export const pointsOf = (link) => link.marksOverride ?? link.question.marks;

async function findAssessment(identity, collegeId, id, include) {
    const assessment = await db.assessment.findFirst({ where: { id, ...await editorScope(identity, collegeId) }, include });
    if (!assessment) notFound('Assessment');
    return assessment;
}

async function hasAttempts(assessmentId) {
    return (await db.attempt.count({ where: { assessmentId } })) > 0;
}

const questionInclude = { options: { orderBy: { sequence: 'asc' } }, codingProblem: { select: { id: true, title: true, difficulty: true } } };

export const assessmentModel = {
    // Choices for the editor forms: courses the user may link, and the college's cohorts for windows.
    async options(identity, collegeId) {
        const courseWhere = { collegeId, ...active, ...(isAdmin(identity) ? {} : { instructors: { some: { userId: identity.id, ...active } } }) };
        const [courses, cohorts, codingProblems] = await Promise.all([
            db.course.findMany({ where: courseWhere, select: { id: true, title: true, code: true }, orderBy: { title: 'asc' } }),
            db.cohort.findMany({ where: { collegeId, ...active, archived: 0 }, select: { id: true, name: true, _count: { select: { members: { where: active } } } }, orderBy: { name: 'asc' } }),
            // Coding problems usable in assessments: published, shared or assessment-only, platform or this college.
            db.codingProblem.findMany({ where: { ...active, status: 'PUBLISHED', visibility: { in: ['SHARED', 'ASSESSMENT'] }, OR: [{ collegeId: null }, { collegeId }] }, select: { id: true, title: true, difficulty: true, topic: true, collegeId: true }, orderBy: [{ collegeId: 'asc' }, { sequence: 'asc' }, { title: 'asc' }] }),
        ]);
        return { courses, codingProblems, cohorts: cohorts.map(({ _count, ...c }) => ({ ...c, members: _count.members })) };
    },
    // ---- Question bank ----
    async listQuestions(identity, collegeId, { courseId, type, search }) {
        return db.question.findMany({
            where: { ...await editorScope(identity, collegeId), ...(courseId ? { courseId } : {}), ...(type ? { questionType: type } : {}), ...(search ? { stem: { contains: search, mode: 'insensitive' } } : {}) },
            include: { ...questionInclude, _count: { select: { assessments: true } } },
            orderBy: { createdAt: 'desc' },
            take: 500,
        });
    },
    async createQuestion(identity, collegeId, data) {
        await checkCourse(identity, collegeId, data.courseId);
        await checkCodingProblem(collegeId, data);
        const { options, ...fields } = data;
        return db.question.create({ data: { ...fields, collegeId, createdBy: identity.id, options: { create: (options || []).map((o, i) => ({ text: o.text, isCorrect: o.isCorrect ? 1 : 0, sequence: i })) } }, include: questionInclude });
    },
    async updateQuestion(identity, collegeId, id, data) {
        const before = await db.question.findFirst({ where: { id, ...await editorScope(identity, collegeId) }, include: questionInclude });
        if (!before) notFound('Question');
        // Saved answers point at option ids, so a question students have answered is frozen.
        if (await db.attemptAnswer.count({ where: { questionId: id } }))
            fail(409, 'Students have already answered this question. Create a new question instead of changing it.');
        await checkCourse(identity, collegeId, data.courseId);
        await checkCodingProblem(collegeId, data);
        const { options, ...fields } = data;
        const after = await db.$transaction(async tx => {
            await tx.questionOption.deleteMany({ where: { questionId: id } });
            return tx.question.update({ where: { id }, data: { ...fields, updatedBy: identity.id, options: { create: (options || []).map((o, i) => ({ text: o.text, isCorrect: o.isCorrect ? 1 : 0, sequence: i })) } }, include: questionInclude });
        });
        return { before, after };
    },
    async deleteQuestion(identity, collegeId, id) {
        const question = await db.question.findFirst({ where: { id, ...await editorScope(identity, collegeId) } });
        if (!question) notFound('Question');
        await db.question.update({ where: { id }, data: { activeIndicator: 0, updatedBy: identity.id } });
        return question;
    },

    // ---- Assessments ----
    async list(identity, collegeId) {
        const rows = await db.assessment.findMany({
            where: await editorScope(identity, collegeId),
            include: { questions: { include: { question: { select: { marks: true } } } }, windows: { where: active, orderBy: { opensAt: 'asc' } }, _count: { select: { attempts: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map(({ questions, ...a }) => ({ ...a, questionCount: questions.length, totalMarks: questions.reduce((n, q) => n + pointsOf(q), 0) }));
    },
    async detail(identity, collegeId, id) {
        const assessment = await findAssessment(identity, collegeId, id, {
            questions: { orderBy: { sequence: 'asc' }, include: { question: { include: questionInclude } } },
            windows: { where: active, orderBy: { opensAt: 'asc' }, include: { cohort: { select: { id: true, name: true } } } },
            _count: { select: { attempts: true } },
        });
        return { ...assessment, totalMarks: assessment.questions.reduce((n, q) => n + pointsOf(q), 0) };
    },
    async create(identity, collegeId, data) {
        await checkCourse(identity, collegeId, data.courseId);
        return db.assessment.create({ data: { ...data, collegeId, createdBy: identity.id } });
    },
    async update(identity, collegeId, id, data) {
        const before = await findAssessment(identity, collegeId, id);
        await checkCourse(identity, collegeId, data.courseId);
        const after = await db.assessment.update({ where: { id }, data: { ...data, updatedBy: identity.id } });
        return { before, after };
    },
    async remove(identity, collegeId, id) {
        const assessment = await findAssessment(identity, collegeId, id);
        if (await hasAttempts(id))
            fail(409, 'This assessment already has attempts. Close it instead of deleting it.');
        await db.assessment.update({ where: { id }, data: { activeIndicator: 0, updatedBy: identity.id } });
        return assessment;
    },
    // Replaces the ordered question list. Locked once students have attempted, so scores stay comparable.
    async setQuestions(identity, collegeId, id, items) {
        await findAssessment(identity, collegeId, id);
        if (await hasAttempts(id))
            fail(409, 'Questions cannot change after students have attempted this assessment.');
        const scope = await editorScope(identity, collegeId);
        const found = await db.question.findMany({ where: { id: { in: items.map(i => i.questionId) }, ...scope }, select: { id: true } });
        if (found.length !== new Set(items.map(i => i.questionId)).size)
            fail(400, 'Use questions from your question bank in this college');
        await db.$transaction([
            db.assessmentQuestion.deleteMany({ where: { assessmentId: id } }),
            db.assessmentQuestion.createMany({ data: items.map((item, i) => ({ assessmentId: id, questionId: item.questionId, sequence: i, marksOverride: item.marksOverride ?? null })) }),
        ]);
        return this.detail(identity, collegeId, id);
    },
    async saveWindow(identity, collegeId, assessmentId, windowId, data) {
        await findAssessment(identity, collegeId, assessmentId);
        if (data.cohortId && !await db.cohort.findFirst({ where: { id: data.cohortId, collegeId, ...active } }))
            fail(400, 'Choose a cohort of this college');
        if (windowId) {
            const result = await db.assessmentWindow.updateMany({ where: { id: windowId, assessmentId, ...active }, data: { ...data, updatedBy: identity.id } });
            if (!result.count) notFound('Window');
            return db.assessmentWindow.findUnique({ where: { id: windowId } });
        }
        return db.assessmentWindow.create({ data: { ...data, assessmentId, createdBy: identity.id } });
    },
    async removeWindow(identity, collegeId, assessmentId, windowId) {
        await findAssessment(identity, collegeId, assessmentId);
        if (await db.attempt.count({ where: { windowId } }))
            fail(409, 'Students have attempted in this window; change its closing time instead.');
        const result = await db.assessmentWindow.updateMany({ where: { id: windowId, assessmentId, ...active }, data: { activeIndicator: 0, updatedBy: identity.id } });
        if (!result.count) notFound('Window');
        return { success: true };
    },
    // DRAFT -> PUBLISHED (needs questions and a window) -> CLOSED (no new attempts); CLOSED can be reopened.
    async setStatus(identity, collegeId, id, status) {
        const assessment = await findAssessment(identity, collegeId, id, { questions: true, windows: { where: active } });
        if (status === 'PUBLISHED' && (!assessment.questions.length || !assessment.windows.length))
            fail(400, 'Add at least one question and one window before publishing.');
        if (status === 'DRAFT' && await hasAttempts(id))
            fail(409, 'Students have attempted this assessment; close it instead.');
        await db.assessment.update({ where: { id }, data: { status, updatedBy: identity.id } });
        return { before: { status: assessment.status }, after: { status } };
    },
    async publishResults(identity, collegeId, id, published) {
        await findAssessment(identity, collegeId, id);
        await db.assessment.update({ where: { id }, data: { resultsPublished: published ? 1 : 0, updatedBy: identity.id } });
        return { success: true };
    },

    // ---- Results and grading ----
    async attempts(identity, collegeId, id) {
        await findAssessment(identity, collegeId, id);
        const attempts = await db.attempt.findMany({ where: { assessmentId: id }, orderBy: [{ userId: 'asc' }, { attemptNo: 'asc' }], select: { id: true, userId: true, attemptNo: true, status: true, startedAt: true, submittedAt: true, expiresAt: true, score: true, maxScore: true, isPassed: true, needsGrading: true } });
        const users = await db.user.findMany({ where: { id: { in: [...new Set(attempts.map(a => a.userId))] } }, select: { id: true, name: true, email: true, studentProfile: { select: { rollNumber: true } } } });
        const byId = new Map(users.map(u => [u.id, u]));
        return attempts.map(a => ({ ...a, student: byId.get(a.userId) ?? null }));
    },
    // Full attempt with correct answers, for the assessment's editors.
    async review(identity, collegeId, attemptId) {
        const attempt = await db.attempt.findFirst({ where: { id: attemptId }, include: { answers: true } });
        if (!attempt) notFound('Attempt');
        const assessment = await findAssessment(identity, collegeId, attempt.assessmentId, { questions: { include: { question: { include: questionInclude } } } });
        const student = await db.user.findUnique({ where: { id: attempt.userId }, select: { name: true, email: true } });
        const links = new Map(assessment.questions.map(q => [q.questionId, q]));
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
        const attempt = await db.attempt.findFirst({ where: { id: attemptId }, include: { answers: true } });
        if (!attempt) notFound('Attempt');
        if (attempt.status === 'IN_PROGRESS')
            fail(409, 'The attempt is still in progress');
        const assessment = await findAssessment(identity, collegeId, attempt.assessmentId, { questions: { include: { question: { include: questionInclude } } } });
        const link = assessment.questions.find(q => q.questionId === questionId);
        if (!link) notFound('Question');
        const max = pointsOf(link);
        if (marks < -link.question.negativeMarks || marks > max)
            fail(400, `Marks must be between ${-link.question.negativeMarks} and ${max}`);
        const before = attempt.answers.find(a => a.questionId === questionId) ?? null;
        await db.attemptAnswer.upsert({
            where: { attemptId_questionId: { attemptId, questionId } },
            create: { attemptId, questionId, marksAwarded: marks, isCorrect: marks >= max ? 1 : 0, feedback: feedback ?? '', evaluatedBy: identity.id, evaluatedAt: new Date() },
            update: { marksAwarded: marks, isCorrect: marks >= max ? 1 : 0, feedback: feedback ?? '', evaluatedBy: identity.id, evaluatedAt: new Date() },
        });
        const answers = await db.attemptAnswer.findMany({ where: { attemptId } });
        const totals = totalAttempt(answers.map(a => ({ marks: a.marksAwarded })), attempt.maxScore, assessment.passPct);
        await db.attempt.update({ where: { id: attemptId }, data: totals });
        return { before, after: { questionId, marks, feedback }, totals };
    },
};
