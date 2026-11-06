import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import fs from 'fs';
import { app } from '../src/app.js';
import * as db from '../src/db/index.js';
import { signAccessToken } from '../src/services/token.js';
import { FCMService } from '../src/services/fcm.service.js';
import { UploadService } from '../src/services/upload.service.js';

describe('Module 8: Report an Issue Tests', () => {
  let mockIssues: any[] = [];
  let mockUpdates: any[] = [];
  let mockAuditLogs: any[] = [];

  const adminToken = signAccessToken({
    userId: 'admin-uuid-1',
    phone: '+919876543210',
    firebaseUid: 'admin-f-uid',
    isAdmin: true,
  });

  const normalUserToken = signAccessToken({
    userId: 'user-uuid-2',
    phone: '+919111122223',
    firebaseUid: 'user-f-uid',
    isAdmin: false,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    FCMService.clearHistory();
    mockAuditLogs = [];
    mockUpdates = [];
    mockIssues = [
      {
        id: 'issue-1',
        ticket_no: 'SP-2027-ABC123',
        category: 'sanitation',
        description: 'Trash pile accumulating near Kotilingala Ghat steps',
        photo_url: '/uploads/issues/sample.jpg',
        location_type: 'gps',
        lat: 16.989065,
        lng: 81.775412,
        qr_zone_id: null,
        ghat_id: 'ghat-kotilingala',
        status: 'submitted',
        priority: 'medium',
        reporter_id: 'user-uuid-2',
        reporter_phone: '+919111122223',
        reporter_device_token: 'fcm-reporter-token-123',
        device_fingerprint: 'device-fp-1',
        is_duplicate: false,
        duplicate_of_ticket_no: null,
        duplicate_count: 0,
        client_metadata: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    mockUpdates = [
      {
        id: 'upd-1',
        issue_id: 'issue-1',
        status: 'submitted',
        public_note: 'Issue reported and queued for verification.',
        internal_note: 'Initial report by user.',
        resolution_photo_url: null,
        updated_by_admin_id: null,
        created_at: new Date().toISOString(),
      },
    ];

    // Mock DB queries for isolated unit testing
    vi.spyOn(db, 'query').mockImplementation(async (sql: string, params: any[] = []) => {
      const lowerSql = sql.toLowerCase().replace(/\s+/g, ' ');

      // Admin role check
      if (lowerSql.includes('from admins where user_id')) {
        const userId = params[0];
        if (userId === 'admin-uuid-1') {
          return {
            rows: [{ id: 'admin-rec-1', user_id: userId, role: 'super_admin', permissions: ['*'] }],
            rowCount: 1,
          } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      }

      // User lookup
      if (lowerSql.includes('from users where id = $1')) {
        const userId = params[0];
        const isAdmin = userId === 'admin-uuid-1';
        return {
          rows: [
            {
              id: userId,
              phone: isAdmin ? '+919876543210' : '+919111122223',
              firebase_uid: isAdmin ? 'admin-f-uid' : 'user-f-uid',
              status: 'active',
              language: 'en',
            },
          ],
          rowCount: 1,
        } as any;
      }

      // Device tokens lookup
      if (lowerSql.includes('from device_tokens where user_id')) {
        return { rows: [{ token: 'fcm-reporter-token-123', language: 'en' }], rowCount: 1 } as any;
      }

      // Ghats proximity lookup
      if (lowerSql.includes('from ghats where publish_status')) {
        return {
          rows: [{ id: 'ghat-kotilingala', distance_meters: 150 }],
          rowCount: 1,
        } as any;
      }

      // Duplicate detection query (Haversine calculation)
      if (lowerSql.includes('from issue_reports where category = $3')) {
        const targetLat = params[0];
        const targetLng = params[1];
        const category = params[2];
        const timeWindowMinutes = parseInt(params[3], 10);

        // Find candidate issues matching category and recent time
        const candidates = mockIssues.filter((i) => {
          if (i.category !== category) return false;
          if (!['submitted', 'under_review', 'in_progress'].includes(i.status)) return false;
          const ageMs = Date.now() - new Date(i.created_at).getTime();
          return ageMs <= timeWindowMinutes * 60 * 1000;
        });

        // Compute Haversine distance
        const matchesWithDist = candidates.map((i) => {
          const R = 6371000;
          const dLat = ((targetLat - i.lat) * Math.PI) / 180;
          const dLng = ((targetLng - i.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((i.lat * Math.PI) / 180) *
              Math.cos((targetLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance_meters = R * c;
          return { ...i, distance_meters };
        });

        matchesWithDist.sort((a, b) => a.distance_meters - b.distance_meters);
        return { rows: matchesWithDist, rowCount: matchesWithDist.length } as any;
      }

      // Find by ticket number
      if (lowerSql.includes('where lower(ticket_no) = lower($1)')) {
        const ticketNo = params[0].toLowerCase();
        const found = mockIssues.find((i) => i.ticket_no.toLowerCase() === ticketNo);
        return { rows: found ? [found] : [], rowCount: found ? 1 : 0 } as any;
      }

      // Find by ID
      if (lowerSql.includes('from issue_reports where id = $1')) {
        const id = params[0];
        const found = mockIssues.find((i) => i.id === id);
        return { rows: found ? [found] : [], rowCount: found ? 1 : 0 } as any;
      }

      // Increment duplicate count
      if (lowerSql.includes('update issue_reports set duplicate_count = duplicate_count + 1')) {
        const ticketNo = params[0];
        const item = mockIssues.find((i) => i.ticket_no === ticketNo);
        if (item) {
          item.duplicate_count = (item.duplicate_count || 0) + 1;
          item.updated_at = new Date().toISOString();
        }
        return { rows: item ? [item] : [], rowCount: item ? 1 : 0 } as any;
      }

      // Insert into issue_reports
      if (lowerSql.includes('insert into issue_reports')) {
        const newIssue = {
          id: `issue-${mockIssues.length + 1}`,
          ticket_no: params[0],
          category: params[1],
          description: params[2],
          photo_url: params[3],
          location_type: params[4],
          lat: params[5],
          lng: params[6],
          qr_zone_id: params[7],
          ghat_id: params[8],
          status: 'submitted',
          priority: 'medium',
          reporter_id: params[9],
          reporter_phone: params[10],
          reporter_device_token: params[11],
          device_fingerprint: params[12],
          is_duplicate: false,
          duplicate_of_ticket_no: null,
          duplicate_count: 0,
          client_metadata: params[13] ? JSON.parse(params[13]) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockIssues.push(newIssue);
        return { rows: [newIssue], rowCount: 1 } as any;
      }

      // Update issue status
      if (lowerSql.includes('update issue_reports set status = $1')) {
        const newStatus = params[0];
        const id = params[1];
        const issue = mockIssues.find((i) => i.id === id);
        if (issue) {
          issue.status = newStatus;
          issue.updated_at = new Date().toISOString();
        }
        return { rows: issue ? [issue] : [], rowCount: issue ? 1 : 0 } as any;
      }

      // Get timeline updates
      if (lowerSql.includes('from issue_updates where issue_id = $1')) {
        const issueId = params[0];
        const updates = mockUpdates.filter((u) => u.issue_id === issueId);
        if (lowerSql.includes('null as internal_note')) {
          // Public sanitized timeline
          return {
            rows: updates.map((u) => ({
              id: u.id,
              issue_id: u.issue_id,
              status: u.status,
              public_note: u.public_note,
              resolution_photo_url: u.resolution_photo_url,
              created_at: u.created_at,
              internal_note: null,
              updated_by_admin_id: null,
            })),
            rowCount: updates.length,
          } as any;
        }
        return { rows: updates, rowCount: updates.length } as any;
      }

      // Insert issue update
      if (lowerSql.includes('insert into issue_updates')) {
        const upd = {
          id: `upd-${mockUpdates.length + 1}`,
          issue_id: params[0],
          status: params[1],
          public_note: params[2],
          internal_note: params[3],
          resolution_photo_url: params[4],
          updated_by_admin_id: params[5],
          created_at: new Date().toISOString(),
        };
        mockUpdates.push(upd);
        return { rows: [upd], rowCount: 1 } as any;
      }

      // Find my issues
      if (lowerSql.includes('from issue_reports where reporter_id') || lowerSql.includes('from issue_reports where device_fingerprint')) {
        const term = params[0];
        const matched = mockIssues.filter(
          (i) => i.reporter_id === term || i.reporter_device_token === term || i.device_fingerprint === term
        );
        return { rows: matched, rowCount: matched.length } as any;
      }

      // Admin list count & data
      if (lowerSql.includes('count(*)::text as count from issue_reports')) {
        return { rows: [{ count: String(mockIssues.length) }], rowCount: 1 } as any;
      }
      if (lowerSql.includes('select * from issue_reports')) {
        return { rows: mockIssues, rowCount: mockIssues.length } as any;
      }

      // Insert audit log
      if (lowerSql.includes('insert into audit_logs')) {
        const log = {
          id: `audit-${mockAuditLogs.length + 1}`,
          admin_id: params[0],
          admin_email: params[1],
          action: params[2],
          entity_type: params[3],
          entity_id: params[4],
          old_values: params[5] ? JSON.parse(params[5]) : null,
          new_values: params[6] ? JSON.parse(params[6]) : null,
          source_url: params[7],
          reason: params[8],
          ip_address: params[9],
          created_at: new Date().toISOString(),
        };
        mockAuditLogs.push(log);
        return { rows: [log], rowCount: 1 } as any;
      }

      // Get audit logs
      if (lowerSql.includes('from audit_logs')) {
        return { rows: mockAuditLogs, rowCount: mockAuditLogs.length } as any;
      }

      return { rows: [], rowCount: 0 } as any;
    });
  });

  describe('1. Duplicate Detection', () => {
    it('detects duplicate issue for same category within 100 meters & 30 minutes', async () => {
      // Kotilingala ghat base is (16.989065, 81.775412) with 'sanitation'
      // Submit identical category 30 meters away: (16.989200, 81.775412)
      const res = await request(app)
        .post('/v1/issues')
        .send({
          category: 'sanitation',
          description: 'A lot of waste near the river bath entrance steps',
          lat: 16.9892,
          lng: 81.775412,
          location_type: 'gps',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.is_duplicate).toBe(true);
      expect(res.body.ticket_no).toBe('SP-2027-ABC123');
      expect(res.body.message).toContain('similar sanitation issue was recently reported');

      // Verifies duplicate count was incremented
      const issue = mockIssues.find((i) => i.ticket_no === 'SP-2027-ABC123');
      expect(issue?.duplicate_count).toBe(1);
    });

    it('creates new ticket when category is different at exact same location', async () => {
      const res = await request(app)
        .post('/v1/issues')
        .send({
          category: 'lighting', // different category from sanitation
          description: 'High mast lamp pole is flickering at night',
          lat: 16.989065,
          lng: 81.775412,
          location_type: 'gps',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.is_duplicate).toBe(false);
      expect(res.body.ticket_no).toMatch(/^SP-2027-[A-Z0-9]{6}$/);
      expect(res.body.issue.category).toBe('lighting');
    });

    it('creates new ticket when same category is reported far away (> 500 meters)', async () => {
      const res = await request(app)
        .post('/v1/issues')
        .send({
          category: 'sanitation',
          description: 'Garbage bins overflowing near Pushkar Ghat 2km away',
          lat: 17.005, // ~1.8km away
          lng: 81.78,
          location_type: 'gps',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.is_duplicate).toBe(false);
    });
  });

  describe('2. Photo Upload Validation & EXIF Stripping', () => {
    it('rejects signed upload request with disallowed MIME type', async () => {
      const res = await request(app)
        .post('/v1/issues/upload-url')
        .send({
          filename: 'report.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('UPLOAD_URL_ERROR');
      expect(res.body.error.message).toContain('Unsupported image type');
    });

    it('rejects signed upload request with file size exceeding 5MB', async () => {
      const res = await request(app)
        .post('/v1/issues/upload-url')
        .send({
          filename: 'photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 6 * 1024 * 1024, // 6MB
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('exceeds maximum limit of 5MB');
    });

    it('generates signed upload URL for valid image payload', async () => {
      const res = await request(app)
        .post('/v1/issues/upload-url')
        .send({
          filename: 'damaged_tap.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024 * 500, // 500KB
        });

      expect(res.status).toBe(200);
      expect(res.body.uploadUrl).toContain('/v1/issues/upload/storage/');
      expect(res.body.token).toBeDefined();
      expect(res.body.key).toBeDefined();
      expect(res.body.expiresAt).toBeGreaterThan(Date.now());
    });

    it('validates and strips EXIF metadata on direct multipart image upload', async () => {
      // Create a valid test JPEG buffer using sharp
      const testImageBuffer = await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 255, g: 100, b: 50 },
        },
      })
        .jpeg()
        .toBuffer();

      const res = await request(app)
        .post('/v1/issues/upload')
        .attach('photo', testImageBuffer, 'sample.jpg');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.photo_url).toMatch(/^\/uploads\/issues\/issue_\d+_[a-f0-9]+\.jpg$/);

      // Verify the generated file exists on disk and is a valid image with NO EXIF
      const filePath = process.cwd() + res.body.photo_url;
      expect(fs.existsSync(filePath)).toBe(true);

      const metadata = await sharp(filePath).metadata();
      expect(metadata.format).toBe('jpeg');
      expect(metadata.exif).toBeUndefined(); // EXIF is stripped!

      // Cleanup
      try {
        fs.unlinkSync(filePath);
      } catch {}
    });

    it('rejects tampered or expired signed upload token', () => {
      expect(() => {
        UploadService.verifyUploadToken('invalid.tampered.token');
      }).toThrow();
    });
  });

  describe('3. Public Endpoints & Guest Reporting', () => {
    it('allows guest users to report issues without Authorization header', async () => {
      const res = await request(app)
        .post('/v1/issues')
        .send({
          category: 'water',
          description: 'Drinking water dispenser tap is leaking heavily',
          lat: 16.992,
          lng: 81.778,
          location_type: 'map_pin',
          reporter_device_token: 'guest-fcm-token-456',
        });

      expect(res.status).toBe(201);
      expect(res.body.ticket_no).toBeDefined();
      expect(res.body.issue.status).toBe('submitted');
      expect(res.body.issue.reporter_id).toBeNull(); // Guest report
    });

    it('returns sanitized timeline on public ticket tracking (internal notes stripped)', async () => {
      const res = await request(app).get('/v1/issues/SP-2027-ABC123');

      expect(res.status).toBe(200);
      expect(res.body.issue.ticket_no).toBe('SP-2027-ABC123');
      expect(res.body.timeline).toBeInstanceOf(Array);
      expect(res.body.timeline.length).toBeGreaterThan(0);

      // Verify security rule: internal notes must NOT leak to public endpoint
      for (const event of res.body.timeline) {
        expect(event.internal_note).toBeNull();
        expect(event.updated_by_admin_id).toBeNull();
      }
    });

    it('retrieves issues reported by device fingerprint or token on GET /v1/issues/mine', async () => {
      const res = await request(app)
        .get('/v1/issues/mine?device_fingerprint=device-fp-1');

      expect(res.status).toBe(200);
      expect(res.body.issues).toBeInstanceOf(Array);
      expect(res.body.issues.length).toBe(1);
      expect(res.body.issues[0].ticket_no).toBe('SP-2027-ABC123');
    });
  });

  describe('4. Admin Status Transitions, Permissions & Audit Logging', () => {
    it('rejects unauthenticated requests to admin issue endpoints with 401', async () => {
      const res = await request(app).get('/v1/admin/issues');
      expect(res.status).toBe(401);
    });

    it('rejects non-admin users with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/v1/admin/issues')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(res.status).toBe(403);
    });

    it('requires a mandatory audit reason when admin updates status', async () => {
      const res = await request(app)
        .patch('/v1/admin/issues/issue-1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'in_progress',
          reason: '', // Empty reason should fail
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('reason');
    });

    it('rejects invalid status transitions with 400', async () => {
      const res = await request(app)
        .patch('/v1/admin/issues/issue-1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'unknown_status_state',
          reason: 'Testing invalid status value',
        });

      expect(res.status).toBe(400);
    });

    it('successfully updates status, logs to audit_logs, and dispatches FCM notification', async () => {
      const res = await request(app)
        .patch('/v1/admin/issues/issue-1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
          reason: 'Sanitation squad completed deep cleaning and removed all debris',
          public_note: 'Sanitation squad cleared debris at Kotilingala Ghat.',
          internal_note: 'Assigned to Municipal Team Bravo led by Inspector Rajesh.',
          resolution_photo_url: '/uploads/issues/resolved_proof.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.issue.status).toBe('resolved');

      // Verify audit log entry was created
      expect(mockAuditLogs.length).toBe(1);
      const audit = mockAuditLogs[0];
      expect(audit.action).toBe('ISSUE_STATUS_UPDATE');
      expect(audit.entity_type).toBe('issue_report');
      expect(audit.old_values.status).toBe('submitted');
      expect(audit.new_values.status).toBe('resolved');
      expect(audit.reason).toContain('Sanitation squad completed deep cleaning');

      // Verify FCM notification was sent
      const fcmHistory = FCMService.getSentHistory();
      expect(fcmHistory.length).toBeGreaterThan(0);
      const notif = fcmHistory.find((n) => n.data.ticketNo === 'SP-2027-ABC123');
      expect(notif).toBeDefined();
      expect(notif?.data.status).toBe('resolved');
      expect(notif?.title).toContain('SP-2027-ABC123');
    });

    it('admin gets complete detail with internal notes on GET /v1/admin/issues/:id', async () => {
      // First add an update with internal note
      await request(app)
        .patch('/v1/admin/issues/issue-1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
          reason: 'Sanitation squad completed deep cleaning',
          public_note: 'Resolved by crew',
          internal_note: 'Municipal Team Bravo inspected and signed off',
        });

      const res = await request(app)
        .get('/v1/admin/issues/issue-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.issue).toBeDefined();
      expect(res.body.timeline).toBeInstanceOf(Array);
      expect(res.body.auditLogs).toBeInstanceOf(Array);

      // Verify admin sees internal note
      const resolvedUpdate = res.body.timeline.find((u: any) => u.status === 'resolved');
      expect(resolvedUpdate?.internal_note).toContain('Municipal Team Bravo');
    });
  });
});
