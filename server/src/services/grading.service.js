// Marks one answer. Returns { isCorrect: 1 | 0 | null, marks: number | null }:
// null marks means the answer needs a teacher (short answers without an answer key).
// Wrong or partially right choice answers score -negativeMarks; unanswered questions score 0.
const round = (value) => Math.round(value * 100) / 100;

export function isAnswered(question, answer) {
    if (!answer) return false;
    switch (question.questionType) {
        case 'SINGLE_CHOICE':
        case 'TRUE_FALSE': return typeof answer.optionId === 'string';
        case 'MULTIPLE_CHOICE': return Array.isArray(answer.optionIds) && answer.optionIds.length > 0;
        case 'NUMERIC': return typeof answer.value === 'number' && Number.isFinite(answer.value);
        case 'SHORT_ANSWER': return typeof answer.text === 'string' && answer.text.trim() !== '';
        case 'CODING': return typeof answer.submissionId === 'string'; // marked from judged submissions, see attempt.model.js
        default: return false;
    }
}

export function gradeAnswer(question, marks, answer) {
    if (!isAnswered(question, answer))
        return { isCorrect: 0, marks: 0 };
    const wrong = { isCorrect: 0, marks: -round(question.negativeMarks || 0) };
    const right = { isCorrect: 1, marks: round(marks) };
    const correctIds = question.options.filter(o => o.isCorrect === 1).map(o => o.id);
    switch (question.questionType) {
        case 'SINGLE_CHOICE':
        case 'TRUE_FALSE':
            return correctIds.includes(answer.optionId) ? right : wrong;
        case 'MULTIPLE_CHOICE': {
            const chosen = new Set(answer.optionIds);
            return chosen.size === correctIds.length && correctIds.every(id => chosen.has(id)) ? right : wrong;
        }
        case 'NUMERIC': {
            const key = question.answerKey || {};
            return Math.abs(answer.value - Number(key.value)) <= Math.abs(Number(key.tolerance) || 0) + 1e-9 ? right : wrong;
        }
        case 'SHORT_ANSWER': {
            const accepted = (question.answerKey?.accepted || []).map(String).filter(a => a.trim());
            if (!accepted.length)
                return { isCorrect: null, marks: null }; // a teacher grades it
            const normalise = (text) => (question.answerKey.caseSensitive ? text : text.toLowerCase()).trim().replace(/\s+/g, ' ');
            return accepted.some(a => normalise(a) === normalise(answer.text)) ? right : wrong;
        }
        default:
            return wrong;
    }
}

// Totals an attempt: score never goes below 0; passing needs every answer graded.
export function totalAttempt(gradedAnswers, maxScore, passPct) {
    const pending = gradedAnswers.some(a => a.marks === null);
    const score = Math.max(0, round(gradedAnswers.reduce((sum, a) => sum + (a.marks ?? 0), 0)));
    return {
        score,
        needsGrading: pending ? 1 : 0,
        isPassed: pending ? null : (maxScore > 0 && (score / maxScore) * 100 >= passPct ? 1 : 0),
    };
}
