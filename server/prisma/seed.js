import 'dotenv/config';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.config.js';
try {
    for (const [id, code, name] of [[1, Role.SUPER_ADMIN, 'Super Admin'], [2, Role.COLLEGE_ADMIN, 'College Admin'], [3, Role.TEACHER, 'Teacher'], [4, Role.STUDENT, 'Student']]) {
        await db.roleMaster.upsert({ where: { code }, update: {}, create: { id, code, name } });
    }
    const password = await bcrypt.hash('DemoPass123!', 12);
    if (!await db.user.findFirst({ where: { email: 'super@lms.local', role: Role.SUPER_ADMIN } }))
        await db.user.create({ data: { name: 'Platform Admin', email: 'super@lms.local', password, role: Role.SUPER_ADMIN } });
    for (const slug of ['alpha', 'beta']) {
        const college = await db.college.upsert({ where: { slug }, update: {}, create: { name: `${slug === 'alpha' ? 'Alpha' : 'Beta'} Institute of Technology`, slug } });
        for (const role of [Role.COLLEGE_ADMIN, Role.TEACHER, Role.STUDENT]) {
            const label = role === Role.COLLEGE_ADMIN ? 'admin' : role.toLowerCase();
            await db.user.upsert({ where: { collegeId_email: { collegeId: college.id, email: `${label}@${slug}.local` } }, update: {}, create: { collegeId: college.id, name: `${slug} ${label}`, email: `${label}@${slug}.local`, password, role } });
        }
        const teacher = await db.user.findUniqueOrThrow({ where: { collegeId_email: { collegeId: college.id, email: `teacher@${slug}.local` } } });
        if (!await db.course.findFirst({ where: { collegeId: college.id } }))
            await db.course.create({ data: { collegeId: college.id, teacherId: teacher.id, title: 'JavaScript Foundations', description: 'Build a strong foundation in programming with JavaScript. Learn variables, functions, and your first application.', status: 'PUBLISHED', instructors: { create: { collegeId: college.id, userId: teacher.id, role: 'OWNER' } }, modules: { create: { collegeId: college.id, title: 'Getting started', lessons: { create: { collegeId: college.id, title: 'Your first JavaScript program', content: 'Welcome to JavaScript Foundations!\n\nJavaScript lets you add behavior to websites and build server applications with Node.js.\n\nStart by creating a file named hello.js and add:\n\nconsole.log("Hello, campus!");\n\nRun it using: node hello.js\n\nTry changing the message. Once you understand how it works, mark this lesson complete.' } } } } } });
    }
    console.log('Two demo colleges ready. Demo password: DemoPass123!');
}
finally {
    await db.$disconnect();
}
