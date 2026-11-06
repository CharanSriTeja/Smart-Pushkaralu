import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../services/token.js';
import { findUserById, isUserAdmin } from '../services/user.js';

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

export function can(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (permission === 'admin' && !req.user.isAdmin) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Administrative privileges required',
        },
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware for guest-friendly endpoints.
 * Populates req.user if valid bearer token is present; proceeds as guest otherwise.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
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
    // Guest fallback, ignore token validation error
  }
  next();
}


