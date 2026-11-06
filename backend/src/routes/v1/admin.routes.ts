import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { checkPermission } from '../../middleware/rbac.js';
import { GhatsController } from '../../modules/ghats/ghats.controller.js';
import { CrowdController } from '../../modules/crowd/crowd.controller.js';
import { NoticesController } from '../../modules/notices/notices.controller.js';
import { AuditController } from '../../modules/audit/audit.controller.js';

export const adminRouter = Router();

// All admin routes require authentication
adminRouter.use(requireAuth);

// 1. Ghat Management
// POST /v1/admin/ghats
adminRouter.post('/ghats', checkPermission('ghats.create'), GhatsController.createGhat);

// PATCH /v1/admin/ghats/:id
adminRouter.patch('/ghats/:id', checkPermission('ghats.update'), GhatsController.updateGhat);

// PATCH /v1/admin/ghats/:id/publish-status
adminRouter.patch(
  '/ghats/:id/publish-status',
  checkPermission('ghats.publish'),
  GhatsController.setPublishStatus
);

// 2. Crowd Override
// POST /v1/admin/ghats/:id/crowd-override
adminRouter.post(
  '/ghats/:id/crowd-override',
  checkPermission('crowd.override'),
  CrowdController.adminOverrideCrowd
);

// 3. Notice Management
// POST /v1/admin/notices
adminRouter.post('/notices', checkPermission('notices.publish'), NoticesController.createNotice);

// 4. Audit Log Inspection
// GET /v1/admin/audit-logs
adminRouter.get('/audit-logs', checkPermission('audit.read'), AuditController.listLogs);

