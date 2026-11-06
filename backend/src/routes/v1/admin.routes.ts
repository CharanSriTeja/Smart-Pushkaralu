import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { checkPermission } from '../../middleware/rbac.js';
import { GhatsController } from '../../modules/ghats/ghats.controller.js';
import { CrowdController } from '../../modules/crowd/crowd.controller.js';
import { NoticesController } from '../../modules/notices/notices.controller.js';
import { AuditController } from '../../modules/audit/audit.controller.js';
import { NewsController } from '../../modules/news/news.controller.js';
import { FacilitiesController } from '../../modules/facilities/facilities.controller.js';

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

// 5. Official News Management (Module 9)
// POST /v1/admin/news
adminRouter.post('/news', checkPermission('news.publish'), NewsController.createNews);

// PATCH /v1/admin/news/:id
adminRouter.patch('/news/:id', checkPermission('news.publish'), NewsController.updateNews);

// DELETE /v1/admin/news/:id
adminRouter.delete('/news/:id', checkPermission('news.delete'), NewsController.deleteNews);

// POST /v1/admin/news/draft-translate (Draft translation assistance for admin review)
adminRouter.post('/news/draft-translate', checkPermission('news.publish'), NewsController.draftTranslate);

// 6. Ghat Facilities Management (Module 9)
// POST /v1/admin/ghats/:id/facilities
adminRouter.post('/ghats/:id/facilities', checkPermission('ghats.update'), FacilitiesController.addFacility);

// PATCH /v1/admin/ghats/:ghatId/facilities/:facilityId
adminRouter.patch(
  '/ghats/:ghatId/facilities/:facilityId',
  checkPermission('ghats.update'),
  FacilitiesController.updateFacility
);

// DELETE /v1/admin/ghats/:ghatId/facilities/:facilityId
adminRouter.delete(
  '/ghats/:ghatId/facilities/:facilityId',
  checkPermission('ghats.update'),
  FacilitiesController.deleteFacility
);
