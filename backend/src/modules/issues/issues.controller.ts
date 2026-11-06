import { Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { IssuesService } from './issues.service.js';
import { UploadService } from '../../services/upload.service.js';
import { IssueCategory, IssueStatus, LocationType } from '../../types/issues.js';

// Multer memory storage for direct multipart image uploads
export const multerImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type "${file.mimetype}". Allowed types: JPEG, PNG, WEBP.`));
    }
  },
});

const reportIssueSchema = z.object({
  category: z.enum(['sanitation', 'road', 'water', 'lighting', 'crowd', 'other'] as const),
  description: z.string().min(5, 'Description must be at least 5 characters').max(1000),
  photo_url: z.string().optional().nullable(),
  location_type: z.enum(['gps', 'map_pin', 'qr_zone'] as const).optional().default('gps'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  qr_zone_id: z.string().optional().nullable(),
  ghat_id: z.string().uuid().optional().nullable(),
  reporter_device_token: z.string().optional().nullable(),
  device_fingerprint: z.string().optional().nullable(),
  client_metadata: z.record(z.string(), z.any()).optional().nullable(),
});

const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().positive(),
});

const updateStatusSchema = z.object({
  status: z.enum(['submitted', 'under_review', 'in_progress', 'resolved', 'rejected'] as const),
  reason: z.string().min(3, 'Audit reason is required'),
  public_note: z.string().optional().nullable(),
  internal_note: z.string().optional().nullable(),
  resolution_photo_url: z.string().optional().nullable(),
});

const addUpdateSchema = z.object({
  reason: z.string().min(3, 'Audit reason is required'),
  status: z.enum(['submitted', 'under_review', 'in_progress', 'resolved', 'rejected'] as const).optional(),
  public_note: z.string().optional().nullable(),
  internal_note: z.string().optional().nullable(),
  resolution_photo_url: z.string().optional().nullable(),
});

export class IssuesController {
  /**
   * POST /v1/issues
   * Public grievance report with duplicate detection
   */
  static async reportIssue(req: Request, res: Response): Promise<void> {
    try {
      const parsed = reportIssueSchema.parse(req.body);

      const deviceFingerprint =
        parsed.device_fingerprint ||
        (req.headers['x-device-fingerprint'] as string) ||
        req.ip ||
        'unknown_device';

      const reporter = req.user
        ? { id: req.user.userId, phone: req.user.phone }
        : undefined;

      const result = await IssuesService.reportIssue(
        {
          ...parsed,
          device_fingerprint: deviceFingerprint,
          reporter_device_token: parsed.reporter_device_token || (req.headers['x-device-token'] as string) || null,
        },
        reporter
      );

      const statusCode = result.is_duplicate ? 200 : 201;
      res.status(statusCode).json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: err.issues[0]?.message || 'Invalid issue report payload',
            details: err.issues,
          },
        });
        return;
      }
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: err.message || 'Failed to submit issue report',
        },
      });
    }
  }

  /**
   * GET /v1/issues/mine
   * Lists reports filed by current user or device
   */
  static async getMyIssues(req: Request, res: Response): Promise<void> {
    try {
      const reporterId = req.user?.userId || null;
      const deviceToken = (req.query.device_token as string) || (req.headers['x-device-token'] as string) || null;
      const deviceFingerprint =
        (req.query.device_fingerprint as string) ||
        (req.headers['x-device-fingerprint'] as string) ||
        null;

      if (!reporterId && !deviceToken && !deviceFingerprint) {
        res.status(200).json({ issues: [] });
        return;
      }

      const issues = await IssuesService.getMyIssues({
        reporterId,
        deviceToken,
        deviceFingerprint,
      });

      res.status(200).json({ issues });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: err.message || 'Failed to retrieve reports',
        },
      });
    }
  }

  /**
   * GET /v1/issues/:ticket_no
   * Public tracking endpoint with sanitized timeline
   */
  static async getIssueByTicketNo(req: Request, res: Response): Promise<void> {
    try {
      const ticketNo = req.params.ticket_no;
      if (!ticketNo) {
        res.status(400).json({
          error: { code: 'INVALID_TICKET', message: 'Ticket number is required' },
        });
        return;
      }

      const result = await IssuesService.getIssueByTicketNo(ticketNo);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(404).json({
        error: {
          code: 'ISSUE_NOT_FOUND',
          message: err.message || 'Issue not found',
        },
      });
    }
  }

  /**
   * POST /v1/issues/upload-url
   * Generates signed URL token for client-side direct upload
   */
  static async getSignedUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      const parsed = uploadUrlSchema.parse(req.body);
      const signedData = UploadService.generateSignedUploadUrl({
        filename: parsed.filename,
        mimeType: parsed.mimeType,
        fileSize: parsed.fileSize,
      });

      res.status(200).json(signedData);
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'UPLOAD_URL_ERROR',
          message: err.message || 'Failed to generate signed upload URL',
        },
      });
    }
  }

  /**
   * PUT /v1/issues/upload/storage/:token
   * Uploads binary via signed URL token, validates format, and strips EXIF
   */
  static async handleStorageUpload(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token;
      if (!token) {
        res.status(400).json({ error: { code: 'MISSING_TOKEN', message: 'Upload token required' } });
        return;
      }

      const payload = UploadService.verifyUploadToken(token);

      const buffer = req.body;
      if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
        res.status(400).json({
          error: { code: 'EMPTY_FILE', message: 'Binary image buffer is required' },
        });
        return;
      }

      const saved = await UploadService.processAndSaveImage(buffer, payload.key, payload.mimeType);

      res.status(200).json({
        success: true,
        photo_url: saved.photoUrl,
        key: saved.key,
        size: saved.size,
        format: saved.format,
      });
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'UPLOAD_FAILED',
          message: err.message || 'Image upload processing failed',
        },
      });
    }
  }

  /**
   * POST /v1/issues/upload
   * Direct multipart photo upload with EXIF removal
   */
  static async handleDirectUpload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file || !req.file.buffer) {
        res.status(400).json({
          error: { code: 'FILE_MISSING', message: 'Photo file must be provided under field "photo"' },
        });
        return;
      }

      const saved = await UploadService.processAndSaveImage(
        req.file.buffer,
        undefined,
        req.file.mimetype
      );

      res.status(200).json({
        success: true,
        photo_url: saved.photoUrl,
        key: saved.key,
        size: saved.size,
        format: saved.format,
      });
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'UPLOAD_FAILED',
          message: err.message || 'Image upload failed',
        },
      });
    }
  }

  // --- ADMIN ENDPOINTS ---

  /**
   * GET /v1/admin/issues
   * List all issues with filters
   */
  static async adminListIssues(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as IssueStatus | undefined,
        category: req.query.category as IssueCategory | undefined,
        ghat_id: req.query.ghat_id as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await IssuesService.adminListIssues(filters);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: err.message || 'Failed to list admin issues',
        },
      });
    }
  }

  /**
   * GET /v1/admin/issues/:id
   * Admin issue detail with internal notes and audit history
   */
  static async adminGetIssue(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const result = await IssuesService.adminGetIssue(id);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: err.message || 'Issue not found',
        },
      });
    }
  }

  /**
   * PATCH /v1/admin/issues/:id/status
   * Status change with mandatory audit reason and FCM dispatch
   */
  static async adminUpdateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const parsed = updateStatusSchema.parse(req.body);
      const adminUser = {
        userId: req.user!.userId,
        phone: req.user!.phone,
      };

      const result = await IssuesService.adminUpdateStatus({
        issueId: id,
        newStatus: parsed.status,
        reason: parsed.reason,
        adminUser,
        publicNote: parsed.public_note,
        internalNote: parsed.internal_note,
        resolutionPhotoUrl: parsed.resolution_photo_url,
        ipAddress: req.ip,
      });

      res.status(200).json({
        success: true,
        issue: result.issue,
        update: result.update,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: err.issues[0]?.message || 'Invalid update status payload',
            details: err.issues,
          },
        });
        return;
      }
      res.status(400).json({
        error: {
          code: 'UPDATE_FAILED',
          message: err.message || 'Failed to update issue status',
        },
      });
    }
  }

  /**
   * POST /v1/admin/issues/:id/updates
   * Adds an update to issue with public & internal notes
   */
  static async adminAddUpdate(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const parsed = addUpdateSchema.parse(req.body);
      const adminUser = {
        userId: req.user!.userId,
        phone: req.user!.phone,
      };

      const result = await IssuesService.adminAddTimelineUpdate({
        issueId: id,
        reason: parsed.reason,
        status: parsed.status,
        publicNote: parsed.public_note,
        internalNote: parsed.internal_note,
        resolutionPhotoUrl: parsed.resolution_photo_url,
        ipAddress: req.ip,
      });

      res.status(200).json({
        success: true,
        issue: result.issue,
        update: result.update,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update payload',
            details: err.issues,
          },
        });
        return;
      }
      res.status(400).json({
        error: {
          code: 'UPDATE_FAILED',
          message: err.message || 'Failed to add timeline update',
        },
      });
    }
  }
}
