import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// PostgreSQL connection settings, organized like APCMMS's db.config.js.
// Credentials remain in server/.env; DATABASE_URL is also used by Prisma migrations.
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
connectionUrl.hostname = DB_HOST_NAME;
connectionUrl.port = String(DB_PORT);
connectionUrl.username = USER;
connectionUrl.password = PWD;
connectionUrl.pathname = `/${DATABASE}`;
connectionUrl.searchParams.set('connection_limit', String(CONNECTION_LIMIT));
connectionUrl.searchParams.set('pool_timeout', String(POOL_TIMEOUT));

export function createDatabaseClient() {
    return new PrismaClient({ datasourceUrl: connectionUrl.toString() });
}
// Prisma manages the PostgreSQL pool: up to CONNECTION_LIMIT connections per process.
// Reuse this client for controllers/models and the session store.
export const db = createDatabaseClient();
