// Loads the platform coding problem library (data/coding/problems.json) into the database.
// Problems are matched by slug, so running it again updates statements and replaces test cases.
// Usage (from E:\LMS\server): npm run coding:import
// To change problems, edit data/coding/build-problems.py (and build-problems-extra.py for the C, Java, DSA, SQL and HTML & CSS tracks), run it (python -I data/coding/build-problems.py), then import.
import 'dotenv/config';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from '../config/db.config.js';

const source = fileURLToPath(new URL('../data/coding/problems.json', import.meta.url));

export async function importProblems() {
    const problems = JSON.parse(fs.readFileSync(source, 'utf8'));
    for (const p of problems) {
        await db.transaction(async tx => {
            // Library problems are validated by build-problems.py (reference solutions produce every expected output).
            const { id } = await tx.one(
                `INSERT INTO cdng_prblm_lst_t (cdng_prblm_id, college_id, prblm_slug_tx, prblm_ttl, difficulty_cd, topic_tx, track_tx, statement_tx, input_format_tx, output_format_tx, constraints_tx,
                                               sqnce_id, status_cd, visibility_cd, validated_ts, reference_lang_cd, reference_solution_tx, languages_json, checker_cd, starters_json, pseudocode_tx, explanation_tx)
                 VALUES (DEFAULT, NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PUBLISHED', 'SHARED', $11, $12, $13, $14::jsonb, COALESCE($15::"CheckerMode", 'TRIMMED'), $16::jsonb, $17, $18)
                 ON CONFLICT (prblm_slug_tx) DO UPDATE SET prblm_ttl = $2, difficulty_cd = $3, topic_tx = $4, track_tx = $5, statement_tx = $6, input_format_tx = $7, output_format_tx = $8,
                     constraints_tx = $9, sqnce_id = $10, a_in = 1, status_cd = 'PUBLISHED', visibility_cd = 'SHARED', validated_ts = $11, reference_lang_cd = $12, reference_solution_tx = $13,
                     languages_json = $14::jsonb, checker_cd = COALESCE($15::"CheckerMode", 'TRIMMED'), starters_json = $16::jsonb, pseudocode_tx = $17, explanation_tx = $18
                 RETURNING cdng_prblm_id AS id`,
                [p.slug, p.title, p.difficulty, p.topic, p.track ?? 'General', p.statement, p.inputFormat, p.outputFormat, p.constraints, p.sequence, new Date(), p.language ?? 'python', p.solution,
                    p.languages ? JSON.stringify(p.languages) : null, p.checker ?? null, p.starters ? JSON.stringify(p.starters) : null, p.pseudocode ?? null, p.explanation ?? null]);
            await tx.run('DELETE FROM cdng_tst_cs_lst_t WHERE cdng_prblm_id = $1', [id]);
            for (const [i, t] of p.tests.entries())
                await tx.run(
                    `INSERT INTO cdng_tst_cs_lst_t (cdng_tst_cs_id, cdng_prblm_id, input_tx, expected_output_tx, is_sample_in, sqnce_id) VALUES (DEFAULT, $1, $2, $3, $4, $5)`,
                    [id, t.input, t.output, t.sample ? 1 : 0, i]);
        });
    }
    return problems.length;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
    try {
        console.log(`Imported ${await importProblems()} coding problems.`);
    }
    finally {
        await db.end();
    }
}
