// Creates the database tables from ../sql/*.sql (in numeric order), then loads the demo data and the coding problem library.
// The tables are created only when the database is empty, so running this again just refreshes the demo data.
// Usage (from the server folder): npm run db:setup
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { db } from '../config/db.config.js';

const server = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlFolder = path.resolve(server, '..', 'sql');

try {
    const exists = await db.one(`SELECT to_regclass('public.role_t') AS name`);
    if (exists.name) {
        console.log('Tables already exist; skipping sql/*.sql.');
    }
    else {
        for (const file of fs.readdirSync(sqlFolder).filter(name => /^\d+_.*\.sql$/.test(name)).sort()) {
            await db.query(fs.readFileSync(path.join(sqlFolder, file), 'utf8'));
            console.log(`Ran ${file}`);
        }
    }
}
finally {
    await db.end();
}
for (const script of ['seed.mjs', 'import-problems.mjs'])
    execFileSync(process.execPath, [path.join(server, 'scripts', script)], { stdio: 'inherit', cwd: server });
