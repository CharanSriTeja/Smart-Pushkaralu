import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PlacesService } from './places.service.js';
import { PlacesRepository } from './places.repository.js';
import { PlacesApiService } from '../../services/places-api.service.js';
import { AuditService } from '../audit/audit.service.js';
import { QueryPlaceType } from '../../types/places.js';

// Zod schemas
const localizedTextSchema = z.object({
  en: z.string().min(1, 'English text is required'),
  te: z.string().optional(),
  hi: z.string().optional(),
});

const hotelSchema = z.object({
  name: localizedTextSchema,
  description: localizedTextSchema.optional(),
  address: localizedTextSchema.optional(),
  phone: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  rating: z.coerce.number().min(0).max(5).optional(),
  price_range: z.enum(['budget', 'mid_range', 'luxury', 'dharamshala', 'free']).optional(),
  room_types: z.array(z.string()).optional(),
  photo_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  is_verified: z.boolean().default(true),
  is_hidden: z.boolean().default(false),
  source_url: z.string().optional(),
  reason: z.string().min(3, 'Audit reason is required for administrative modifications'),
});

const templeSchema = z.object({
  name: localizedTextSchema,
  description: localizedTextSchema.optional(),
  address: localizedTextSchema.optional(),
  phone: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  deity: localizedTextSchema.optional(),
  darshan_timings: localizedTextSchema.optional(),
  special_entry_info: localizedTextSchema.optional(),
  photo_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  is_verified: z.boolean().default(true),
  is_hidden: z.boolean().default(false),
  source_url: z.string().optional(),
  reason: z.string().min(3, 'Audit reason is required for administrative modifications'),
});

const transportHubSchema = z.object({
  name: localizedTextSchema,
  description: localizedTextSchema.optional(),
  hub_type: z.enum(['railway_station', 'bus_stand', 'airport', 'boat_point', 'auto_stand', 'parking']),
  address: localizedTextSchema.optional(),
  phone: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  operating_hours: localizedTextSchema.optional(),
  is_hidden: z.boolean().default(false),
  source_url: z.string().optional(),
  reason: z.string().min(3, 'Audit reason is required for administrative modifications'),
});

const overrideSchema = z.object({
  place_id: z.string().min(1, 'Place ID is required'),
  name_override: localizedTextSchema.optional(),
  phone_override: z.string().optional(),
  address_override: localizedTextSchema.optional(),
  custom_notes: localizedTextSchema.optional(),
  is_hidden: z.boolean().default(false),
  reason: z.string().min(3, 'Audit reason is required for administrative modifications'),
});

export class PlacesController {
  /**
   * GET /v1/ghats/:id/nearby
   * Public endpoint with type and radius (1, 3, 5, 10 km).
   * Serves from cache; if expired, serves stale data and triggers background refresh.
   */
  public static async getNearby(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const type = (req.query.type as QueryPlaceType) || 'all';
      const radius = req.query.radius ? parseInt(String(req.query.radius), 10) : 3;

      const result = await PlacesService.getNearbyPlaces(id as string, type, radius);

      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // ================= ADMIN CURATED PLACES =================

  public static async listCurated(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const curated = await PlacesRepository.listAllCuratedPlaces();
      res.status(200).json({ data: curated });
    } catch (err) {
      next(err);
    }
  }

  public static async createHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = hotelSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid hotel payload',
          },
        });
        return;
      }

      const { reason, ...hotelData } = parseResult.data;
      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const created = await PlacesRepository.createHotel(hotelData as any);

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'CREATE_CURATED_HOTEL',
        entityType: 'hotel',
        entityId: created.id,
        newValues: created,
        reason,
        ipAddress: ip,
        sourceUrl: hotelData.source_url,
      });

      res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  }

  public static async updateHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reason = req.body.reason;
      if (!reason || String(reason).trim().length < 3) {
        res.status(400).json({
          error: {
            code: 'AUDIT_REASON_REQUIRED',
            message: 'Audit reason is required for updating curated hotel',
          },
        });
        return;
      }

      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const updated = await PlacesRepository.updateHotel(id as string, req.body);
      if (!updated) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hotel not found' } });
        return;
      }

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'UPDATE_CURATED_HOTEL',
        entityType: 'hotel',
        entityId: id as string,
        newValues: updated,
        reason,
        ipAddress: ip,
        sourceUrl: updated.source_url,
      });

      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reason = (req.body.reason || req.query.reason || 'Deleted by admin') as string;
      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const deleted = await PlacesRepository.deleteHotel(id as string);
      if (!deleted) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hotel not found' } });
        return;
      }

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'DELETE_CURATED_HOTEL',
        entityType: 'hotel',
        entityId: id as string,
        reason,
        ipAddress: ip,
      });

      res.status(200).json({ success: true, message: 'Hotel deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // --- Temples ---
  public static async createTemple(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = templeSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid temple payload',
          },
        });
        return;
      }

      const { reason, ...templeData } = parseResult.data;
      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const created = await PlacesRepository.createTemple(templeData as any);

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'CREATE_CURATED_TEMPLE',
        entityType: 'temple',
        entityId: created.id,
        newValues: created,
        reason,
        ipAddress: ip,
        sourceUrl: templeData.source_url,
      });

      res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  }

  public static async updateTemple(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reason = req.body.reason;
      if (!reason || String(reason).trim().length < 3) {
        res.status(400).json({
          error: {
            code: 'AUDIT_REASON_REQUIRED',
            message: 'Audit reason is required for updating curated temple',
          },
        });
        return;
      }

      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const updated = await PlacesRepository.updateTemple(id as string, req.body);
      if (!updated) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Temple not found' } });
        return;
      }

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'UPDATE_CURATED_TEMPLE',
        entityType: 'temple',
        entityId: id as string,
        newValues: updated,
        reason,
        ipAddress: ip,
        sourceUrl: updated.source_url,
      });

      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteTemple(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reason = (req.body.reason || req.query.reason || 'Deleted by admin') as string;
      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const deleted = await PlacesRepository.deleteTemple(id as string);
      if (!deleted) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Temple not found' } });
        return;
      }

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'DELETE_CURATED_TEMPLE',
        entityType: 'temple',
        entityId: id as string,
        reason,
        ipAddress: ip,
      });

      res.status(200).json({ success: true, message: 'Temple deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // --- Transport Hubs ---
  public static async createTransportHub(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = transportHubSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid transport hub payload',
          },
        });
        return;
      }

      const { reason, ...hubData } = parseResult.data;
      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const created = await PlacesRepository.createTransportHub(hubData as any);

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'CREATE_CURATED_TRANSPORT_HUB',
        entityType: 'transport_hub',
        entityId: created.id,
        newValues: created,
        reason,
        ipAddress: ip,
        sourceUrl: hubData.source_url,
      });

      res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  }

  public static async updateTransportHub(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reason = req.body.reason;
      if (!reason || String(reason).trim().length < 3) {
        res.status(400).json({
          error: {
            code: 'AUDIT_REASON_REQUIRED',
            message: 'Audit reason is required for updating transport hub',
          },
        });
        return;
      }

      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const updated = await PlacesRepository.updateTransportHub(id as string, req.body);
      if (!updated) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Transport hub not found' } });
        return;
      }

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'UPDATE_CURATED_TRANSPORT_HUB',
        entityType: 'transport_hub',
        entityId: id as string,
        newValues: updated,
        reason,
        ipAddress: ip,
        sourceUrl: updated.source_url,
      });

      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteTransportHub(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reason = (req.body.reason || req.query.reason || 'Deleted by admin') as string;
      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const deleted = await PlacesRepository.deleteTransportHub(id as string);
      if (!deleted) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Transport hub not found' } });
        return;
      }

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'DELETE_CURATED_TRANSPORT_HUB',
        entityType: 'transport_hub',
        entityId: id as string,
        reason,
        ipAddress: ip,
      });

      res.status(200).json({ success: true, message: 'Transport hub deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // --- Place Overrides ---
  public static async listOverrides(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overrides = await PlacesRepository.listOverrides();
      res.status(200).json({ data: overrides });
    } catch (err) {
      next(err);
    }
  }

  public static async upsertOverride(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = overrideSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid override payload',
          },
        });
        return;
      }

      const { reason, ...overrideData } = parseResult.data;
      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const record = await PlacesRepository.upsertOverride({
        ...overrideData,
        verified_by_admin_id: admin?.userId || 'unknown-admin',
      });

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'UPSERT_PLACE_OVERRIDE',
        entityType: 'place_override',
        entityId: record.id,
        newValues: record,
        reason,
        ipAddress: ip,
      });

      res.status(200).json({ data: record });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteOverride(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reason = (req.body.reason || req.query.reason || 'Deleted by admin') as string;
      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const deleted = await PlacesRepository.deleteOverride(id as string);
      if (!deleted) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Override not found' } });
        return;
      }

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'DELETE_PLACE_OVERRIDE',
        entityType: 'place_override',
        entityId: id as string,
        reason,
        ipAddress: ip,
      });

      res.status(200).json({ success: true, message: 'Override deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // --- Cache Status & Pre-warm ---
  public static async getCacheStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entries = await PlacesRepository.getCacheStatusList();
      const usage = await PlacesApiService.getDailyUsageStats();

      res.status(200).json({
        data: {
          cache_entries: entries,
          usage_stats: usage,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async prewarmCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;
      const reason = (req.body.reason || 'Manual cache pre-warm triggered from admin panel') as string;

      const stats = await PlacesService.prewarmPublishedGhats();

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'PREWARM_NEARBY_PLACES_CACHE',
        entityType: 'places_cache',
        entityId: 'all_published_ghats',
        newValues: stats,
        reason,
        ipAddress: ip,
      });

      res.status(200).json({
        success: true,
        message: 'Cache pre-warm completed successfully',
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async invalidateCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ghat_id, type, radius_m, reason } = req.body;
      const admin = (req as any).user;
      const ip = req.ip || req.socket.remoteAddress;

      const count = await PlacesRepository.invalidateCache(ghat_id, type, radius_m);

      await AuditService.record({
        adminId: admin?.userId || 'unknown-admin',
        adminEmail: admin?.phone || admin?.email || 'admin@smartpushkaralu.org',
        action: 'INVALIDATE_NEARBY_PLACES_CACHE',
        entityType: 'places_cache',
        entityId: ghat_id || 'all',
        newValues: { invalidated_count: count, ghat_id, type, radius_m },
        reason: reason || 'Cache invalidated by admin',
        ipAddress: ip,
      });

      res.status(200).json({
        success: true,
        message: `Invalidated ${count} cache record(s)`,
        invalidated_count: count,
      });
    } catch (err) {
      next(err);
    }
  }
}
