import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { updateUser, deleteUser, findUserById } from '../../services/user.js';

export const userRouter = Router();

userRouter.use('/me', requireAuth);

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  language: z.enum(['en', 'te', 'hi']).optional(),
  consentVersion: z.string().max(50).optional(),
});

// GET /v1/me
userRouter.get('/me', async (req, res, next) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
        },
      });
      return;
    }

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        language: user.language,
        status: user.status,
        consentVersion: user.consent_version,
        consentAt: user.consent_at,
        isAdmin: req.user!.isAdmin,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /v1/me
userRouter.patch('/me', async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const updated = await updateUser(req.user!.userId, data);

    if (!updated) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
        },
      });
      return;
    }

    res.json({
      user: {
        id: updated.id,
        phone: updated.phone,
        name: updated.name,
        language: updated.language,
        status: updated.status,
        consentVersion: updated.consent_version,
        consentAt: updated.consent_at,
        isAdmin: req.user!.isAdmin,
        createdAt: updated.created_at,
        lastLoginAt: updated.last_login_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /v1/me
userRouter.delete('/me', async (req, res, next) => {
  try {
    const deleted = await deleteUser(req.user!.userId);

    if (!deleted) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

