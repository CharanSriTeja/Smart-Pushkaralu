import { Request, Response, NextFunction } from 'express';
import { query } from '../../db/index.js';
import { GhatFacility } from '../../types/ghats.js';
import { AuditService } from '../audit/audit.service.js';

export class FacilitiesController {
  /**
   * GET /v1/ghats/:id/facilities
   * Public list of facilities available at a specific ghat
   */
  static async getGhatFacilities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { rows } = await query<GhatFacility>(
        'SELECT * FROM ghat_facilities WHERE ghat_id = $1 ORDER BY facility_type ASC, updated_at DESC',
        [id]
      );

      res.status(200).json({ data: rows, total: rows.length });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /v1/admin/ghats/:id/facilities
   * Add a new facility entry to a ghat with mandatory audit logging
   */
  static async addFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: ghatId } = req.params;
      const { facility_type, details, is_operational, count, source_url, audit_reason } = req.body;

      if (!facility_type || !details) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'facility_type and details { en, te, hi } are required.',
          },
        });
        return;
      }

      if (!audit_reason || audit_reason.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'AUDIT_REASON_REQUIRED',
            message: 'An audit reason is strictly required for administrative modifications.',
          },
        });
        return;
      }

      const adminUser = {
        userId: (req as any).user?.userId || 'unknown-admin',
        phone: (req as any).user?.phone,
      };

      const ipAddress = req.ip || req.socket.remoteAddress;

      const { rows } = await query<GhatFacility>(
        `INSERT INTO ghat_facilities (
          ghat_id, facility_type, details, is_operational, count, source_url, last_verified_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          ghatId,
          facility_type,
          JSON.stringify(details),
          is_operational !== undefined ? Boolean(is_operational) : true,
          count !== undefined ? parseInt(count, 10) : 1,
          source_url || null,
        ]
      );

      const created = rows[0];

      await AuditService.record({
        adminId: adminUser.userId,
        adminEmail: adminUser.phone || 'admin',
        action: 'facility.create',
        entityType: 'ghat_facility',
        entityId: created.id,
        oldValues: null,
        newValues: created,
        sourceUrl: source_url || null,
        reason: audit_reason.trim(),
        ipAddress,
      });

      res.status(201).json({
        data: created,
        message: 'Ghat facility added and audit logged successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /v1/admin/ghats/:ghatId/facilities/:facilityId
   * Update facility operational status, details or count with mandatory audit logging
   */
  static async updateFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ghatId, facilityId } = req.params;
      const { is_operational, count, details, source_url, audit_reason } = req.body;

      if (!audit_reason || audit_reason.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'AUDIT_REASON_REQUIRED',
            message: 'An audit reason is strictly required for administrative modifications.',
          },
        });
        return;
      }

      const { rows: existingRows } = await query<GhatFacility>(
        'SELECT * FROM ghat_facilities WHERE id = $1 AND ghat_id = $2 LIMIT 1',
        [facilityId, ghatId]
      );

      if (existingRows.length === 0) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Facility not found for this ghat.',
          },
        });
        return;
      }

      const oldRecord = existingRows[0];
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (is_operational !== undefined) {
        updates.push(`is_operational = $${idx++}`);
        values.push(Boolean(is_operational));
      }
      if (count !== undefined) {
        updates.push(`count = $${idx++}`);
        values.push(parseInt(count, 10));
      }
      if (details !== undefined) {
        updates.push(`details = $${idx++}`);
        values.push(JSON.stringify(details));
      }
      if (source_url !== undefined) {
        updates.push(`source_url = $${idx++}`);
        values.push(source_url || null);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      updates.push(`last_verified_at = CURRENT_TIMESTAMP`);

      values.push(facilityId);
      const idIdx = idx++;

      const { rows } = await query<GhatFacility>(
        `UPDATE ghat_facilities
         SET ${updates.join(', ')}
         WHERE id = $${idIdx}
         RETURNING *`,
        values
      );

      const updatedRecord = rows[0];

      const adminUser = {
        userId: (req as any).user?.userId || 'unknown-admin',
        phone: (req as any).user?.phone,
      };

      const ipAddress = req.ip || req.socket.remoteAddress;

      await AuditService.record({
        adminId: adminUser.userId,
        adminEmail: adminUser.phone || 'admin',
        action: 'facility.update',
        entityType: 'ghat_facility',
        entityId: facilityId as string,
        oldValues: oldRecord,
        newValues: updatedRecord,
        sourceUrl: source_url || updatedRecord.source_url || null,
        reason: audit_reason.trim(),
        ipAddress,
      });

      res.status(200).json({
        data: updatedRecord,
        message: 'Ghat facility updated and audit logged successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /v1/admin/ghats/:ghatId/facilities/:facilityId
   * Remove a facility from a ghat with audit logging
   */
  static async deleteFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ghatId, facilityId } = req.params;
      const auditReason = req.body?.audit_reason || req.query?.audit_reason;

      if (!auditReason || String(auditReason).trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'AUDIT_REASON_REQUIRED',
            message: 'An audit reason is strictly required for administrative deletions.',
          },
        });
        return;
      }

      const { rows: existingRows } = await query<GhatFacility>(
        'SELECT * FROM ghat_facilities WHERE id = $1 AND ghat_id = $2 LIMIT 1',
        [facilityId, ghatId]
      );

      if (existingRows.length === 0) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Facility not found for this ghat.',
          },
        });
        return;
      }

      await query('DELETE FROM ghat_facilities WHERE id = $1', [facilityId]);

      const adminUser = {
        userId: (req as any).user?.userId || 'unknown-admin',
        phone: (req as any).user?.phone,
      };

      const ipAddress = req.ip || req.socket.remoteAddress;

      await AuditService.record({
        adminId: adminUser.userId,
        adminEmail: adminUser.phone || 'admin',
        action: 'facility.delete',
        entityType: 'ghat_facility',
        entityId: facilityId as string,
        oldValues: existingRows[0],
        newValues: null,
        sourceUrl: existingRows[0].source_url || null,
        reason: String(auditReason).trim(),
        ipAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Facility removed and audit logged successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

