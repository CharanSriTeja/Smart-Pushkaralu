import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireAdmin, can } from '../../middleware/auth.js';
import { SosService } from '../../modules/sos/sos.service.js';
import { query } from '../../db/index.js';
import { writeAudit } from '../../lib/audit.js';
import { QrZoneRecord, EmergencyContactRecord } from '../../types/sos.js';

export const adminSosRouter = Router();

// All admin SOS routes require authentication and admin privileges
adminSosRouter.use(requireAuth, requireAdmin);

/**
 * List SOS alerts
 */
adminSosRouter.get(
  ['/', '/alerts'],
  can('sos.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, type, ghatId, page, limit } = req.query;
      const result = await SosService.getAdminAlerts({
        status: status as string,
        type: type as string,
        ghatId: ghatId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.json({
        success: true,
        data: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Get single SOS alert with full update history & duplicates
 */
adminSosRouter.get(
  ['/:id', '/alerts/:id'],
  can('sos.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (id === 'zones' || id === 'contacts' || id === 'merge') {
        next();
        return;
      }
      const result = await SosService.getAdminAlertById(id);

      if (!result) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'SOS alert not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Update SOS alert status (Acknowledge, Dispatch, Resolve, False Alarm)
 */
adminSosRouter.patch(
  ['/:id/status', '/alerts/:id/status'],
  can('sos.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status, note, isPublic = true } = req.body;

      if (!status || !note) {
        res.status(400).json({
          error: {
            code: 'MISSING_FIELDS',
            message: 'Status and note are required',
          },
        });
        return;
      }

      const updated = await SosService.updateStatus({
        alertId: id,
        adminId: req.user!.userId,
        status,
        note,
        isPublic,
      });

      if (!updated) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'SOS alert not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: updated,
        message: `Alert status updated to ${status}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Assign responder or field team
 */
adminSosRouter.post(
  ['/:id/assign', '/alerts/:id/assign'],
  can('sos.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { assignedToName, assignedToPhone, note } = req.body;

      if (!assignedToName) {
        res.status(400).json({
          error: {
            code: 'MISSING_FIELDS',
            message: 'Responder name is required',
          },
        });
        return;
      }

      const updated = await SosService.assignResponder({
        alertId: id,
        adminId: req.user!.userId,
        assignedToName,
        assignedToPhone,
        note,
      });

      if (!updated) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'SOS alert not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: updated,
        message: 'Responder assigned successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Add note (public or internal)
 */
adminSosRouter.post(
  ['/:id/notes', '/alerts/:id/notes'],
  can('sos.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { note, isPublic = false } = req.body;

      if (!note) {
        res.status(400).json({
          error: {
            code: 'MISSING_FIELDS',
            message: 'Note content is required',
          },
        });
        return;
      }

      const updateRecord = await SosService.addNote({
        alertId: id,
        adminId: req.user!.userId,
        note,
        isPublic,
      });

      res.status(201).json({
        success: true,
        data: updateRecord,
        message: 'Note added successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Merge duplicate alerts
 */
adminSosRouter.post(
  '/merge',
  can('sos.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sourceAlertId, targetAlertId, reason } = req.body;

      if (!sourceAlertId || !targetAlertId || !reason) {
        res.status(400).json({
          error: {
            code: 'MISSING_FIELDS',
            message: 'sourceAlertId, targetAlertId, and reason are required',
          },
        });
        return;
      }

      if (sourceAlertId === targetAlertId) {
        res.status(400).json({
          error: {
            code: 'INVALID_MERGE',
            message: 'Cannot merge an alert into itself',
          },
        });
        return;
      }

      await SosService.mergeAlerts({
        sourceAlertId,
        targetAlertId,
        adminId: req.user!.userId,
        reason,
      });

      res.json({
        success: true,
        message: 'Alerts merged successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Generate printable QR Poster for a zone
 */
adminSosRouter.get(
  '/zones/:zoneCode/poster',
  can('sos.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zoneCode = req.params.zoneCode as string;
      const html = await SosService.generatePosterHtml(zoneCode);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err: any) {
      res.status(404).send(`<h1>Error</h1><p>${err.message}</p>`);
    }
  }
);

/**
 * QR Zones Management
 */
adminSosRouter.get(
  '/zones',
  can('sos.read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rows } = await query<QrZoneRecord>(
        `SELECT z.*, g.name as ghat_name
         FROM qr_zones z
         LEFT JOIN ghats g ON z.ghat_id = g.id
         ORDER BY z.created_at DESC`
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }
);

adminSosRouter.post(
  '/zones',
  can('sos.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { zoneCode, label, ghatId, lat, lng } = req.body;
      if (!zoneCode || !label) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'zoneCode and label required' } });
        return;
      }

      const { rows } = await query<QrZoneRecord>(
        `INSERT INTO qr_zones (zone_code, label, ghat_id, lat, lng, active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
        [zoneCode.trim().toUpperCase(), JSON.stringify(label), ghatId || null, lat || null, lng || null]
      );

      await writeAudit({
        adminId: req.user!.userId,
        action: 'qr_zones.create',
        entityType: 'qr_zones',
        entityId: rows[0].id,
        newValue: rows[0],
      });

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err: any) {
      if (err.code === '23505') {
        res.status(409).json({ error: { code: 'DUPLICATE_ZONE', message: 'Zone code already exists' } });
        return;
      }
      next(err);
    }
  }
);

adminSosRouter.patch(
  '/zones/:id',
  can('sos.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { label, ghatId, lat, lng, active } = req.body;

      const { rows: current } = await query<QrZoneRecord>('SELECT * FROM qr_zones WHERE id = $1', [id]);
      if (current.length === 0) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Zone not found' } });
        return;
      }

      const updatedLabel = label !== undefined ? JSON.stringify(label) : JSON.stringify(current[0].label);
      const updatedGhatId = ghatId !== undefined ? ghatId : current[0].ghat_id;
      const updatedLat = lat !== undefined ? lat : current[0].lat;
      const updatedLng = lng !== undefined ? lng : current[0].lng;
      const updatedActive = active !== undefined ? active : current[0].active;

      const { rows } = await query<QrZoneRecord>(
        `UPDATE qr_zones
         SET label = $1, ghat_id = $2, lat = $3, lng = $4, active = $5
         WHERE id = $6
         RETURNING *`,
        [updatedLabel, updatedGhatId, updatedLat, updatedLng, updatedActive, id]
      );

      await writeAudit({
        adminId: req.user!.userId,
        action: 'qr_zones.update',
        entityType: 'qr_zones',
        entityId: id,
        oldValue: current[0],
        newValue: rows[0],
      });

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Emergency Contacts Management
 */
adminSosRouter.get(
  '/contacts',
  can('sos.read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rows } = await query<EmergencyContactRecord>(
        `SELECT c.*, g.name as ghat_name
         FROM emergency_contacts c
         LEFT JOIN ghats g ON c.ghat_id = g.id
         ORDER BY c.sort_order ASC, c.created_at ASC`
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  }
);

adminSosRouter.post(
  '/contacts',
  can('sos.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { label, phone, kind, ghatId, sortOrder } = req.body;
      if (!label || !phone || !kind) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'label, phone, and kind are required' } });
        return;
      }

      const { rows } = await query<EmergencyContactRecord>(
        `INSERT INTO emergency_contacts (label, phone, kind, ghat_id, sort_order, active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
        [JSON.stringify(label), phone, kind, ghatId || null, sortOrder || 0]
      );

      await writeAudit({
        adminId: req.user!.userId,
        action: 'emergency_contacts.create',
        entityType: 'emergency_contacts',
        entityId: rows[0].id,
        newValue: rows[0],
      });

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

adminSosRouter.patch(
  '/contacts/:id',
  can('sos.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { label, phone, kind, ghatId, sortOrder, active } = req.body;

      const { rows: current } = await query<EmergencyContactRecord>(
        'SELECT * FROM emergency_contacts WHERE id = $1',
        [id]
      );
      if (current.length === 0) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Emergency contact not found' } });
        return;
      }

      const updatedLabel = label !== undefined ? JSON.stringify(label) : JSON.stringify(current[0].label);
      const updatedPhone = phone !== undefined ? phone : current[0].phone;
      const updatedKind = kind !== undefined ? kind : current[0].kind;
      const updatedGhatId = ghatId !== undefined ? ghatId : current[0].ghat_id;
      const updatedSortOrder = sortOrder !== undefined ? sortOrder : current[0].sort_order;
      const updatedActive = active !== undefined ? active : current[0].active;

      const { rows } = await query<EmergencyContactRecord>(
        `UPDATE emergency_contacts
         SET label = $1, phone = $2, kind = $3, ghat_id = $4, sort_order = $5, active = $6
         WHERE id = $7
         RETURNING *`,
        [updatedLabel, updatedPhone, updatedKind, updatedGhatId, updatedSortOrder, updatedActive, id]
      );

      await writeAudit({
        adminId: req.user!.userId,
        action: 'emergency_contacts.update',
        entityType: 'emergency_contacts',
        entityId: id,
        oldValue: current[0],
        newValue: rows[0],
      });

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

adminSosRouter.delete(
  '/contacts/:id',
  can('sos.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { rows } = await query<EmergencyContactRecord>(
        `UPDATE emergency_contacts SET active = false WHERE id = $1 RETURNING *`,
        [id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Contact not found' } });
        return;
      }

      await writeAudit({
        adminId: req.user!.userId,
        action: 'emergency_contacts.deactivate',
        entityType: 'emergency_contacts',
        entityId: id,
      });

      res.json({ success: true, message: 'Contact deactivated successfully' });
    } catch (err) {
      next(err);
    }
  }
);

