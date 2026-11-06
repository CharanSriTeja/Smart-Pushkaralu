import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getCorsOrigins } from './config/env.js';
import { httpLogger } from './lib/logger.js';
import { initSentry } from './lib/sentry.js';
import { errorHandler } from './middleware/error-handler.js';
import {
  generalLimiter,
  publicWriteLimiter,
  authLimiter,
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
import { adminRouter } from './routes/v1/admin.routes.js';

// Initialize Sentry error reporting
initSentry();

export const app = express();

// Security headers with cross-origin resource policy disabled for static mobile previews
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// CORS allow-list with credentials
const allowedOrigins = getCorsOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps, curl, CLI requests with no origin
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// General rate limiter
app.use(generalLimiter);

// Serve static uploads (with cross-origin access for mobile preview)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Strict body parsing limit for low bandwidth / security (unless specific route overrides)
app.use(express.json({ limit: '100kb' }));

// Structured Pino HTTP logging with request id and token/phone redaction
app.use(httpLogger);

// API v1 Routes
app.use('/v1', healthRouter);
app.use('/v1/auth', authLimiter, authRouter);
app.use('/v1', userRouter);
app.use('/v1', settingsRouter);
app.use('/v1', usageRouter);
app.use('/v1', icccRouter);
app.use('/v1', ghatsRouter);
app.use('/v1', crowdReportRouter);
app.use('/v1', newsRouter);
app.use('/v1', publicWriteLimiter, devicesRouter);
app.use('/v1', issuesRouter);
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
