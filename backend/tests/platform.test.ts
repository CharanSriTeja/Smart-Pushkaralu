import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as db from '../src/db/index.js';
import { signAccessToken } from '../src/services/token.js';
import {
  LocalizedTextSchema,
  pickLanguage,
  validateLocalized,
} from '../src/lib/i18n.js';
import { writeAudit } from '../src/lib/audit.js';
import { logApiUsage } from '../src/lib/usage.js';
import { sendToTopic, formatTopicName } from '../src/lib/push.js';

describe('Module 11 - Platform Support (Part A Backend Foundation)', () => {
  let mockSettings: Record<string, any> = {};
  let mockAuditLogs: any[] = [];
  let mockApiLogs: any[] = [];
  let mockDeviceTokens: any[] = [];
  let mockUsers: any[] = [];
  let mockRoles: any[] = [];
  let mockPermissions: any[] = [];
  let mockRolePermissions: any[] = [];
  let mockAdmins: any[] = [];

  beforeEach(() => {
    mockSettings = {
      places_cache_days: 7,
      route_cache_days: 1,
      corridor_km: 3,
      default_language: 'en',
      sos_rate_limit_per_hour: 5,
    };
    mockAuditLogs = [];
    mockApiLogs = [];
    mockDeviceTokens = [];
    mockUsers = [
      {
        id: 'admin-1',
        phone: '+919999999999',
        name: 'Super Administrator',
        language: 'en',
        status: 'active',
      },
      {
        id: 'staff-1',
        phone: '+918888888888',
        name: 'Staff Member',
        language: 'te',
        status: 'active',
      },
      {
        id: 'pilgrim-1',
        phone: '+917777777777',
        name: 'Pilgrim User',
        language: 'hi',
        status: 'active',
      },
    ];
    mockRoles = [
      { id: 'role-super', name: 'super_admin' },
      { id: 'role-staff', name: 'staff_operator' },
    ];
    mockPermissions = [
      { id: 'p-settings', name: 'settings.write' },
      { id: 'p-audit', name: 'audit.read' },
      { id: 'p-ghats', name: 'ghats.write' },
    ];
    mockRolePermissions = [
      { role_id: 'role-staff', permission_id: 'p-ghats' },
    ];
    mockAdmins = [
      { user_id: 'admin-1', role_id: 'role-super' },
      { user_id: 'staff-1', role_id: 'role-staff' },
    ];

    vi.restoreAllMocks();

    vi.spyOn(db, 'query').mockImplementation(async (sql: string, params: any[] = []) => {
      const normalized = sql.toLowerCase().replace(/\s+/g, ' ');

      // SELECT 1 as healthy
      if (normalized.includes('select 1')) {
        return { rows: [{ healthy: 1 }], rowCount: 1 } as any;
      }

      // SELECT * FROM users WHERE id = $1
      if (normalized.includes('from users where id = $1')) {
        const u = mockUsers.find((x) => x.id === params[0]);
        return { rows: u ? [u] : [], rowCount: u ? 1 : 0 } as any;
      }

      // SELECT 1 FROM admins WHERE user_id = $1
      if (normalized.includes('select 1 from admins where user_id = $1')) {
        const match = mockAdmins.find((a) => a.user_id === params[0]);
        return { rows: match ? [{ '?column?': 1 }] : [], rowCount: match ? 1 : 0 } as any;
      }

      // SELECT r.name as role_name, p.name as permission_name FROM admins
      if (normalized.includes('from admins a join roles r')) {
        const userId = params[0];
        const userAdminRoles = mockAdmins.filter((a) => a.user_id === userId);
        const rows: any[] = [];
        for (const ua of userAdminRoles) {
          const role = mockRoles.find((r) => r.id === ua.role_id);
          if (role) {
            const rolePerms = mockRolePermissions.filter((rp) => rp.role_id === role.id);
            if (rolePerms.length === 0) {
              rows.push({ role_name: role.name, permission_name: null });
            } else {
              for (const rp of rolePerms) {
                const perm = mockPermissions.find((p) => p.id === rp.permission_id);
                rows.push({ role_name: role.name, permission_name: perm?.name || null });
              }
            }
          }
        }
        return { rows, rowCount: rows.length } as any;
      }

      // SELECT key, value FROM settings WHERE key = ANY($1)
      if (normalized.includes('from settings where key = any')) {
        const rows = Object.entries(mockSettings).map(([k, v]) => ({ key: k, value: v }));
        return { rows, rowCount: rows.length } as any;
      }

      // SELECT s.key, s.value, s.updated_by, s.updated_at FROM settings
      if (normalized.includes('from settings s left join users u')) {
        const rows = Object.entries(mockSettings).map(([k, v]) => ({
          key: k,
          value: v,
          updated_by: 'admin-1',
          updated_at: new Date(),
        }));
        return { rows, rowCount: rows.length } as any;
      }

      // SELECT key, value FROM settings WHERE key = $1
      if (normalized.includes('select key, value from settings where key = $1')) {
        const k = params[0];
        const val = mockSettings[k];
        return { rows: val !== undefined ? [{ key: k, value: val }] : [], rowCount: val !== undefined ? 1 : 0 } as any;
      }

      // INSERT INTO settings
      if (normalized.includes('insert into settings')) {
        const [k, v, updated_by] = params;
        const parsedVal = typeof v === 'string' ? JSON.parse(v) : v;
        mockSettings[k] = parsedVal;
        return {
          rows: [{ key: k, value: parsedVal, updated_by, updated_at: new Date() }],
          rowCount: 1,
        } as any;
      }

      // INSERT INTO audit_logs
      if (normalized.includes('insert into audit_logs')) {
        const [admin_id, action, entity_type, entity_id, old_val, new_val, source_url, reason] = params;
        const record = {
          id: 'audit-' + (mockAuditLogs.length + 1),
          admin_id,
          action,
          entity_type,
          entity_id,
          old_value: old_val ? JSON.parse(old_val) : null,
          new_value: new_val ? JSON.parse(new_val) : null,
          source_url,
          reason,
          created_at: new Date(),
        };
        mockAuditLogs.push(record);
        return { rows: [record], rowCount: 1 } as any;
      }

      // SELECT COUNT(*) as count FROM audit_logs
      if (normalized.includes('select count(*) as count from audit_logs')) {
        return { rows: [{ count: mockAuditLogs.length.toString() }], rowCount: 1 } as any;
      }

      // SELECT a.*, u.phone as admin_phone FROM audit_logs
      if (normalized.includes('from audit_logs a left join users u')) {
        return { rows: mockAuditLogs, rowCount: mockAuditLogs.length } as any;
      }

      // INSERT INTO api_usage_logs
      if (normalized.includes('insert into api_usage_logs')) {
        const [provider, endpoint, status, cost_estimate] = params;
        const entry = {
          id: 'usage-' + (mockApiLogs.length + 1),
          provider,
          endpoint,
          status,
          cost_estimate,
          created_at: new Date(),
        };
        mockApiLogs.push(entry);
        return { rows: [entry], rowCount: 1 } as any;
      }

      // SELECT COUNT(*) as count, COALESCE(SUM(cost_estimate), 0) FROM api_usage_logs
      if (normalized.includes('select count(*) as count, coalesce(sum(cost_estimate)')) {
        const totalCost = mockApiLogs.reduce((acc, curr) => acc + Number(curr.cost_estimate || 0), 0);
        return {
          rows: [{ count: mockApiLogs.length.toString(), total_cost: totalCost.toString() }],
          rowCount: 1,
        } as any;
      }

      // SELECT provider, COUNT(*) as count FROM api_usage_logs GROUP BY provider
      if (normalized.includes('from api_usage_logs group by provider')) {
        const map: Record<string, { count: number; cost: number }> = {};
        for (const item of mockApiLogs) {
          if (!map[item.provider]) map[item.provider] = { count: 0, cost: 0 };
          map[item.provider].count += 1;
          map[item.provider].cost += Number(item.cost_estimate || 0);
        }
        const rows = Object.entries(map).map(([k, v]) => ({
          provider: k,
          count: v.count.toString(),
          total_cost: v.cost.toString(),
        }));
        return { rows, rowCount: rows.length } as any;
      }

      // Daily usage
      if (normalized.includes('select to_char(created_at, \'yyyy-mm-dd\') as date')) {
        return { rows: [], rowCount: 0 } as any;
      }

      // INSERT INTO device_tokens
      if (normalized.includes('insert into device_tokens')) {
        const [user_id, fcm_token, language, topics, platform] = params;
        const existingIdx = mockDeviceTokens.findIndex((d) => d.fcm_token === fcm_token);
        const record = {
          id: 'dev-' + (mockDeviceTokens.length + 1),
          user_id,
          fcm_token,
          language,
          topics,
          platform,
          updated_at: new Date(),
        };
        if (existingIdx >= 0) {
          mockDeviceTokens[existingIdx] = record;
        } else {
          mockDeviceTokens.push(record);
        }
        return { rows: [record], rowCount: 1 } as any;
      }

      return { rows: [], rowCount: 0 } as any;
    });
  });

  const superAdminToken = signAccessToken({
    userId: 'admin-1',
    firebaseUid: 'fb-admin-1',
    phone: '+919999999999',
    isAdmin: true,
  });

  const staffToken = signAccessToken({
    userId: 'staff-1',
    firebaseUid: 'fb-staff-1',
    phone: '+918888888888',
    isAdmin: true,
  });

  const pilgrimToken = signAccessToken({
    userId: 'pilgrim-1',
    firebaseUid: 'fb-pilgrim-1',
    phone: '+917777777777',
    isAdmin: false,
  });

  describe('1. Health Check & Database Connectivity', () => {
    it('GET /v1/health returns 200 with database: connected', async () => {
      const res = await request(app).get('/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('connected');
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });

  describe('2. Translatable Fields Helpers & Zod Schema', () => {
    it('validates LocalizedText with required English', () => {
      const valid = LocalizedTextSchema.safeParse({
        en: 'Pushkar Ghat',
        te: 'పుష్కర ఘాట్',
        hi: 'पुष्कर घाट',
      });
      expect(valid.success).toBe(true);

      const invalid = LocalizedTextSchema.safeParse({
        te: 'పుష్కర ఘాట్',
      });
      expect(invalid.success).toBe(false);
    });

    it('pickLanguage falls back gracefully to English', () => {
      const field = {
        en: 'Kotilingala Ghat',
        te: 'కోటిలింగాల ఘాట్',
      };

      expect(pickLanguage(field, 'te')).toBe('కోటిలింగాల ఘాట్');
      expect(pickLanguage(field, 'hi')).toBe('Kotilingala Ghat'); // Fallback to EN
      expect(pickLanguage(field, 'en')).toBe('Kotilingala Ghat');
      expect(pickLanguage(null, 'te')).toBe('');
    });

    it('validateLocalized checks for required translations', () => {
      const field = { en: 'Hello', te: 'నమస్కారం' };
      const res1 = validateLocalized(field, ['en', 'te']);
      expect(res1.isValid).toBe(true);

      const res2 = validateLocalized(field, ['en', 'hi']);
      expect(res2.isValid).toBe(false);
      expect(res2.missing).toContain('hi');
    });
  });

  describe('3. Settings Endpoints', () => {
    it('GET /v1/settings/public returns safe settings without auth', async () => {
      const res = await request(app).get('/v1/settings/public');
      expect(res.status).toBe(200);
      expect(res.body.settings).toBeDefined();
      expect(res.body.settings.places_cache_days).toBe(7);
      expect(res.body.settings.corridor_km).toBe(3);
    });

    it('PATCH /v1/admin/settings updates settings and creates an audit log for super_admin', async () => {
      const res = await request(app)
        .patch('/v1/admin/settings')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          key: 'corridor_km',
          value: 5,
          reason: 'Expanded crowd perimeter',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Settings updated successfully');
      expect(mockSettings.corridor_km).toBe(5);

      // Verify audit log entry was created
      expect(mockAuditLogs.length).toBe(1);
      expect(mockAuditLogs[0].action).toBe('settings.update');
      expect(mockAuditLogs[0].entity_id).toBe('corridor_km');
      expect(mockAuditLogs[0].new_value).toBe(5);
    });

    it('PATCH /v1/admin/settings rejects non-admin users', async () => {
      const res = await request(app)
        .patch('/v1/admin/settings')
        .set('Authorization', `Bearer ${pilgrimToken}`)
        .send({ key: 'corridor_km', value: 10 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('PATCH /v1/admin/settings rejects staff without settings.write permission', async () => {
      const res = await request(app)
        .patch('/v1/admin/settings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ key: 'corridor_km', value: 10 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('4. Audit Logging', () => {
    it('GET /v1/admin/audit-logs returns logs for authorized super_admin', async () => {
      await writeAudit({
        adminId: 'admin-1',
        action: 'news.publish',
        entityType: 'news',
        entityId: 'news-101',
        newValue: { title: 'Security Alert' },
      });

      const res = await request(app)
        .get('/v1/admin/audit-logs?limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.page).toBe(1);
    });

    it('GET /v1/admin/audit-logs denies access to staff without audit.read permission', async () => {
      const res = await request(app)
        .get('/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('5. API Usage Logging', () => {
    it('records usage and returns summary via GET /v1/admin/usage', async () => {
      await logApiUsage('firebase_auth', '/verifyIdToken', 200, 0.0);
      await logApiUsage('firebase_messaging', '/sendToTopic', 200, 0.0);

      const res = await request(app)
        .get('/v1/admin/usage')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.monthlyQuota).toBeDefined();
      expect(res.body.currentMonthUsage).toBe(2);
      expect(res.body.providers.length).toBe(2);
    });
  });

  describe('6. Device Registration & Push Topics', () => {
    it('POST /v1/devices registers a guest device token', async () => {
      const res = await request(app)
        .post('/v1/devices')
        .send({
          fcmToken: 'guest-fcm-token-xyz-123',
          language: 'te',
          topics: ['ghat-vip-1'],
          platform: 'android',
        });

      expect(res.status).toBe(200);
      expect(res.body.device.fcm_token).toBe('guest-fcm-token-xyz-123');
      expect(res.body.device.topics).toContain('lang-te');
      expect(res.body.device.topics).toContain('ghat-vip-1');
    });

    it('POST /v1/devices attaches authenticated user_id if token provided', async () => {
      const res = await request(app)
        .post('/v1/devices')
        .set('Authorization', `Bearer ${pilgrimToken}`)
        .send({
          fcmToken: 'user-fcm-token-abc-456',
          language: 'hi',
          topics: ['ghat-saraswati'],
        });

      expect(res.status).toBe(200);
      expect(res.body.device.user_id).toBe('pilgrim-1');
      expect(res.body.device.topics).toContain('lang-hi');
    });

    it('formats topic names properly', () => {
      expect(formatTopicName('Ghat Saraswati #1')).toBe('ghat_saraswati__1');
      expect(formatTopicName('lang-TE')).toBe('lang-te');
    });

    it('simulates push notification via sendToTopic', async () => {
      const result = await sendToTopic('lang-en', {
        title: 'Emergency Flood Alert',
        body: 'Water level rising at Godavari ghat',
        sourceEntityId: 'alert-1',
      });
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('7. ICCC Integration Feature Flag Stubs', () => {
    it('POST /v1/integrations/iccc/webhook returns 501 when disabled by feature flag', async () => {
      const res = await request(app)
        .post('/v1/integrations/iccc/webhook')
        .send({
          alertId: 'iccc-01',
          level: 'high',
          title: 'Crowd surge',
          description: 'High density near Main Ghat',
          location: { lat: 17.0005, lng: 81.7800 },
          timestamp: new Date().toISOString(),
        });

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('ICCC_DISABLED');
    });

    it('GET /v1/integrations/iccc/export returns 501 when disabled by feature flag', async () => {
      const res = await request(app)
        .get('/v1/integrations/iccc/export')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('ICCC_DISABLED');
    });
  });
});

