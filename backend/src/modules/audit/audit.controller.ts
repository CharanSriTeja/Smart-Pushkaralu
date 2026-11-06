import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service.js';

export class AuditController {
  /**
   * GET /v1/admin/audit-logs
   * Retrieve audit logs with filters
   */
  static async listLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, entityId, adminId, limit, offset } = req.query;

      const result = await AuditService.getLogs({
        entityType: entityType as string,
        entityId: entityId as string,
        adminId: adminId as string,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      });

      res.json({
        data: result.logs,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  }
}

