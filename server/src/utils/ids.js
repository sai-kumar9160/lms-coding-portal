import { z } from 'zod';

// Every row id is a whole number (1, 2, 3 ...) counted up by the database. Ids in a URL or a form arrive as text, so they are converted here.
export const idSchema = z.coerce.number().int().positive();

// Takes the next number of a table's id counter, for the few inserts that need the id before the row exists
// (for example a user who is recorded as the creator of their own row).
export async function nextId(client, table, column) {
    const row = await client.one(`SELECT nextval(pg_get_serial_sequence($1, $2)) AS id`, [table, column]);
    return Number(row.id);
}

// Ids in a path (/courses/12/lessons/7) arrive as text. This turns them into numbers before the handlers run, so comparing them
// with ids read from the database (which are numbers) works. Anything that is not all digits is left alone (and the database refuses it).
const ID_PARAMS = ['id', 'attemptId', 'lessonId', 'moduleId', 'questionId', 'roleId', 'submissionId', 'userId', 'windowId'];
export function numericIds(router) {
    for (const name of ID_PARAMS)
        router.param(name, (req, _res, next, value) => {
            if (/^\d{1,9}$/.test(value)) req.params[name] = Number(value);
            next();
        });
    return router;
}
