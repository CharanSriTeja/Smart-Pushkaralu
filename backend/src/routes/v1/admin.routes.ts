import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { checkPermission } from '../../middleware/rbac.js';
import { GhatsController } from '../../modules/ghats/ghats.controller.js';
import { CrowdController } from '../../modules/crowd/crowd.controller.js';
import { NoticesController } from '../../modules/notices/notices.controller.js';
import { AuditController } from '../../modules/audit/audit.controller.js';
import { NewsController } from '../../modules/news/news.controller.js';
import { FacilitiesController } from '../../modules/facilities/facilities.controller.js';
import { IssuesController } from '../../modules/issues/issues.controller.js';
import { PlacesController } from '../../modules/places/places.controller.js';

export const adminRouter = Router();

// All admin routes require authentication
adminRouter.use(requireAuth);

// 1. Ghat Management
// POST /v1/admin/ghats/bulk
adminRouter.post('/ghats/bulk', checkPermission('ghats.create'), GhatsController.bulkCreateGhats);

// POST /v1/admin/ghats
adminRouter.post('/ghats', checkPermission('ghats.create'), GhatsController.createGhat);

// PATCH /v1/admin/ghats/:id
adminRouter.patch('/ghats/:id', checkPermission('ghats.update'), GhatsController.updateGhat);

// DELETE /v1/admin/ghats/:id
adminRouter.delete('/ghats/:id', checkPermission('ghats.update'), GhatsController.deleteGhat);

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

// 7. Grievances & Issue Management (Module 8)
// GET /v1/admin/issues
adminRouter.get('/issues', checkPermission('issues.read'), IssuesController.adminListIssues);

// GET /v1/admin/issues/:id
adminRouter.get('/issues/:id', checkPermission('issues.read'), IssuesController.adminGetIssue);

// PATCH /v1/admin/issues/:id/status
adminRouter.patch(
  '/issues/:id/status',
  checkPermission('issues.update'),
  IssuesController.adminUpdateStatus
);

// POST /v1/admin/issues/:id/updates
adminRouter.post(
  '/issues/:id/updates',
  checkPermission('issues.update'),
  IssuesController.adminAddUpdate
);

// 8. Module 5: Nearby Places, Curated Records, Overrides & Cache
// Curated places list
adminRouter.get('/places/curated', checkPermission('places.read'), PlacesController.listCurated);

// Hotels
adminRouter.post('/places/hotels', checkPermission('places.create'), PlacesController.createHotel);
adminRouter.patch('/places/hotels/:id', checkPermission('places.update'), PlacesController.updateHotel);
adminRouter.delete('/places/hotels/:id', checkPermission('places.delete'), PlacesController.deleteHotel);

// Temples
adminRouter.post('/places/temples', checkPermission('places.create'), PlacesController.createTemple);
adminRouter.patch('/places/temples/:id', checkPermission('places.update'), PlacesController.updateTemple);
adminRouter.delete('/places/temples/:id', checkPermission('places.delete'), PlacesController.deleteTemple);

// Transport Hubs
adminRouter.post('/places/transport-hubs', checkPermission('places.create'), PlacesController.createTransportHub);
adminRouter.patch('/places/transport-hubs/:id', checkPermission('places.update'), PlacesController.updateTransportHub);
adminRouter.delete('/places/transport-hubs/:id', checkPermission('places.delete'), PlacesController.deleteTransportHub);

// Overrides
adminRouter.get('/places/overrides', checkPermission('places.read'), PlacesController.listOverrides);
adminRouter.post('/places/overrides', checkPermission('places.update'), PlacesController.upsertOverride);
adminRouter.delete('/places/overrides/:id', checkPermission('places.delete'), PlacesController.deleteOverride);

// Cache status & operations
adminRouter.get('/places/cache-status', checkPermission('places.cache'), PlacesController.getCacheStatus);
adminRouter.post('/places/prewarm', checkPermission('places.cache'), PlacesController.prewarmCache);
adminRouter.post('/places/cache/invalidate', checkPermission('places.cache'), PlacesController.invalidateCache);


