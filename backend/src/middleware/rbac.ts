import { Request, Response, NextFunction } from 'express';
import { query } from '../db/index.js';

export interface AdminRoleRecord {
  id: string;
  user_id: string;
  role: string;
  permissions: string[];
}

/**
 * Checks if the authenticated user possesses the specific permission by name.
 * Supports super_admin with wildcard permissions ["*"] or role-based named permissions.
 */
export async function verifyUserPermission(userId: string, permissionName: string): Promise<boolean> {
  const { rows } = await query<AdminRoleRecord>(
    'SELECT * FROM admins WHERE user_id = $1 LIMIT 1',
    [userId]
  );

  if (rows.length === 0) {
    return false;
  }

  const admin = rows[0];

  // Super admin always has all permissions
  if (admin.role === 'super_admin') {
    return true;
  }

  const perms = Array.isArray(admin.permissions) ? admin.permissions : [];
  if (perms.includes('*') || perms.includes(permissionName)) {
    return true;
  }

  // Support domain wildcard, e.g. "ghats.*" matches "ghats.update"
  const domain = permissionName.split('.')[0];
  if (domain && perms.includes(`${domain}.*`)) {
    return true;
  }

  return false;
}

/**
 * Express middleware to enforce named permission check.
 * Example: checkPermission('ghats.manage'), checkPermission('notices.publish')
 */
export function checkPermission(permissionName: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication is required to perform this action',
        },
      });
      return;
    }

    // If user is flagged as admin via phone allowlist or super_admin, permit
    if (req.user.isAdmin) {
      // In current setup, allowlisted admin has full super_admin access
      next();
      return;
    }

    try {
      const allowed = await verifyUserPermission(req.user.userId, permissionName);
      if (!allowed) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Permission '${permissionName}' is required for this operation.`,
          },
        });
        return;
      }

      next();
    } catch (err: any) {
      next(err);
    }
  };
}

