import { Router } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuth } from '../../middleware/auth.js';
import { IssuesController, multerImageUpload } from '../../modules/issues/issues.controller.js';

export const issuesRouter = Router();

// Rate limiter for public report submission & photo uploads to prevent festival spam
const issuesRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30, // max 30 issue reports per 15 mins per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many grievance submissions from this IP. Please wait a few minutes before submitting again.',
    },
  },
});

// 1. Report an issue (Guests allowed, rate limited, optional bearer auth)
// POST /v1/issues
issuesRouter.post('/issues', issuesRateLimiter, optionalAuth, IssuesController.reportIssue);

// 2. My issues list (retrieves reports for authenticated user or device token/fingerprint)
// GET /v1/issues/mine
issuesRouter.get('/issues/mine', optionalAuth, IssuesController.getMyIssues);

// 3. Track issue by ticket number with sanitized public status timeline
// GET /v1/issues/:ticket_no
issuesRouter.get('/issues/:ticket_no', IssuesController.getIssueByTicketNo);

// 4. Request signed upload URL for client-side direct image upload
// POST /v1/issues/upload-url
issuesRouter.post('/issues/upload-url', issuesRateLimiter, IssuesController.getSignedUploadUrl);

// 5. Binary upload receiver for signed-url storage endpoint (with EXIF removal)
// PUT /v1/issues/upload/storage/:token
issuesRouter.put(
  '/issues/upload/storage/:token',
  express.raw({ type: ['image/*', 'application/octet-stream'], limit: '6mb' }),
  IssuesController.handleStorageUpload
);

// 6. Direct multipart upload receiver (with EXIF removal)
// POST /v1/issues/upload
issuesRouter.post(
  '/issues/upload',
  issuesRateLimiter,
  multerImageUpload.single('photo'),
  IssuesController.handleDirectUpload
);

