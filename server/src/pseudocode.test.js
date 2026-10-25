import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../config/db.config.js';

after(() => db.end());

test('every library program has pseudocode and an explanation; SQL, HTML, React, Git and DevOps have none', async () => {
    const rows = await db.many(`SELECT track_tx AS track, count(*)::int AS total, count(pseudocode_tx)::int AS pseudo, count(explanation_tx)::int AS explained
        FROM cdng_prblm_lst_t WHERE college_id IS NULL GROUP BY track_tx`);
    for (const row of rows) {
        if (['C', 'Python', 'Java', 'DSA'].includes(row.track)) assert.deepEqual([row.pseudo, row.explained], [row.total, row.total], `${row.track} is missing pseudocode`);
        else assert.equal(row.pseudo, 0, `${row.track} should not have pseudocode`);
    }
});

test('pseudocode reads as steps, not as C code', async () => {
    const { pseudocode, explanation } = await db.one(`SELECT pseudocode_tx AS pseudocode, explanation_tx AS explanation FROM cdng_prblm_lst_t WHERE prblm_slug_tx = 'c-struct-topper'`);
    assert.match(pseudocode, /^STRUCTURE Student/);
    assert.match(pseudocode, /FOR i FROM 0 TO n - 1/);
    assert.match(pseudocode, /IF s\[i\]\.marks > s\[best\]\.marks THEN/);
    assert.ok(!/scanf|printf|;/.test(pseudocode), 'no C left in the pseudocode');
    for (const heading of ['## What the program does', '## The idea', '## Step by step', '## Example']) assert.ok(explanation.includes(heading), heading);
    assert.ok(!explanation.includes('`'), 'no backticks in the explanation');
});
