// Demo data: the roles, a platform Super Admin, and two colleges (alpha, beta) with an admin, a teacher, a student and one course each.
// Safe to run again: every row is looked up first or inserted with ON CONFLICT DO NOTHING.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.config.js';
import { Role } from '../src/utils/enums.js';

try {
    for (const [id, code, name] of [[1, Role.SUPER_ADMIN, 'Super Admin'], [2, Role.COLLEGE_ADMIN, 'College Admin'], [3, Role.TEACHER, 'Teacher'], [4, Role.STUDENT, 'Student']])
        await db.run('INSERT INTO role_t (role_id, role_code, role_name) VALUES ($1, $2, $3) ON CONFLICT (role_code) DO NOTHING', [id, code, name]);
    const password = await bcrypt.hash('DemoPass123!', 12);
    if (!await db.one(`SELECT 1 FROM "User" WHERE email = 'super@lms.local' AND role = 'SUPER_ADMIN'`))
        await db.run(`INSERT INTO "User" (id, name, email, password, role) VALUES (DEFAULT, 'Platform Admin', 'super@lms.local', $1, 'SUPER_ADMIN')`, [password]);
    for (const slug of ['alpha', 'beta']) {
        await db.run('INSERT INTO "College" (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING', [`${slug === 'alpha' ? 'Alpha' : 'Beta'} Institute of Technology`, slug]);
        const college = await db.one('SELECT id FROM "College" WHERE slug = $1', [slug]);
        for (const role of [Role.COLLEGE_ADMIN, Role.TEACHER, Role.STUDENT]) {
            const label = role === Role.COLLEGE_ADMIN ? 'admin' : role.toLowerCase();
            await db.run(
                `INSERT INTO "User" (id, "collegeId", name, email, password, role) VALUES (DEFAULT, $1, $2, $3, $4, $5)
                 ON CONFLICT ("collegeId", email) DO NOTHING`, [college.id, `${slug} ${label}`, `${label}@${slug}.local`, password, role]);
        }
        const teacher = await db.one('SELECT id FROM "User" WHERE "collegeId" = $1 AND email = $2', [college.id, `teacher@${slug}.local`]);
        if (!await db.one('SELECT 1 FROM "Course" WHERE "collegeId" = $1', [college.id])) {
            await db.transaction(async tx => {
                const course = await tx.one(
                    `INSERT INTO "Course" (id, "collegeId", "teacherId", title, description, status)
                     VALUES (DEFAULT, $1, $2, 'JavaScript Foundations', $3, 'PUBLISHED') RETURNING id`,
                    [college.id, teacher.id, 'Build a strong foundation in programming with JavaScript. Learn variables, functions, and your first application.']);
                await tx.run(`INSERT INTO crse_instrctr_rel_t (crse_instrctr_id, college_id, course_id, user_id, instrctr_role_cd) VALUES (DEFAULT, $1, $2, $3, 'OWNER')`, [college.id, course.id, teacher.id]);
                const module = await tx.one(`INSERT INTO "CourseModule" (id, "collegeId", "courseId", title) VALUES (DEFAULT, $1, $2, 'Getting started') RETURNING id`, [college.id, course.id]);
                await tx.run(
                    `INSERT INTO "Lesson" (id, "collegeId", "moduleId", title, content) VALUES (DEFAULT, $1, $2, 'Your first JavaScript program', $3)`,
                    [college.id, module.id, 'Welcome to JavaScript Foundations!\n\nJavaScript lets you add behavior to websites and build server applications with Node.js.\n\nStart by creating a file named hello.js and add:\n\nconsole.log("Hello, campus!");\n\nRun it using: node hello.js\n\nTry changing the message. Once you understand how it works, mark this lesson complete.']);
            });
        }
    }
    console.log('Two demo colleges ready. Demo password: DemoPass123!');
}
finally {
    await db.end();
}
