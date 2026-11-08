import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { GhatsController } from '../../modules/ghats/ghats.controller.js';
import { CrowdController } from '../../modules/crowd/crowd.controller.js';
import { NoticesController } from '../../modules/notices/notices.controller.js';
import { FacilitiesController } from '../../modules/facilities/facilities.controller.js';
import { PlacesController } from '../../modules/places/places.controller.js';
import { publicGhatsLimiter, crowdReportLimiter } from '../../middleware/rate-limiter.js';

export const ghatsRouter = Router();

// Rate limited public GET endpoints
ghatsRouter.use(publicGhatsLimiter);

// GET /v1/ghats (list with filters, search, distance calculation)
ghatsRouter.get('/ghats', optionalAuth, GhatsController.listGhats);

// GET /v1/ghats/:id (full detail)
ghatsRouter.get('/ghats/:id', GhatsController.getGhatById);

// GET /v1/ghats/:id/notices (active notices)
ghatsRouter.get('/ghats/:id/notices', NoticesController.getGhatNotices);

// GET /v1/ghats/:id/facilities (ghat facilities list)
ghatsRouter.get('/ghats/:id/facilities', FacilitiesController.getGhatFacilities);

// GET /v1/ghats/:id/crowd (live crowd status)
ghatsRouter.get('/ghats/:id/crowd', CrowdController.getGhatCrowdStatus);

// GET /v1/ghats/:id/nearby (Module 5: Nearby hotels, temples, transport hubs with caching & overrides)
ghatsRouter.get('/ghats/:id/nearby', PlacesController.getNearby);

// Crowd reports router (can also be mounted at root /v1/crowd-reports)
export const crowdReportRouter = Router();
crowdReportRouter.post('/crowd-reports', crowdReportLimiter, CrowdController.submitCrowdReport);

