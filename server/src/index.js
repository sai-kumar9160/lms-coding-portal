import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRoutes } from './routes/api.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/request-logger.middleware.js';
import { corsOptions } from '../config/cors.config.js';
import { trustProxySetting } from '../config/proxy.config.js';
export { db } from '../config/db.config.js';
export const app = express();
const trustProxy = trustProxySetting();
if (trustProxy !== null)
    app.set('trust proxy', trustProxy);
app.use(requestLogger);
app.use(helmet());
app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), fullscreen=(self)');
    next();
});
app.use(cors(corsOptions));
app.use(express.json({ limit: '256kb' }));
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);
