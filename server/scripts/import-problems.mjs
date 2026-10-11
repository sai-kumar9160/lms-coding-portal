// Loads the platform coding problem library (prisma/data/coding/problems.json) into the database.
// Problems are matched by slug, so running it again updates statements and replaces test cases.
// Usage (from E:\LMS\server): npm run coding:import
// To change problems, edit prisma/data/coding/build-problems.py, run it (python -I prisma/data/coding/build-problems.py), then import.
import 'dotenv/config';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from '../config/db.config.js';

const source = fileURLToPath(new URL('../prisma/data/coding/problems.json', import.meta.url));

export async function importProblems() {
    const problems = JSON.parse(fs.readFileSync(source, 'utf8'));
    for (const p of problems) {
        const fields = { title: p.title, difficulty: p.difficulty, topic: p.topic, statement: p.statement, inputFormat: p.inputFormat, outputFormat: p.outputFormat, constraints: p.constraints, sequence: p.sequence, activeIndicator: 1,
            // Library problems are validated by build-problems.py (reference solutions produce every expected output).
            status: 'PUBLISHED', visibility: 'SHARED', validatedAt: new Date(), referenceLanguage: 'python', referenceSolution: p.solution };
        const testCases = p.tests.map((t, i) => ({ input: t.input, expectedOutput: t.output, isSample: t.sample ? 1 : 0, sequence: i }));
        await db.$transaction(async tx => {
            const row = await tx.codingProblem.upsert({ where: { slug: p.slug }, update: fields, create: { slug: p.slug, collegeId: null, ...fields } });
            await tx.codingTestCase.deleteMany({ where: { problemId: row.id } });
            await tx.codingTestCase.createMany({ data: testCases.map(t => ({ ...t, problemId: row.id })) });
        }, { timeout: 60000 });
    }
    return problems.length;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
    try {
        console.log(`Imported ${await importProblems()} coding problems.`);
    }
    finally {
        await db.$disconnect();
    }
}
