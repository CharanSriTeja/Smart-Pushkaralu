import { Router } from 'express';
import { DevicesController } from '../../modules/devices/devices.controller.js';
import { crowdReportLimiter } from '../../middleware/rate-limiter.js';

export const devicesRouter = Router();

// POST /v1/devices (rate limited)
devicesRouter.post('/devices', crowdReportLimiter, DevicesController.registerDevice);

// GET /v1/devices/:token
devicesRouter.get('/devices/:token', DevicesController.getDevice);

