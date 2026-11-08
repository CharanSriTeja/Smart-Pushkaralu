import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { checkPermission } from '../../middleware/rbac.js';
import {
  getGhatAccessPoints,
  getRouteOrigins,
  getStandardRoute,
  computeLiveRoute,
  getTemplesAlongRouteHandler,
  recalculateWithStops,
  getActiveClosures,
  adminGetOrigins,
  adminCreateOrigin,
  adminUpdateOrigin,
  adminDeleteOrigin,
  adminGetAccessPoints,
  adminCreateAccessPoint,
  adminUpdateAccessPoint,
  adminGetClosures,
  adminCreateClosure,
  adminDeleteClosure,
  adminGetDelayFactors,
  adminCreateDelayFactor,
  adminDeleteDelayFactor,
  adminGetTemples,
  adminUpdateTemple,
  adminGetOperations,
} from '../../modules/routes/routes.controller.js';

export const routesRouter = Router();

// --- PUBLIC ROUTING ENDPOINTS ---
routesRouter.get('/ghats/:ghatId/access-points', getGhatAccessPoints);
routesRouter.get('/route-origins', getRouteOrigins);
routesRouter.get('/route/standard', getStandardRoute);
routesRouter.get('/route', computeLiveRoute);
routesRouter.get('/route/temples', getTemplesAlongRouteHandler);
routesRouter.post('/route/stops', recalculateWithStops);
routesRouter.get('/route-closures', getActiveClosures);

// --- ADMIN ROUTING ENDPOINTS ---
// Guarded with requireAuth and checkPermission('routes.manage')
const adminRoutes = Router();
adminRoutes.use(requireAuth);
adminRoutes.use(checkPermission('routes.manage'));

// Origins
adminRoutes.get('/origins', adminGetOrigins);
adminRoutes.post('/origins', adminCreateOrigin);
adminRoutes.put('/origins/:id', adminUpdateOrigin);
adminRoutes.delete('/origins/:id', adminDeleteOrigin);

// Access points
adminRoutes.get('/access-points/:ghatId', adminGetAccessPoints);
adminRoutes.post('/access-points', adminCreateAccessPoint);
adminRoutes.put('/access-points/:id', adminUpdateAccessPoint);

// Closures
adminRoutes.get('/closures', adminGetClosures);
adminRoutes.post('/closures', adminCreateClosure);
adminRoutes.delete('/closures/:id', adminDeleteClosure);

// Delay factors
adminRoutes.get('/delay-factors', adminGetDelayFactors);
adminRoutes.post('/delay-factors', adminCreateDelayFactor);
adminRoutes.delete('/delay-factors/:id', adminDeleteDelayFactor);

// Temples
adminRoutes.get('/temples', adminGetTemples);
adminRoutes.put('/temples/:id', adminUpdateTemple);

// Operations / Health / Budget dashboard
adminRoutes.get('/operations', adminGetOperations);

routesRouter.use('/admin/routes', adminRoutes);

