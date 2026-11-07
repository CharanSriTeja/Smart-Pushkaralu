import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../services/token.js';
import { findUserById, isUserAdmin, userHasPermission } from '../services/user.js';

export interface AuthenticatedUser extends TokenPayload {
  name: string | null;
  language: string;
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization token',
      },
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  // Support local development and staging mock admin token
  if (process.env.NODE_ENV !== 'production' && token === 'dev-admin-token') {
    req.user = {
      userId: 'admin-super-01',
      firebaseUid: 'dev-super-admin-uid',
      phone: '+919999999999',
      isAdmin: true,
      name: 'District Collector (Super Admin)',
      language: 'en',
      status: 'active',
    };
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await findUserById(payload.userId);

    if (!user || user.status !== 'active') {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User account is inactive or not found',
        },
      });
      return;
    }

    const isAdmin = await isUserAdmin(user.id, user.phone);

    req.user = {
      userId: user.id,
      firebaseUid: user.firebase_uid,
      phone: user.phone,
      isAdmin,
      name: user.name,
      language: user.language,
      status: user.status,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        },
      });
      return;
    }

    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid access token',
      },
    });
  }
}

/**
 * Optional auth middleware: populates req.user if a valid Bearer token is provided,
 * but does not reject the request if no token is present.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7).trim();

  if (process.env.NODE_ENV !== 'production' && token === 'dev-admin-token') {
    req.user = {
      userId: 'admin-super-01',
      firebaseUid: 'dev-super-admin-uid',
      phone: '+919999999999',
      isAdmin: true,
      name: 'District Collector (Super Admin)',
      language: 'en',
      status: 'active',
    };
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await findUserById(payload.userId);
    if (user && user.status === 'active') {
      const isAdmin = await isUserAdmin(user.id, user.phone);
      req.user = {
        userId: user.id,
        firebaseUid: user.firebase_uid,
        phone: user.phone,
        isAdmin,
        name: user.name,
        language: user.language,
        status: user.status,
      };
    }
  } catch {
    // Ignore invalid tokens in optional auth
  }
  next();
}

/**
 * Requires the user to have admin status.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (!req.user.isAdmin) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Administrative privileges required',
      },
    });
    return;
  }

  next();
}

/**
 * Requires the authenticated admin to hold a specific permission (e.g. 'settings.write', 'audit.read').
 * Super admins automatically have all permissions.
 */
export function can(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    try {
      const allowed = await userHasPermission(
        req.user.userId,
        req.user.phone,
        permission
      );

      if (!allowed) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Permission denied: ${permission}`,
          },
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}




