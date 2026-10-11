import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Stand-alone coding judge worker. Run one or more of these (on this or other machines sharing the database)
// and set JUDGE_WORKER=off on the API servers. JUDGE_SLOTS sets how many programs each worker runs at once.
config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });
const { startJudgeWorker } = await import('./src/services/judge.service.js');
const { createLogger } = await import('./src/utils/logger.js');
const log = createLogger('judge-worker');
const worker = startJudgeWorker();
for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, async () => {
        log.info(`Stopping judge worker (${signal}); finishing running jobs`);
        await worker.stop();
        process.exit(0);
    });
// Keep the process alive (the worker's timers are unref'd so the API can exit cleanly).
setInterval(() => {}, 1 << 30);
