import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as db from '../src/db/index.js';
import { signAccessToken } from '../src/services/token.js';
import { resetClusterTracker, trackAlertForCluster } from '../src/services/sos-socket.js';
import { parseSmsSosMessage, MockSmsGatewayAdapter } from '../src/services/sms-gateway.js';

describe('Module 7: Emergency SOS Tests', () => {
  let mockAlerts: any[] = [];
  let mockUpdates: any[] = [];
  let mockZones: any[] = [];
  let mockContacts: any[] = [];
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
    resetClusterTracker();
    MockSmsGatewayAdapter.sentMessages = [];
    mockAuditLogs = [];
    mockUpdates = [];
    mockAlerts = [];

    mockZones = [
      {
        id: 'zone-g07-id',
        zone_code: 'G07',
        ghat_id: 'ghat-kotilingala-id',
        label: { en: 'Main Bathing Steps - Sector G07', te: 'ప్రధాన స్నాన ఘట్టం G07', hi: 'मुख्य स्नान सीढ़ियां G07' },
        lat: 17.0005,
        lng: 81.7800,
        active: true,
      },
    ];

    mockContacts = [
      {
        id: 'contact-112',
        label: { en: 'National Emergency Helpline', te: 'జాతీయ అత్యవసర సహాయం', hi: 'राष्ट्रीय आपातकालीन हेल्पलाइन' },
        phone: '112',
        kind: 'control_room',
        ghat_id: null,
        sort_order: 1,
        active: true,
      },
      {
        id: 'contact-108',
        label: { en: 'Ambulance & Medical Emergency', te: 'అంబులెన్స్', hi: 'एम्बुलेंस' },
        phone: '108',
        kind: 'ambulance',
        ghat_id: null,
        sort_order: 2,
        active: true,
      },
    ];

    vi.spyOn(db, 'withTransaction').mockImplementation(async (callback: any) => {
      const mockClient = {
        query: db.query,
      };
      return await callback(mockClient);
    });

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
              name: isAdmin ? 'Control Officer' : 'Pilgrim User',
              firebase_uid: isAdmin ? 'admin-f-uid' : 'user-f-uid',
              status: 'active',
              language: 'en',
            },
          ],
          rowCount: 1,
        } as any;
      }

      // QR Zones lookup
      if (lowerSql.includes('from qr_zones where zone_code ilike')) {
        const code = params[0]?.toLowerCase();
        const found = mockZones.filter((z) => z.zone_code.toLowerCase() === code && z.active);
        return { rows: found, rowCount: found.length } as any;
      }

      if (lowerSql.includes('from qr_zones') && !lowerSql.includes('insert') && !lowerSql.includes('update')) {
        return { rows: mockZones, rowCount: mockZones.length } as any;
      }

      // Emergency contacts lookup
      if (lowerSql.includes('from emergency_contacts') && !lowerSql.includes('insert') && !lowerSql.includes('update')) {
        return { rows: mockContacts, rowCount: mockContacts.length } as any;
      }

      // Ghats lookup
      if (lowerSql.includes('from ghats where id = $1')) {
        return { rows: [{ id: params[0], name: { en: 'Kotilingala Ghat' } }], rowCount: 1 } as any;
      }

      if (lowerSql.includes('from ghats where lat is not null')) {
        return {
          rows: [
            { id: 'ghat-kotilingala-id', lat: 17.0005, lng: 81.7800 },
            { id: 'ghat-pushkar-id', lat: 17.0045, lng: 81.7825 },
          ],
          rowCount: 2,
        } as any;
      }

      // Idempotency check
      if (lowerSql.includes('from sos_alerts where idempotency_key = $1')) {
        const found = mockAlerts.filter((a) => a.idempotency_key === params[0]);
        return { rows: found, rowCount: found.length } as any;
      }

      // Deduplication check
      if (lowerSql.includes('from sos_alerts where created_at >=')) {
        // Find existing open alert matching phone, device, or zone
        const found = mockAlerts.filter((a) => {
          if (!['new', 'acknowledged', 'dispatched'].includes(a.status)) return false;
          if (params.includes(a.phone)) return true;
          if (params.includes(a.device_id)) return true;
          if (params.includes(a.zone_code)) return true;
          return false;
        });
        return { rows: found, rowCount: found.length } as any;
      }

      // Insert SOS Alert
      if (lowerSql.includes('insert into sos_alerts')) {
        const newAlert = {
          id: `sos-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          user_id: params[0],
          phone: params[1],
          channel: params[2],
          type: params[3],
          lat: params[4],
          lng: params[5],
          accuracy_m: params[6],
          ghat_id: params[7],
          zone_id: params[8],
          zone_code: params[9],
          language: params[10],
          status: 'new',
          severity: params[11],
          device_id: params[12],
          idempotency_key: params[13],
          status_token: params[14],
          metadata: params[15],
          merged_into_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockAlerts.push(newAlert);
        return { rows: [newAlert], rowCount: 1 } as any;
      }

      // Insert SOS Update
      if (lowerSql.includes('insert into sos_updates')) {
        const newUpdate = {
          id: `upd-${Date.now()}`,
          alert_id: params[0],
          admin_id: params[1] || null,
          status: params[2] || null,
          note: params[3] || params[1],
          is_public: params[4] !== undefined ? params[4] : (params[2] !== undefined ? params[2] : true),
          created_at: new Date().toISOString(),
        };
        mockUpdates.push(newUpdate);
        return { rows: [newUpdate], rowCount: 1 } as any;
      }

      // Public status lookup
      if (lowerSql.includes('from sos_alerts a') && lowerSql.includes('where a.id = $1 and a.status_token = $2')) {
        const found = mockAlerts.filter((a) => a.id === params[0] && a.status_token === params[1]);
        return { rows: found, rowCount: found.length } as any;
      }

      // Updates lookup
      if (lowerSql.includes('from sos_updates') && lowerSql.includes('where alert_id = $1')) {
        const found = mockUpdates.filter((u) => u.alert_id === params[0]);
        return { rows: found, rowCount: found.length } as any;
      }

      // Single alert lookup
      if (lowerSql.includes('from sos_alerts') && lowerSql.includes('where id = $1')) {
        const found = mockAlerts.filter((a) => a.id === params[0]);
        return { rows: found, rowCount: found.length } as any;
      }

      if (lowerSql.includes('from sos_alerts a') && lowerSql.includes('where a.id = $1')) {
        const found = mockAlerts.filter((a) => a.id === params[0]);
        return { rows: found, rowCount: found.length } as any;
      }

      // Update status
      if (lowerSql.includes("update sos_alerts set status = 'false_alarm'")) {
        const id = params[0];
        const idx = mockAlerts.findIndex((a) => a.id === id);
        if (idx !== -1) {
          mockAlerts[idx].status = 'false_alarm';
          mockAlerts[idx].updated_at = new Date().toISOString();
          return { rows: [mockAlerts[idx]], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      }

      if (lowerSql.includes('update sos_alerts set status = $1')) {
        const status = params[0];
        const id = params[1];
        const idx = mockAlerts.findIndex((a) => a.id === id);
        if (idx !== -1) {
          mockAlerts[idx].status = status;
          mockAlerts[idx].updated_at = new Date().toISOString();
          return { rows: [mockAlerts[idx]], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      }

      // Assign responder
      if (lowerSql.includes('update sos_alerts set assigned_to_name = $1')) {
        const assignedToName = params[0];
        const assignedToPhone = params[1];
        const id = params[2];
        const idx = mockAlerts.findIndex((a) => a.id === id);
        if (idx !== -1) {
          mockAlerts[idx].assigned_to_name = assignedToName;
          mockAlerts[idx].assigned_to_phone = assignedToPhone;
          mockAlerts[idx].status = mockAlerts[idx].status === 'new' ? 'acknowledged' : mockAlerts[idx].status;
          return { rows: [mockAlerts[idx]], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      }

      // Audit logs insert
      if (lowerSql.includes('insert into audit_logs')) {
        const entry = { id: `audit-${Date.now()}`, ...params };
        mockAuditLogs.push(entry);
        return { rows: [entry], rowCount: 1 } as any;
      }

      // Count alerts
      if (lowerSql.includes('select count(*) as count from sos_alerts')) {
        return { rows: [{ count: String(mockAlerts.length) }], rowCount: 1 } as any;
      }

      // Admin list alerts
      if (lowerSql.includes('from sos_alerts a') && !lowerSql.includes('where a.id = $1')) {
        return { rows: mockAlerts, rowCount: mockAlerts.length } as any;
      }

      return { rows: [], rowCount: 0 } as any;
    });
  });

  describe('Part A & B: Public SOS Creation, Status, & Webhooks', () => {
    it('creates an SOS alert without login (guest mode)', async () => {
      const res = await request(app)
        .post('/v1/sos')
        .send({
          channel: 'app',
          type: 'medical',
          lat: 17.0005,
          lng: 81.7800,
          accuracyM: 15,
          phone: '+919999988888',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('new');
      expect(res.body.data.severity).toBe(1); // medical has severity 1
      expect(res.body.data.statusToken).toBeDefined();
      expect(res.body.data.trackingUrl).toContain('/status?token=');
      expect(mockAlerts.length).toBe(1);
    });

    it('resolves zone code and links to correct ghat', async () => {
      const res = await request(app)
        .post('/v1/sos')
        .send({
          channel: 'qr',
          type: 'police',
          zoneCode: 'G07',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('police');
      expect(res.body.data.channel).toBe('qr');

      const saved = mockAlerts[mockAlerts.length - 1];
      expect(saved.zone_code).toBe('G07');
      expect(saved.ghat_id).toBe('ghat-kotilingala-id');
      expect(saved.lat).toBe(17.0005);
    });

    it('respects idempotency key and avoids duplicate creation', async () => {
      const idempotencyKey = 'unique-client-uuid-999';

      const res1 = await request(app)
        .post('/v1/sos')
        .send({
          type: 'general',
          idempotencyKey,
        });

      expect(res1.status).toBe(201);
      const firstId = res1.body.data.id;

      const res2 = await request(app)
        .post('/v1/sos')
        .send({
          type: 'general',
          idempotencyKey,
        });

      expect(res2.status).toBe(201);
      expect(res2.body.data.id).toBe(firstId);
      expect(mockAlerts.length).toBe(1);
    });

    it('deduplicates repeated alerts within the dedup window and returns isDuplicate: true', async () => {
      const phone = '+919876500000';

      const res1 = await request(app)
        .post('/v1/sos')
        .send({
          type: 'medical',
          phone,
        });

      expect(res1.status).toBe(201);
      expect(res1.body.data.isDuplicate).toBe(false);

      const res2 = await request(app)
        .post('/v1/sos')
        .send({
          type: 'medical',
          phone,
        });

      expect(res2.status).toBe(201);
      expect(res2.body.data.isDuplicate).toBe(true);
      expect(res2.body.data.id).toBe(res1.body.data.id);
    });

    it('requires status token to view tracking status', async () => {
      // 1. Create alert
      const createRes = await request(app)
        .post('/v1/sos')
        .send({ type: 'general' });

      const alertId = createRes.body.data.id;
      const token = createRes.body.data.statusToken;

      // 2. Query without token -> 401
      const resNoToken = await request(app).get(`/v1/sos/${alertId}/status`);
      expect(resNoToken.status).toBe(401);

      // 3. Query with invalid token -> 404
      const resBadToken = await request(app).get(`/v1/sos/${alertId}/status?token=wrong-token`);
      expect(resBadToken.status).toBe(404);

      // 4. Query with valid token -> 200
      const resGood = await request(app).get(`/v1/sos/${alertId}/status?token=${token}`);
      expect(resGood.status).toBe(200);
      expect(resGood.body.data.alert.id).toBe(alertId);
      expect(resGood.body.data.updates).toBeDefined();
    });

    it('allows reporter to cancel alert / mark as false alarm', async () => {
      const createRes = await request(app)
        .post('/v1/sos')
        .send({ type: 'fire' });

      const alertId = createRes.body.data.id;
      const token = createRes.body.data.statusToken;

      const cancelRes = await request(app)
        .post(`/v1/sos/${alertId}/cancel`)
        .send({
          token,
          reason: 'Accidental trigger by child',
        });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
    });

    it('fetches emergency contacts with 112 as primary contact', async () => {
      const res = await request(app).get('/v1/emergency-contacts');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].phone).toBe('112');
    });

    it('processes inbound SMS webhook and parses SOS keyword and zone', async () => {
      const res = await request(app)
        .post('/v1/sos/sms-webhook')
        .send({
          From: '+919876543219',
          Body: 'SOS MED G07',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.alertId).toBeDefined();

      const created = mockAlerts.find((a) => a.id === res.body.alertId);
      expect(created).toBeDefined();
      expect(created.channel).toBe('sms');
      expect(created.type).toBe('medical');
      expect(created.zone_code).toBe('G07');
    });

    it('correctly handles missed call webhook signal', async () => {
      const res = await request(app)
        .post('/v1/sos/sms-webhook')
        .send({
          From: '+919876543219',
          Body: 'MISSED_CALL',
        });

      expect(res.status).toBe(200);
      const created = mockAlerts.find((a) => a.id === res.body.alertId);
      expect(created.channel).toBe('call');
      expect(created.type).toBe('general');
    });
  });

  describe('Part A: Admin SOS Operations & Audit Logs', () => {
    it('restricts admin SOS list to authorized admins only', async () => {
      const unauthRes = await request(app).get('/v1/admin/sos');
      expect(unauthRes.status).toBe(401);

      const forbiddenRes = await request(app)
        .get('/v1/admin/sos')
        .set('Authorization', `Bearer ${normalUserToken}`);
      expect(forbiddenRes.status).toBe(403);

      const successRes = await request(app)
        .get('/v1/admin/sos')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(successRes.status).toBe(200);
      expect(successRes.body.success).toBe(true);
    });

    it('allows admin to update status, writes audit log, and pushes update', async () => {
      // 1. Seed alert
      const createRes = await request(app).post('/v1/sos').send({ type: 'medical' });
      const alertId = createRes.body.data.id;

      // 2. Admin acknowledges and dispatches
      const patchRes = await request(app)
        .patch(`/v1/admin/sos/${alertId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'dispatched',
          note: 'Ambulance 04 en route from South Gate',
          isPublic: true,
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.status).toBe('dispatched');

      // 3. Verify audit log entry was created
      expect(mockAuditLogs.length).toBeGreaterThan(0);
      const audit = mockAuditLogs[mockAuditLogs.length - 1];
      expect(audit[1]).toBe('sos.status_update');
    });

    it('allows admin to assign a responder to an alert', async () => {
      const createRes = await request(app).post('/v1/sos').send({ type: 'police' });
      const alertId = createRes.body.data.id;

      const assignRes = await request(app)
        .post(`/v1/admin/sos/${alertId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          assignedToName: 'Inspector Ramesh',
          assignedToPhone: '+919440123456',
          note: 'Assigned to Sector 4 patrol head',
        });

      expect(assignRes.status).toBe(200);
      expect(assignRes.body.data.assigned_to_name).toBe('Inspector Ramesh');
    });

    it('generates a printable QR poster HTML for a zone with 112 prominently displayed', async () => {
      const posterRes = await request(app)
        .get('/v1/admin/sos/zones/G07/poster')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(posterRes.status).toBe(200);
      expect(posterRes.header['content-type']).toContain('text/html');
      expect(posterRes.text).toContain('G07');
      expect(posterRes.text).toContain('112');
      expect(posterRes.text).toContain('data:image/png;base64');
    });
  });

  describe('Part A & B: Cluster Detection & Static Web Page', () => {
    it('triggers cluster event when alerts cross threshold in same window', () => {
      const ghatId = 'ghat-kotilingala-id';

      // Submit 4 alerts -> no cluster yet
      expect(trackAlertForCluster({ alertId: 'a1', ghatId })).toBeNull();
      expect(trackAlertForCluster({ alertId: 'a2', ghatId })).toBeNull();
      expect(trackAlertForCluster({ alertId: 'a3', ghatId })).toBeNull();
      expect(trackAlertForCluster({ alertId: 'a4', ghatId })).toBeNull();

      // 5th alert crosses threshold (5) -> cluster event returned
      const cluster = trackAlertForCluster({ alertId: 'a5', ghatId, ghatName: 'Kotilingala Ghat' });
      expect(cluster).not.toBeNull();
      expect(cluster?.alertCount).toBe(5);
      expect(cluster?.ghatId).toBe(ghatId);
      expect(cluster?.recentAlertIds.length).toBe(5);
    });

    it('serves the standalone emergency SOS web page under 30KB at /sos', async () => {
      const res = await request(app).get('/sos');
      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/html');
      expect(res.text.length).toBeLessThan(30000); // Strictly < 30KB
      expect(res.text).toContain('tel:112');
      expect(res.text).toContain('sms:112');
      expect(res.text).toContain('triggerSos');
    });

    it('parses SMS formats accurately into intent types', () => {
      const parsed1 = parseSmsSosMessage('SOS MED G07', '+919999900000');
      expect(parsed1.type).toBe('medical');
      expect(parsed1.zoneCode).toBe('G07');
      expect(parsed1.channel).toBe('sms');

      const parsed2 = parseSmsSosMessage('SOS FIRE', '+919999900000');
      expect(parsed2.type).toBe('fire');
      expect(parsed2.zoneCode).toBeNull();

      const parsed3 = parseSmsSosMessage('SOS ZONE-KOTI-A', '+919999900000');
      expect(parsed3.type).toBe('general');
      expect(parsed3.zoneCode).toBe('ZONE-KOTI-A');
    });
  });
});
