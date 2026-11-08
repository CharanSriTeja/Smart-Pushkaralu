import { Router } from 'express';
import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { checkPermission } from '../../middleware/rbac.js';
import { query } from '../../db/index.js';
import { env } from '../../config/env.js';
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

// 0. Dashboard Statistics (Real Database Metrics)
// GET /v1/admin/dashboard-stats
adminRouter.get('/dashboard-stats', async (_req, res) => {
  try {
    const ghatsRes = await query<{
      total: string;
      normal: string;
      busy: string;
      surge: string;
    }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE crowd_level IN ('low', 'medium', 'unknown') OR crowd_level IS NULL) as normal,
         COUNT(*) FILTER (WHERE crowd_level = 'high') as busy,
         COUNT(*) FILTER (WHERE crowd_level = 'very_high') as surge
       FROM ghats`
    );
    const ghatRow = ghatsRes.rows[0] || { total: '0', normal: '0', busy: '0', surge: '0' };

    const sosRes = await query<{
      active_count: string;
      critical: string;
      high_priority: string;
    }>(
      `SELECT
         COUNT(*) as active_count,
         COUNT(*) FILTER (WHERE severity = 3) as critical,
         COUNT(*) FILTER (WHERE severity = 2) as high_priority
       FROM sos_alerts
       WHERE status IN ('new', 'acknowledged', 'dispatched')`
    );
    const sosRow = sosRes.rows[0] || { active_count: '0', critical: '0', high_priority: '0' };

    const devicesRes = await query<{
      total: string;
      te: string;
      en: string;
      hi: string;
    }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE language = 'te') as te,
         COUNT(*) FILTER (WHERE language = 'en') as en,
         COUNT(*) FILTER (WHERE language = 'hi') as hi
       FROM device_tokens`
    );
    const devRow = devicesRes.rows[0] || { total: '0', te: '0', en: '0', hi: '0' };

    const monthlyQuota = env.MONTHLY_API_FREE_QUOTA;
    const usageRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM api_usage_logs WHERE created_at >= date_trunc('month', NOW())`
    );
    const usedCount = parseInt(usageRes.rows[0]?.count || '0', 10);
    const quotaPercent = monthlyQuota > 0 ? (usedCount / monthlyQuota) * 100 : 0;

    res.json({
      success: true,
      stats: {
        ghats: {
          total: parseInt(ghatRow.total, 10),
          normal: parseInt(ghatRow.normal, 10),
          busy: parseInt(ghatRow.busy, 10),
          surge: parseInt(ghatRow.surge, 10),
        },
        sos: {
          active: parseInt(sosRow.active_count, 10),
          critical: parseInt(sosRow.critical, 10),
          highPriority: parseInt(sosRow.high_priority, 10),
        },
        devices: {
          total: parseInt(devRow.total, 10),
          te: parseInt(devRow.te, 10),
          en: parseInt(devRow.en, 10),
          hi: parseInt(devRow.hi, 10),
        },
        quota: {
          used: usedCount,
          total: monthlyQuota,
          percent: Number(quotaPercent.toFixed(1)),
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// 1. Ghat Management
// POST /v1/admin/ghats/bulk
adminRouter.post(
  '/ghats/bulk',
  express.json({ limit: '10mb' }),
  checkPermission('ghats.create'),
  GhatsController.bulkCreateGhats
);

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


