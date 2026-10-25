import 'dotenv/config';
import pg from 'pg';

// PostgreSQL connection settings, organized like APCMMS's db.config.js.
// Credentials stay in server/.env (DATABASE_URL); DB_* variables can override single parts of it.
const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) throw new Error('DATABASE_URL must be configured in server/.env');
const connectionUrl = new URL(configuredUrl);
if (!['postgres:', 'postgresql:'].includes(connectionUrl.protocol)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
}
export const DB_HOST_NAME = process.env.DB_HOST_NAME || connectionUrl.hostname;
export const DB_PORT = Number(process.env.DB_PORT || connectionUrl.port || 5432);
export const USER = process.env.DB_USER || decodeURIComponent(connectionUrl.username);
const PWD = process.env.DB_PASSWORD ?? decodeURIComponent(connectionUrl.password);
export const DATABASE = process.env.DB_NAME || decodeURIComponent(connectionUrl.pathname.slice(1));
export const CONNECTION_LIMIT = Number(process.env.DB_CONNECTION_LIMIT || 10);
export const POOL_TIMEOUT = Number(process.env.DB_POOL_TIMEOUT || 10);
for (const [name, value, maximum] of [['DB_PORT', DB_PORT, 65535], ['DB_CONNECTION_LIMIT', CONNECTION_LIMIT, 1000], ['DB_POOL_TIMEOUT', POOL_TIMEOUT, 3600]]) {
    if (!Number.isInteger(value) || value < 1 || value > maximum) throw new Error(`${name} must be an integer between 1 and ${maximum}`);
}

// Timestamps are stored as "timestamp without time zone" holding UTC. node-pg would read them as local time,
// so read them back as UTC and write JavaScript dates as UTC. COUNT(*) (bigint) comes back as a number.
pg.defaults.parseInputDatesAsUTC = true;
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, value => new Date(`${value.replace(' ', 'T')}Z`));
pg.types.setTypeParser(pg.types.builtins.DATE, value => new Date(`${value}T00:00:00Z`));
pg.types.setTypeParser(pg.types.builtins.INT8, value => Number(value));

// One pool per process: up to CONNECTION_LIMIT connections, shared by controllers, models and the session store.
export const pool = new pg.Pool({
    host: DB_HOST_NAME, port: DB_PORT, user: USER, password: PWD, database: DATABASE,
    max: CONNECTION_LIMIT, connectionTimeoutMillis: POOL_TIMEOUT * 1000,
    options: '-c timezone=UTC',
});
pool.on('error', error => console.error('Unexpected PostgreSQL pool error:', error.message));

// The same four helpers work on the pool and inside a transaction:
//   many(sql, params) -> array of rows       one(sql, params) -> first row or null
//   run(sql, params)  -> number of rows changed      query(sql, params) -> the raw pg result
// Parameters are numbered in the SQL ($1, $2, ...) and passed separately, which is what stops SQL injection.
const helpers = runner => ({
    query: (text, params = []) => runner.query(text, params),
    many: async (text, params = []) => (await runner.query(text, params)).rows,
    one: async (text, params = []) => (await runner.query(text, params)).rows[0] ?? null,
    run: async (text, params = []) => (await runner.query(text, params)).rowCount,
});

export const db = {
    ...helpers(pool),
    // Runs work(tx) in one transaction: COMMIT when it returns, ROLLBACK when it throws.
    async transaction(work) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await work(helpers(client));
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw error;
        }
        finally {
            client.release();
        }
    },
    end: () => pool.end(),
};
// Collects query parameters while a WHERE clause is built:
//   const q = params();  `... WHERE college_id = ${q.add(collegeId)}`  then db.many(sql, q.values)
export function params() {
    const values = [];
    return { values, add(value) { values.push(value); return `$${values.length}`; } };
}
