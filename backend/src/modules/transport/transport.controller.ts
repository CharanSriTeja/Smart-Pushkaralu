import { Request, Response } from 'express';
import { transportService, TransportService } from './transport.service.js';
import { busApiAdapter } from './adapters/bus-adapter.js';
import { railApiAdapter } from './adapters/rail-adapter.js';
import { writeAudit } from '../../lib/audit.js';

export class TransportController {
  constructor(private service: TransportService = transportService) {}

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  getBus = async (req: Request, res: Response): Promise<void> => {
    try {
      const ghatId = req.query.ghat_id as string | undefined;
      const data = await this.service.getBusTransport(ghatId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  };

  getRail = async (req: Request, res: Response): Promise<void> => {
    try {
      const ghatId = req.query.ghat_id as string | undefined;
      const data = await this.service.getRailTransport(ghatId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  };

  getShuttles = async (req: Request, res: Response): Promise<void> => {
    try {
      const ghatId = req.query.ghat_id as string | undefined;
      const data = await this.service.getShuttlesTransport(ghatId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  };

  // ==========================================
  // STUB ROUTES FOR FUTURE OFFICIAL APIS
  // ==========================================

  getBusRoutesStub = async (req: Request, res: Response): Promise<void> => {
    const result = await busApiAdapter.getRoutes(req.query);
    res.status(200).json(result);
  };

  getBusLiveStub = async (req: Request, res: Response): Promise<void> => {
    const result = await busApiAdapter.getLiveTracking(req.query);
    res.status(200).json(result);
  };

  getBusStopsStub = async (req: Request, res: Response): Promise<void> => {
    const result = await busApiAdapter.getStops(req.query);
    res.status(200).json(result);
  };

  getBusSpecialServicesStub = async (req: Request, res: Response): Promise<void> => {
    const result = await busApiAdapter.getSpecialServices(req.query);
    res.status(200).json(result);
  };

  getRailNearbyStationsStub = async (req: Request, res: Response): Promise<void> => {
    const result = await railApiAdapter.getNearbyStations(req.query);
    res.status(200).json(result);
  };

  getRailTrainsStub = async (req: Request, res: Response): Promise<void> => {
    const result = await railApiAdapter.getTrains(req.query);
    res.status(200).json(result);
  };

  getRailScheduleStub = async (req: Request, res: Response): Promise<void> => {
    const result = await railApiAdapter.getSchedule(req.query);
    res.status(200).json(result);
  };

  getRailAvailabilityStub = async (req: Request, res: Response): Promise<void> => {
    const result = await railApiAdapter.getAvailability(req.query);
    res.status(200).json(result);
  };

  // ==========================================
  // ADMIN CRUD OPERATIONS (WITH AUDIT LOGGING)
  // ==========================================

  // Hubs
  getAdminHubs = async (req: Request, res: Response): Promise<void> => {
    const hubType = req.query.hub_type as string | undefined;
    const hubs = await this.service.getRepo().getHubs({ hub_type: hubType });
    res.status(200).json({ success: true, items: hubs });
  };

  createAdminHub = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const hub = await this.service.getRepo().createHub(req.body);

      await writeAudit({
        adminId,
        action: 'transport.hub.create',
        entityType: 'transport_hub',
        entityId: hub.id,
        oldValue: null,
        newValue: hub,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Added new transport hub for Godavari Pushkaralu',
      });

      res.status(201).json({ success: true, item: hub });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };

  updateAdminHub = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const existing = await this.service.getRepo().getHubById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Transport hub not found' } });
        return;
      }

      const updated = await this.service.getRepo().updateHub(id, req.body);
      await writeAudit({
        adminId,
        action: 'transport.hub.update',
        entityType: 'transport_hub',
        entityId: id,
        oldValue: existing,
        newValue: updated,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Updated transport hub details',
      });

      res.status(200).json({ success: true, item: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };

  deleteAdminHub = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const existing = await this.service.getRepo().getHubById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Transport hub not found' } });
        return;
      }

      await this.service.getRepo().deleteHub(id);
      await writeAudit({
        adminId,
        action: 'transport.hub.delete',
        entityType: 'transport_hub',
        entityId: id,
        oldValue: existing,
        newValue: null,
        sourceUrl: req.originalUrl,
        reason: req.body?.reason || 'Decommissioned transport hub',
      });

      res.status(200).json({ success: true, message: 'Transport hub deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  };

  // Bus Routes
  getAdminBusRoutes = async (req: Request, res: Response): Promise<void> => {
    const operator = req.query.operator as string | undefined;
    const routes = await this.service.getRepo().getBusRoutes({ operator });
    res.status(200).json({ success: true, items: routes });
  };

  createAdminBusRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const route = await this.service.getRepo().createBusRoute(req.body);

      await writeAudit({
        adminId,
        action: 'transport.bus_route.create',
        entityType: 'bus_route',
        entityId: route.id,
        oldValue: null,
        newValue: route,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Added new bus route',
      });

      res.status(201).json({ success: true, item: route });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };

  updateAdminBusRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const existing = await this.service.getRepo().getBusRouteById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Bus route not found' } });
        return;
      }

      const updated = await this.service.getRepo().updateBusRoute(id, req.body);
      await writeAudit({
        adminId,
        action: 'transport.bus_route.update',
        entityType: 'bus_route',
        entityId: id,
        oldValue: existing,
        newValue: updated,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Updated bus route details',
      });

      res.status(200).json({ success: true, item: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };

  deleteAdminBusRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const existing = await this.service.getRepo().getBusRouteById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Bus route not found' } });
        return;
      }

      await this.service.getRepo().deleteBusRoute(id);
      await writeAudit({
        adminId,
        action: 'transport.bus_route.delete',
        entityType: 'bus_route',
        entityId: id,
        oldValue: existing,
        newValue: null,
        sourceUrl: req.originalUrl,
        reason: req.body?.reason || 'Removed bus route',
      });

      res.status(200).json({ success: true, message: 'Bus route deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  };

  // Special Services
  getAdminSpecialServices = async (req: Request, res: Response): Promise<void> => {
    const services = await this.service.getRepo().getSpecialServices();
    res.status(200).json({ success: true, items: services });
  };

  createAdminSpecialService = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const service = await this.service.getRepo().createSpecialService(req.body);

      await writeAudit({
        adminId,
        action: 'transport.special_service.create',
        entityType: 'bus_special_service',
        entityId: service.id,
        oldValue: null,
        newValue: service,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Published Pushkaralu special bus service',
      });

      res.status(201).json({ success: true, item: service });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };

  updateAdminSpecialService = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const existing = await this.service.getRepo().getSpecialServiceById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Special service not found' } });
        return;
      }

      const updated = await this.service.getRepo().updateSpecialService(id, req.body);
      await writeAudit({
        adminId,
        action: 'transport.special_service.update',
        entityType: 'bus_special_service',
        entityId: id,
        oldValue: existing,
        newValue: updated,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Updated special bus service',
      });

      res.status(200).json({ success: true, item: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };

  deleteAdminSpecialService = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const existing = await this.service.getRepo().getSpecialServiceById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Special service not found' } });
        return;
      }

      await this.service.getRepo().deleteSpecialService(id);
      await writeAudit({
        adminId,
        action: 'transport.special_service.delete',
        entityType: 'bus_special_service',
        entityId: id,
        oldValue: existing,
        newValue: null,
        sourceUrl: req.originalUrl,
        reason: req.body?.reason || 'Deleted special bus service',
      });

      res.status(200).json({ success: true, message: 'Special service deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  };

  // Rail Stations
  getAdminRailStations = async (_req: Request, res: Response): Promise<void> => {
    const stations = await this.service.getRepo().getRailStations();
    res.status(200).json({ success: true, items: stations });
  };

  createAdminRailStation = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const station = await this.service.getRepo().createRailStation(req.body);

      await writeAudit({
        adminId,
        action: 'transport.rail_station.create',
        entityType: 'rail_station',
        entityId: station.id,
        oldValue: null,
        newValue: station,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Added railway station info',
      });

      res.status(201).json({ success: true, item: station });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };

  updateAdminRailStation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const existing = await this.service.getRepo().getRailStationById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Rail station not found' } });
        return;
      }

      const updated = await this.service.getRepo().updateRailStation(id, req.body);
      await writeAudit({
        adminId,
        action: 'transport.rail_station.update',
        entityType: 'rail_station',
        entityId: id,
        oldValue: existing,
        newValue: updated,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Updated railway station details',
      });

      res.status(200).json({ success: true, item: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };

  deleteAdminRailStation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const existing = await this.service.getRepo().getRailStationById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Rail station not found' } });
        return;
      }

      await this.service.getRepo().deleteRailStation(id);
      await writeAudit({
        adminId,
        action: 'transport.rail_station.delete',
        entityType: 'rail_station',
        entityId: id,
        oldValue: existing,
        newValue: null,
        sourceUrl: req.originalUrl,
        reason: req.body?.reason || 'Removed railway station',
      });

      res.status(200).json({ success: true, message: 'Rail station deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  };

  // Shuttle Routes & Stops
  getAdminShuttleRoutes = async (req: Request, res: Response): Promise<void> => {
    const ghatId = req.query.ghat_id as string | undefined;
    const routes = await this.service.getRepo().getShuttleRoutes({ destination_ghat_id: ghatId });
    res.status(200).json({ success: true, items: routes });
  };

  createAdminShuttleRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const route = await this.service.getRepo().createShuttleRoute(req.body);

      await writeAudit({
        adminId,
        action: 'transport.shuttle_route.create',
        entityType: 'shuttle_route',
        entityId: route.id,
        oldValue: null,
        newValue: route,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Created new Pushkaralu free shuttle route',
      });

      res.status(201).json({ success: true, item: route });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };

  updateAdminShuttleRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const existing = await this.service.getRepo().getShuttleRouteById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Shuttle route not found' } });
        return;
      }

      const updated = await this.service.getRepo().updateShuttleRoute(id, req.body);
      await writeAudit({
        adminId,
        action: 'transport.shuttle_route.update',
        entityType: 'shuttle_route',
        entityId: id,
        oldValue: existing,
        newValue: updated,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Updated shuttle route frequency/hours',
      });

      res.status(200).json({ success: true, item: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };

  deleteAdminShuttleRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const existing = await this.service.getRepo().getShuttleRouteById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'Shuttle route not found' } });
        return;
      }

      await this.service.getRepo().deleteShuttleRoute(id);
      await writeAudit({
        adminId,
        action: 'transport.shuttle_route.delete',
        entityType: 'shuttle_route',
        entityId: id,
        oldValue: existing,
        newValue: null,
        sourceUrl: req.originalUrl,
        reason: req.body?.reason || 'Deactivated shuttle route',
      });

      res.status(200).json({ success: true, message: 'Shuttle route deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  };

  addAdminShuttleStop = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const stop = await this.service.getRepo().addShuttleStop(id, req.body);

      await writeAudit({
        adminId,
        action: 'transport.shuttle_stop.create',
        entityType: 'shuttle_stop',
        entityId: stop.id,
        oldValue: null,
        newValue: stop,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Added boarding point to shuttle route',
      });

      res.status(201).json({ success: true, item: stop });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };

  // External Links
  getAdminExternalLinks = async (req: Request, res: Response): Promise<void> => {
    const category = req.query.category as string | undefined;
    const links = await this.service.getRepo().getExternalLinks({ category });
    res.status(200).json({ success: true, items: links });
  };

  updateAdminExternalLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id || (req as any).user?.userId || null;
      const existing = await this.service.getRepo().getExternalLinkById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: { message: 'External link not found' } });
        return;
      }

      const updated = await this.service.getRepo().updateExternalLink(id, req.body);
      await writeAudit({
        adminId,
        action: 'transport.external_link.update',
        entityType: 'external_link',
        entityId: id,
        oldValue: existing,
        newValue: updated,
        sourceUrl: req.originalUrl,
        reason: req.body.reason || 'Updated official external link destination',
      });

      res.status(200).json({ success: true, item: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  };
}

export const transportController = new TransportController();

