import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const server = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await check(filename);
    else if (/\.(js|mjs)$/.test(filename)) {
      const result = spawnSync(process.execPath, ['--check', filename], { stdio: 'inherit' });
      if (result.error) throw result.error;
      if (result.status !== 0) process.exit(result.status || 1);
    }
  }
}
for (const folder of ['src', 'config', 'prisma', 'scripts']) await check(path.join(server, folder));
console.log('Server JavaScript syntax checks passed.');
