import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Load the server's environment even when launched from the workspace root.
config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });
const { app } = await import('./src/index.js');
const { createLogger } = await import('./src/utils/logger.js');
const log = createLogger('nodeapp');
const port = Number(process.env.PORT || 4000);
const server = app.listen(port, '0.0.0.0', () => {
    log.info(`LMS backend running at http://localhost:${port}`);
});
// Auto-submit assessment attempts whose time ran out while the student was away.
const { sweepExpired } = await import('./src/models/attempt.model.js');
setInterval(() => sweepExpired().then(count => count && log.info(`Auto-submitted ${count} expired attempt(s)`), error => log.error('Attempt sweep failed', { error: error.message })), 60000).unref();
// Coding judge: runs inside this process unless JUDGE_WORKER=off (then start `node judge-worker.js` separately).
if ((process.env.JUDGE_WORKER || 'inline') !== 'off') {
    const { startJudgeWorker } = await import('./src/services/judge.service.js');
    startJudgeWorker();
}
server.on('error', error => {
    log.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Stop the existing backend before starting another.` : error.message);
    process.exitCode = 1;
});
process.on('unhandledRejection', (reason) => {
    log.error('Unhandled Promise Rejection', { error: reason instanceof Error ? reason.message : String(reason), stack: reason instanceof Error ? reason.stack : undefined });
});
process.on('uncaughtException', (err) => {
    log.error('Uncaught Exception', { error: err.message, stack: err.stack });
});
