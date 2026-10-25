import { db } from '../config/db.config.js';
import { columns, tableName } from './test-tables.js';

// Small SQL helpers for the tests. `where` is { property: value }: an array matches any of its values, null matches NULL.
function whereSql(entity, where, alias) {
    const values = [];
    const parts = Object.entries(where).map(([property, value]) => {
        const column = columns(entity, alias, [property]).split(' AS ')[0];
        if (value === null) return `${column} IS NULL`;
        values.push(value);
        return Array.isArray(value) ? `${column} = ANY($${values.length})` : `${column} = $${values.length}`;
    });
    return { sql: parts.length ? `WHERE ${parts.join(' AND ')}` : '', values };
}

export const findAll = (entity, where = {}, orderBy = '') => {
    const { sql, values } = whereSql(entity, where, 't');
    return db.many(`SELECT ${columns(entity, 't')} FROM ${tableName(entity)} t ${sql} ${orderBy}`, values);
};
export const findFirst = async (entity, where = {}) => (await findAll(entity, where))[0] ?? null;
// Like findFirst, but the row must exist.
export const findOne = async (entity, where) => {
    const row = await findFirst(entity, where);
    if (!row) throw new Error(`No ${entity} row matches ${JSON.stringify(where)}`);
    return row;
};
export const countRows = async (entity, where = {}) => {
    const { sql, values } = whereSql(entity, where, 't');
    return (await db.one(`SELECT COUNT(*) AS total FROM ${tableName(entity)} t ${sql}`, values)).total;
};
export const remove = (entity, where) => {
    const { sql, values } = whereSql(entity, where, 't');
    return db.run(`DELETE FROM ${tableName(entity)} t ${sql}`, values);
};
// UPDATE the rows matching `where` with `data` (both { property: value }).
export const change = (entity, where, data) => {
    const set = Object.entries(data);
    const { sql, values } = whereSql(entity, where, 't');
    const shifted = sql.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + set.length}`);
    const assignments = set.map(([property], i) => `${columns(entity, 't', [property]).split(' AS ')[0].replace(/^t\./, '')} = $${i + 1}`);
    return db.run(`UPDATE ${tableName(entity)} t SET ${assignments.join(', ')} ${shifted}`, [...set.map(([, value]) => value), ...values]);
};

// An id for a person who does not exist as a row (a creator recorded in crte_usr_id): a number far above the real ones.
let lastFakeId = 900000;
export const fakeId = () => ++lastFakeId;
