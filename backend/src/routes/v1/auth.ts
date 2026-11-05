import { Router } from 'express';
import { z } from 'zod';
import { verifyFirebaseIdToken } from '../../services/firebase.js';
import {
  findOrCreateUser,
  findUserById,
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  isUserAdmin,
} from '../../services/user.js';
import {
  signAccessToken,
  generateRefreshTokenString,
  hashToken,
  getRefreshTokenExpiryDate,
} from '../../services/token.js';
import { authLimiter } from '../../middleware/rate-limiter.js';

export const authRouter = Router();

const firebaseAuthSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
  name: z.string().trim().max(100).optional(),
  language: z.enum(['en', 'te', 'hi']).optional(),
  consentVersion: z.string().max(50).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

authRouter.use(authLimiter);

// POST /v1/auth/firebase
authRouter.post('/firebase', async (req, res, next) => {
  try {
    const data = firebaseAuthSchema.parse(req.body);

    let firebaseUid: string;
    let phone: string | undefined;

    // Support development tokens for Web browser test suites and local testing
    if (process.env.NODE_ENV !== 'production' && data.idToken.startsWith('test-id-token:')) {
      phone = data.idToken.replace('test-id-token:', '');
      firebaseUid = 'dev-uid-' + phone.replace(/\D/g, '');
    } else {
      let decoded;
      try {
        decoded = await verifyFirebaseIdToken(data.idToken);
      } catch (err: any) {
        res.status(401).json({
          error: {
            code: 'FIREBASE_AUTH_FAILED',
            message: 'Unable to verify Firebase token: ' + (err.message || 'invalid token'),
          },
        });
        return;
      }
      firebaseUid = decoded.uid;
      phone = decoded.phone_number;
    }

    if (!phone) {
      res.status(400).json({
        error: {
          code: 'PHONE_NUMBER_REQUIRED',
          message: 'Verified phone number not found in Firebase token',
        },
      });
      return;
    }

    const { user, isNewUser } = await findOrCreateUser({
      firebaseUid,
      phone,
      name: data.name,
      language: data.language,
      consentVersion: data.consentVersion,
    });

    const isAdmin = await isUserAdmin(user.id, user.phone);

    // Create token pair
    const accessToken = signAccessToken({
      userId: user.id,
      phone: user.phone,
      firebaseUid: user.firebase_uid,
      isAdmin,
    });

    const refreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = getRefreshTokenExpiryDate();

    await storeRefreshToken(user.id, tokenHash, expiresAt);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        language: user.language,
        status: user.status,
        consentVersion: user.consent_version,
        consentAt: user.consent_at,
        isAdmin,
      },
      isNewUser,
    });
  } catch (error) {
    next(error);
  }
});

// POST /v1/auth/refresh
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokenHash = hashToken(refreshToken);

    const tokenRecord = await findRefreshToken(tokenHash);

    if (!tokenRecord) {
      res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token does not exist',
        },
      });
      return;
    }

    if (tokenRecord.revoked_at !== null) {
      res.status(401).json({
        error: {
          code: 'REVOKED_REFRESH_TOKEN',
          message: 'Refresh token has already been revoked',
        },
      });
      return;
    }

    const now = new Date();
    if (new Date(tokenRecord.expires_at) <= now) {
      res.status(401).json({
        error: {
          code: 'EXPIRED_REFRESH_TOKEN',
          message: 'Refresh token has expired',
        },
      });
      return;
    }

    // Revoke old refresh token (Token Rotation)
    await revokeRefreshToken(tokenHash);

    // Look up user
    const user = await findUserById(tokenRecord.user_id);
    if (!user || user.status !== 'active') {
      res.status(401).json({
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive or not found',
        },
      });
      return;
    }

    const isAdmin = await isUserAdmin(user.id, user.phone);

    // Issue new pair
    const newAccessToken = signAccessToken({
      userId: user.id,
      phone: user.phone,
      firebaseUid: user.firebase_uid,
      isAdmin,
    });

    const newRefreshToken = generateRefreshTokenString();
    const newTokenHash = hashToken(newRefreshToken);
    const newExpiresAt = getRefreshTokenExpiryDate();

    await storeRefreshToken(user.id, newTokenHash, newExpiresAt);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// POST /v1/auth/logout
authRouter.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = logoutSchema.parse(req.body);

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await revokeRefreshToken(tokenHash);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});
