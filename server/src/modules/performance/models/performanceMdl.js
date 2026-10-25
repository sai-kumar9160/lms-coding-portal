import { db } from '../../../../config/db.config.js';
import { codingMdl } from '../../coding/models/codingMdl.js';

// Points that decide the rank inside a college: 10 for each coding problem solved, 5 for each lesson completed,
// and the average assessment percentage (0 to 100). Everyone in the college is ranked the same way.
export const POINTS = { problem: 10, lesson: 5 };

const percent = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

export const performanceMdl = {
    async forStudent(identity, collegeId) {
        // One row per active student of the college with the three numbers that make the points.
        const students = await db.many(
            `SELECT u.id, u.name,
                    COALESCE((SELECT COUNT(DISTINCT s.cdng_prblm_id) FROM cdng_sbmsn_dtl_t s
                              WHERE s.user_id = u.id AND s.college_id = $1 AND s.kind_cd = 'SUBMIT' AND s.atmpt_id IS NULL AND s.status_cd = 'ACCEPTED'), 0) AS "solved",
                    COALESCE((SELECT COUNT(*) FROM "LessonProgress" lp
                              WHERE lp."userId" = u.id AND lp."collegeId" = $1 AND lp."completedAt" IS NOT NULL AND lp.a_in = 1), 0) AS "lessons",
                    COALESCE((SELECT AVG(100.0 * a.score_ct / a.max_score_ct) FROM atmpt_dtl_t a
                              WHERE a.user_id = u.id AND a.college_id = $1 AND a.status_cd IN ('SUBMITTED', 'AUTO_SUBMITTED') AND a.max_score_ct > 0 AND a.needs_grading_in = 0), 0) AS "assessmentAverage",
                    (SELECT COUNT(*) FROM atmpt_dtl_t a WHERE a.user_id = u.id AND a.college_id = $1 AND a.status_cd IN ('SUBMITTED', 'AUTO_SUBMITTED')) AS "assessmentsTaken"
             FROM "User" u WHERE u."collegeId" = $1 AND u.role = 'STUDENT' AND u.a_in = 1 AND u.status = 'ACTIVE'`, [collegeId]);
        const ranked = students.map(s => ({ ...s, solved: Number(s.solved), lessons: Number(s.lessons), assessmentAverage: Math.round(Number(s.assessmentAverage)), assessmentsTaken: Number(s.assessmentsTaken) }))
            .map(s => ({ ...s, points: s.solved * POINTS.problem + s.lessons * POINTS.lesson + s.assessmentAverage }))
            .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
        // Students with equal points share a rank (1, 2, 2, 4, ...).
        for (const [i, s] of ranked.entries()) s.rank = i > 0 && s.points === ranked[i - 1].points ? ranked[i - 1].rank : i + 1;
        const me = ranked.find(s => s.id === identity.id);
        if (!me) return null;

        const [problems, lessonTotal] = await Promise.all([
            codingMdl.list(identity, collegeId),
            db.one(`SELECT COUNT(*) AS total FROM "Lesson" l JOIN "CourseModule" m ON m.id = l."moduleId" JOIN "Course" c ON c.id = m."courseId"
                    WHERE c."collegeId" = $1 AND c.status = 'PUBLISHED' AND c.a_in = 1 AND m.a_in = 1 AND l.a_in = 1`, [collegeId]),
        ]);
        const total = ranked.length;
        const behind = ranked.filter(s => s.points < me.points).length;
        const tracks = new Map();
        for (const p of problems) {
            const t = tracks.get(p.track ?? 'General') ?? { track: p.track ?? 'General', total: 0, solved: 0 };
            t.total++;
            if (p.state === 'SOLVED') t.solved++;
            tracks.set(t.track, t);
        }
        const lessonsTotal = Number(lessonTotal?.total ?? 0);
        return {
            points: me.points, rank: me.rank, totalStudents: total,
            // "Ahead of 80% of your classmates": share of the other students with fewer points.
            aheadOfPercent: total > 1 ? Math.round((behind / (total - 1)) * 100) : 100,
            breakdown: {
                problems: { solved: me.solved, total: problems.length, percent: percent(me.solved, problems.length), points: me.solved * POINTS.problem },
                lessons: { completed: me.lessons, total: lessonsTotal, percent: percent(me.lessons, lessonsTotal), points: me.lessons * POINTS.lesson },
                assessments: { taken: me.assessmentsTaken, averagePercent: me.assessmentAverage, points: me.assessmentAverage },
            },
            tracks: [...tracks.values()].filter(t => t.solved > 0).sort((a, b) => b.solved - a.solved).slice(0, 5),
            leaderboard: ranked.slice(0, 5).map(s => ({ rank: s.rank, name: s.name, points: s.points, isMe: s.id === identity.id })),
            pointsRule: POINTS,
        };
    },
};
