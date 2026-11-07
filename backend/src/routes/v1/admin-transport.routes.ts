import { Router } from 'express';
import { requireAuth, requireAdmin, can } from '../../middleware/auth.js';
import { transportController } from '../../modules/transport/transport.controller.js';

export const adminTransportRouter = Router();

// Protect all admin transport routes
adminTransportRouter.use(requireAuth, requireAdmin);

// Transport Hubs
adminTransportRouter.get('/hubs', can('transport.read'), transportController.getAdminHubs);
adminTransportRouter.post('/hubs', can('transport.write'), transportController.createAdminHub);
adminTransportRouter.put('/hubs/:id', can('transport.write'), transportController.updateAdminHub);
adminTransportRouter.delete('/hubs/:id', can('transport.delete'), transportController.deleteAdminHub);

// Bus Routes
adminTransportRouter.get('/bus-routes', can('transport.read'), transportController.getAdminBusRoutes);
adminTransportRouter.post('/bus-routes', can('transport.write'), transportController.createAdminBusRoute);
adminTransportRouter.put('/bus-routes/:id', can('transport.write'), transportController.updateAdminBusRoute);
adminTransportRouter.delete('/bus-routes/:id', can('transport.delete'), transportController.deleteAdminBusRoute);

// Bus Special Services
adminTransportRouter.get('/special-services', can('transport.read'), transportController.getAdminSpecialServices);
adminTransportRouter.post('/special-services', can('transport.write'), transportController.createAdminSpecialService);
adminTransportRouter.put('/special-services/:id', can('transport.write'), transportController.updateAdminSpecialService);
adminTransportRouter.delete('/special-services/:id', can('transport.delete'), transportController.deleteAdminSpecialService);

// Rail Stations
adminTransportRouter.get('/rail-stations', can('transport.read'), transportController.getAdminRailStations);
adminTransportRouter.post('/rail-stations', can('transport.write'), transportController.createAdminRailStation);
adminTransportRouter.put('/rail-stations/:id', can('transport.write'), transportController.updateAdminRailStation);
adminTransportRouter.delete('/rail-stations/:id', can('transport.delete'), transportController.deleteAdminRailStation);

// Shuttle Routes & Stops
adminTransportRouter.get('/shuttle-routes', can('transport.read'), transportController.getAdminShuttleRoutes);
adminTransportRouter.post('/shuttle-routes', can('transport.write'), transportController.createAdminShuttleRoute);
adminTransportRouter.put('/shuttle-routes/:id', can('transport.write'), transportController.updateAdminShuttleRoute);
adminTransportRouter.delete('/shuttle-routes/:id', can('transport.delete'), transportController.deleteAdminShuttleRoute);
adminTransportRouter.post('/shuttle-routes/:id/stops', can('transport.write'), transportController.addAdminShuttleStop);

// External Links
adminTransportRouter.get('/external-links', can('transport.read'), transportController.getAdminExternalLinks);
adminTransportRouter.put('/external-links/:id', can('transport.write'), transportController.updateAdminExternalLink);

