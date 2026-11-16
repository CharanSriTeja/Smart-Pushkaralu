import path from 'path';
import express, { Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { getCorsOrigins, isOriginAllowed, env } from './config/env.js';
import { httpLogger } from './lib/logger.js';
import { initSentry } from './lib/sentry.js';
import { errorHandler } from './middleware/error-handler.js';
import {
  generalLimiter,
  publicWriteLimiter,
  publicGhatsLimiter,
} from './middleware/rate-limiter.js';
import { healthRouter } from './routes/v1/health.js';
import { authRouter } from './routes/v1/auth.js';
import { userRouter } from './routes/v1/user.js';
import { settingsRouter } from './routes/v1/settings.js';
import { auditRouter } from './routes/v1/audit.js';
import { usageRouter } from './routes/v1/usage.js';
import { devicesRouter } from './routes/v1/devices.js';
import { icccRouter } from './routes/v1/iccc.js';
import { ghatsRouter, crowdReportRouter } from './routes/v1/ghats.routes.js';
import { newsRouter } from './routes/v1/news.routes.js';
import { issuesRouter } from './routes/v1/issues.routes.js';
import { routesRouter } from './routes/v1/routes.routes.js';
import { adminRouter } from './routes/v1/admin.routes.js';
import { sosRouter } from './routes/v1/sos.routes.js';
import { adminSosRouter } from './routes/v1/admin-sos.routes.js';
import { transportRouter } from './routes/v1/transport.routes.js';
import { adminTransportRouter } from './routes/v1/admin-transport.routes.js';
import { sevaRouter } from './routes/v1/seva.routes.js';
import { adminSevaRouter } from './routes/v1/admin-seva.routes.js';

// Initialize Sentry error reporting
initSentry();

export const app = express();
app.set('trust proxy', 1);

// Trust reverse proxy (Render / Cloudflare / Nginx) for accurate client IP in rate limiting
app.set('trust proxy', 1);

// HTTP response compression (gzip / deflate)
app.use(compression());

// Security headers with cross-origin resource policy disabled for static previews
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// CORS allow-list with credentials
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

// General rate limiter
app.use(generalLimiter);

// Serve static uploads only in development or if local storage adapter is configured
if (env.STORAGE_ADAPTER === 'local' || env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
}

// Serve Module 7 standalone emergency SOS web page
app.get(['/sos', '/sos/'], (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/sos/index.html'));
});
app.use('/sos', express.static(path.join(process.cwd(), 'public/sos')));

// Body parsing limit supporting bulk administrative operations while protecting against flood, with raw-body capture for webhook verification
app.use(
  express.json({
    limit: '5mb',
    verify: (req, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  })
);

// Structured Pino HTTP logging with request id and token/phone redaction
app.use(httpLogger);

// API v1 Routes
app.use('/v1', healthRouter);
app.use('/v1/auth', authRouter);
app.use('/v1', userRouter);
app.use('/v1', settingsRouter);
app.use('/v1', usageRouter);
app.use('/v1', icccRouter);
app.use('/v1/ghats', publicGhatsLimiter);
app.use('/v1', ghatsRouter);
app.use('/v1', crowdReportRouter);
app.use('/v1/news', publicGhatsLimiter);
app.use('/v1', newsRouter);
app.use('/v1', devicesRouter);
app.use('/v1', issuesRouter);
app.use('/v1', routesRouter);
app.use('/v1', sosRouter);
app.use('/v1/admin/sos', adminSosRouter);
app.use('/v1/transport', transportRouter);
app.use('/v1/admin/transport', adminTransportRouter);
app.use('/v1/seva', sevaRouter);
app.use('/v1/admin/seva', adminSevaRouter);
app.use('/v1/admin', auditRouter);
app.use('/v1/admin', adminRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Central error handler
app.use(errorHandler);
