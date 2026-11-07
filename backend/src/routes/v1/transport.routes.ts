import { Router } from 'express';
import { transportController } from '../../modules/transport/transport.controller.js';

export const transportRouter = Router();

// ==========================================
// 1. PUBLIC TRANSPORT & SHUTTLES OVERVIEW
// ==========================================
transportRouter.get('/bus', transportController.getBus);
transportRouter.get('/rail', transportController.getRail);
transportRouter.get('/shuttles', transportController.getShuttles);

// ==========================================
// 2. ADAPTER STUB ROUTES FOR FUTURE OFFICIAL APIS
// No scraping & no unofficial APIs (strict compliance)
// ==========================================
// Bus stubs
transportRouter.get('/bus/routes', transportController.getBusRoutesStub);
transportRouter.get('/bus/live', transportController.getBusLiveStub);
transportRouter.get('/bus/stops', transportController.getBusStopsStub);
transportRouter.get('/bus/special-services', transportController.getBusSpecialServicesStub);

// Rail stubs
transportRouter.get('/rail/nearby-stations', transportController.getRailNearbyStationsStub);
transportRouter.get('/rail/trains', transportController.getRailTrainsStub);
transportRouter.get('/rail/schedule', transportController.getRailScheduleStub);
transportRouter.get('/rail/availability', transportController.getRailAvailabilityStub);

