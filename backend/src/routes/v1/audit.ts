import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin, can } from '../../middleware/auth.js';
import { query } from '../../db/index.js';
import { AuditLogRecord } from '../../lib/audit.js';

export const auditRouter = Router();

auditRouter.get(
  '/audit-logs',
  requireAuth,
  requireAdmin,
  can('audit.read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const offset = (page - 1) * limit;

      const entity = req.query.entity as string | undefined;
      const admin = req.query.admin as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const date = req.query.date as string | undefined;

      const whereClauses: string[] = [];
      const values: any[] = [];
      let index = 1;

      if (entity) {
        whereClauses.push(`a.entity_type = $${index++}`);
        values.push(entity);
      }

      if (admin) {
        whereClauses.push(`a.admin_id = $${index++}`);
        values.push(admin);
      }

      if (date) {
        whereClauses.push(`DATE(a.created_at) = DATE($${index++})`);
        values.push(date);
      } else {
        if (startDate) {
          whereClauses.push(`a.created_at >= $${index++}`);
          values.push(new Date(startDate));
        }
        if (endDate) {
          whereClauses.push(`a.created_at <= $${index++}`);
          values.push(new Date(endDate));
        }
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count total records
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM audit_logs a ${whereSql}`,
        values
      );
      const total = parseInt(countResult.rows[0]?.count || '0', 10);

      // Fetch paginated records with admin details joined
      const queryValues = [...values, limit, offset];
      const { rows } = await query<AuditLogRecord>(
        `SELECT a.*, u.phone as admin_phone, u.name as admin_name
         FROM audit_logs a
         LEFT JOIN users u ON a.admin_id = u.id
         ${whereSql}
         ORDER BY a.created_at DESC
         LIMIT $${index++} OFFSET $${index++}`,
        queryValues
      );

      res.json({
        items: rows,
        data: rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: err.message || 'Failed to fetch audit logs',
        },
      });
    }
  }
);

