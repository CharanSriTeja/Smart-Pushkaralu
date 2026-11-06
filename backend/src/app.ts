import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { secureLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/v1/health.js';
import { authRouter } from './routes/v1/auth.js';
import { userRouter } from './routes/v1/user.js';
import { ghatsRouter, crowdReportRouter } from './routes/v1/ghats.routes.js';
import { newsRouter } from './routes/v1/news.routes.js';
import { devicesRouter } from './routes/v1/devices.routes.js';
import { issuesRouter } from './routes/v1/issues.routes.js';
import { adminRouter } from './routes/v1/admin.routes.js';

export const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors());

// Serve static uploads (with cross-origin access for mobile preview)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Strict body parsing limit for low bandwidth / security (unless specific route overrides)
app.use(express.json({ limit: '100kb' }));

// Custom secure logger (masks phones and tokens)
app.use(secureLogger);

// API v1 Routes
app.use('/v1', healthRouter);
app.use('/v1/auth', authRouter);
app.use('/v1', ghatsRouter);
app.use('/v1', crowdReportRouter);
app.use('/v1', newsRouter);
app.use('/v1', devicesRouter);
app.use('/v1', issuesRouter);
app.use('/v1', userRouter);
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

