import { Router } from 'express';
import { GhatsController } from '../../modules/ghats/ghats.controller.js';
import { CrowdController } from '../../modules/crowd/crowd.controller.js';
import { NoticesController } from '../../modules/notices/notices.controller.js';
import { publicGhatsLimiter, crowdReportLimiter } from '../../middleware/rate-limiter.js';

export const ghatsRouter = Router();

// Rate limited public GET endpoints
ghatsRouter.use(publicGhatsLimiter);

// GET /v1/ghats (list with filters, search, distance calculation)
ghatsRouter.get('/ghats', GhatsController.listGhats);

// GET /v1/ghats/:id (full detail)
ghatsRouter.get('/ghats/:id', GhatsController.getGhatById);

// GET /v1/ghats/:id/notices (active notices)
ghatsRouter.get('/ghats/:id/notices', NoticesController.getGhatNotices);

// GET /v1/ghats/:id/crowd (live crowd status)
ghatsRouter.get('/ghats/:id/crowd', CrowdController.getGhatCrowdStatus);

// Crowd reports router (can also be mounted at root /v1/crowd-reports)
export const crowdReportRouter = Router();
crowdReportRouter.post('/crowd-reports', crowdReportLimiter, CrowdController.submitCrowdReport);

