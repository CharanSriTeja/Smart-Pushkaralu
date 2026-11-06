import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as db from '../src/db/index.js';
import { signAccessToken } from '../src/services/token.js';
import { FCMService } from '../src/services/fcm.service.js';
import { NewsExpiryJob } from '../src/jobs/newsExpiryJob.js';

describe('Module 9: Official News and Facilities Tests', () => {
  let mockNews: any[] = [];
  let mockDeviceTokens: any[] = [];
  let mockAuditLogs: any[] = [];
  let mockFacilities: any[] = [];

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
    mockDeviceTokens = [];
    mockFacilities = [
      {
        id: 'fac-1',
        ghat_id: 'ghat-kotilingala',
        facility_type: 'drinking_water',
        details: { en: 'RO Water Station 1', te: 'ఆర్వో తాగునీటి కేంద్రం 1', hi: 'आरओ पेयजल केंद्र 1' },
        is_operational: true,
        count: 4,
        source_url: 'https://eastgodavari.ap.gov.in',
        updated_at: new Date().toISOString(),
      },
    ];

    mockNews = [
      {
        id: 'news-1',
        title: { en: 'General Pushkaralu Advisory', te: 'సాధారణ పుష్కరాల సలహా', hi: 'सामान्य पुष्करालु सलाह' },
        content: { en: 'Please avoid peak afternoon hours.', te: 'దయచేసి మధ్యాహ్నం రద్దీని నివారించండి.', hi: 'कृपया दोपहर के समय से बचें।' },
        summary: { en: 'Advisory on peak hours', te: 'రద్దీ వేళల సలహా', hi: 'भीड़ के समय की सलाह' },
        category: 'advisory',
        priority: 'normal',
        ghat_ids: ['ghat-kotilingala'],
        source_url: 'https://eastgodavari.ap.gov.in/news/1',
        is_official: true,
        is_pinned: false,
        publish_status: 'published',
        published_at: '2026-09-01T10:00:00Z',
        expires_at: null,
        notify_sent: false,
        created_by: 'admin-uuid-1',
        created_at: '2026-09-01T10:00:00Z',
        updated_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 'news-2',
        title: { en: 'URGENT: High Current Alert', te: 'అత్యవసరం: నదీ ప్రవాహ హెచ్చరిక', hi: 'अति आवश्यक: नदी बहाव चेतावनी' },
        content: { en: 'High water current near Kotilingala ghat.', te: 'కోటిలింగాల ఘాట్ వద్ద తీవ్ర ప్రవాహం.', hi: 'कोटालिंगाला घाट के पास तेज बहाव।' },
        summary: { en: 'High current alert', te: 'తీవ్ర ప్రవాహ హెచ్చరిక', hi: 'तेज बहाव चेतावनी' },
        category: 'urgent',
        priority: 'urgent',
        ghat_ids: ['ghat-kotilingala'],
        source_url: 'https://eastgodavari.ap.gov.in/alerts/urgent',
        is_official: true,
        is_pinned: true,
        publish_status: 'published',
        published_at: '2026-09-02T12:00:00Z',
        expires_at: null,
        notify_sent: true,
        created_by: 'admin-uuid-1',
        created_at: '2026-09-02T12:00:00Z',
        updated_at: '2026-09-02T12:00:00Z',
      },
      {
        id: 'news-3-expired',
        title: { en: 'Old Flash Flood Warning', te: 'పాత వరద హెచ్చరిక', hi: 'पुरानी बाढ़ चेतावनी' },
        content: { en: 'Old temporary flood warning from yesterday.', te: 'నిన్నటి తాత్కాలిక వరద హెచ్చరిక.', hi: 'कल की अस्थायी बाढ़ चेतावनी।' },
        summary: null,
        category: 'weather',
        priority: 'high',
        ghat_ids: [],
        source_url: 'https://ap.gov.in',
        is_official: true,
        is_pinned: false,
        publish_status: 'published',
        published_at: '2026-08-01T00:00:00Z',
        expires_at: '2026-08-02T00:00:00Z', // Definitely in the past
        notify_sent: true,
        created_by: 'admin-uuid-1',
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-01T00:00:00Z',
      },
      {
        id: 'news-4-draft',
        title: { en: 'Upcoming Cultural Festivities', te: '', hi: '' },
        content: { en: 'Schedule for cultural festivities.', te: '', hi: '' },
        summary: null,
        category: 'general',
        priority: 'low',
        ghat_ids: [],
        source_url: null,
        is_official: false,
        is_pinned: false,
        publish_status: 'draft',
        published_at: null,
        expires_at: null,
        notify_sent: false,
        created_by: 'admin-uuid-1',
        created_at: '2026-09-03T00:00:00Z',
        updated_at: '2026-09-03T00:00:00Z',
      },
    ];

    // Mock Database Router
    vi.spyOn(db, 'query').mockImplementation(async (sql: string, params: any[] = []) => {
      const lowerSql = sql.toLowerCase().replace(/\s+/g, ' ');

      // Admin verification
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

      // Audit log insertion
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

      // Count query for news_posts
      if (lowerSql.includes('select count(*) as total from news_posts')) {
        let filtered = [...mockNews];
        if (lowerSql.includes("publish_status = 'published'")) {
          filtered = filtered.filter((n) => n.publish_status === 'published');
        }
        if (lowerSql.includes('expires_at is null or expires_at > current_timestamp')) {
          filtered = filtered.filter((n) => !n.expires_at || new Date(n.expires_at) > new Date());
        }
        if (lowerSql.includes('category =')) {
          const cat = params.find((p) => ['urgent', 'general', 'advisory', 'facility', 'traffic', 'weather'].includes(p));
          if (cat) filtered = filtered.filter((n) => n.category === cat);
        }
        if (lowerSql.includes('any(ghat_ids)')) {
          const ghatId = params[0];
          filtered = filtered.filter(
            (n) => n.ghat_ids.length === 0 || n.ghat_ids.includes(ghatId)
          );
        }
        return { rows: [{ total: String(filtered.length) }], rowCount: 1 } as any;
      }

      // Select news_posts list
      if (lowerSql.includes('select * from news_posts') && !lowerSql.includes('where id = $1')) {
        let filtered = [...mockNews];
        if (lowerSql.includes("publish_status = 'published'")) {
          filtered = filtered.filter((n) => n.publish_status === 'published');
        }
        if (lowerSql.includes('expires_at is null or expires_at > current_timestamp')) {
          filtered = filtered.filter((n) => !n.expires_at || new Date(n.expires_at) > new Date());
        }
        if (lowerSql.includes('category =')) {
          const cat = params.find((p) => ['urgent', 'general', 'advisory', 'facility', 'traffic', 'weather'].includes(p));
          if (cat) filtered = filtered.filter((n) => n.category === cat);
        }
        if (lowerSql.includes('any(ghat_ids)')) {
          const ghatId = params[0];
          filtered = filtered.filter(
            (n) => n.ghat_ids.length === 0 || n.ghat_ids.includes(ghatId)
          );
        }

        // Apply order: pinned first
        filtered.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
        });

        return { rows: filtered, rowCount: filtered.length } as any;
      }

      // Select single news item
      if (lowerSql.includes('select * from news_posts where id = $1')) {
        const id = params[0];
        const item = mockNews.find((n) => n.id === id);
        return { rows: item ? [item] : [], rowCount: item ? 1 : 0 } as any;
      }

      // Insert news item
      if (lowerSql.includes('insert into news_posts')) {
        const newRecord = {
          id: `news-created-${mockNews.length + 1}`,
          title: JSON.parse(params[0]),
          content: JSON.parse(params[1]),
          summary: params[2] ? JSON.parse(params[2]) : null,
          category: params[3],
          priority: params[4],
          ghat_ids: params[5] || [],
          source_url: params[6],
          is_official: params[7],
          is_pinned: params[8],
          publish_status: params[9],
          published_at: params[10],
          expires_at: params[11],
          created_by: params[12],
          notify_sent: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockNews.push(newRecord);
        return { rows: [newRecord], rowCount: 1 } as any;
      }

      // Update news item
      if (lowerSql.includes('update news_posts')) {
        if (lowerSql.includes('publish_status = \'expired\'')) {
          // Scheduled expiry job execution
          const now = new Date();
          const expiredList: any[] = [];
          mockNews.forEach((n) => {
            if (n.publish_status === 'published' && n.expires_at && new Date(n.expires_at) <= now) {
              n.publish_status = 'expired';
              expiredList.push({ id: n.id });
            }
          });
          return { rows: expiredList, rowCount: expiredList.length } as any;
        }

        if (lowerSql.includes('set notify_sent = true')) {
          const id = params[0];
          const post = mockNews.find((n) => n.id === id);
          if (post) post.notify_sent = true;
          return { rows: post ? [post] : [], rowCount: 1 } as any;
        }

        // Generic news update
        const id = params[params.length - 1];
        const existing = mockNews.find((n) => n.id === id);
        if (existing) {
          existing.updated_at = new Date().toISOString();
          return { rows: [existing], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      }

      // Delete news item
      if (lowerSql.includes('delete from news_posts where id = $1')) {
        const id = params[0];
        const initLen = mockNews.length;
        mockNews = mockNews.filter((n) => n.id !== id);
        return { rowCount: initLen - mockNews.length } as any;
      }

      // Upsert device_tokens
      if (lowerSql.includes('insert into device_tokens')) {
        const token = params[0];
        const language = params[1];
        const ghat_topics = params[2];
        const userId = params[3];

        let existing = mockDeviceTokens.find((d) => d.token === token);
        if (existing) {
          existing.language = language;
          existing.ghat_topics = ghat_topics;
          existing.topics = ghat_topics;
          existing.user_id = userId || existing.user_id;
          existing.updated_at = new Date().toISOString();
        } else {
          existing = {
            id: `dev-${mockDeviceTokens.length + 1}`,
            token,
            fcm_token: token,
            language,
            ghat_topics,
            topics: ghat_topics,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          mockDeviceTokens.push(existing);
        }
        return { rows: [existing], rowCount: 1 } as any;
      }

      // Select device_tokens
      if (lowerSql.includes('from device_tokens where token = $1')) {
        const token = params[0];
        const dev = mockDeviceTokens.find((d) => d.token === token);
        return { rows: dev ? [dev] : [], rowCount: dev ? 1 : 0 } as any;
      }

      // Ghat facilities select
      if (lowerSql.includes('from ghat_facilities where ghat_id = $1')) {
        const ghatId = params[0];
        const facs = mockFacilities.filter((f) => f.ghat_id === ghatId);
        return { rows: facs, rowCount: facs.length } as any;
      }

      // Ghat facilities single select
      if (lowerSql.includes('from ghat_facilities where id = $1')) {
        const [facId, ghatId] = params;
        const fac = mockFacilities.find((f) => f.id === facId && f.ghat_id === ghatId);
        return { rows: fac ? [fac] : [], rowCount: fac ? 1 : 0 } as any;
      }

      // Insert ghat facility
      if (lowerSql.includes('insert into ghat_facilities')) {
        const createdFac = {
          id: `fac-${mockFacilities.length + 1}`,
          ghat_id: params[0],
          facility_type: params[1],
          details: JSON.parse(params[2]),
          is_operational: params[3],
          count: params[4],
          source_url: params[5],
          updated_at: new Date().toISOString(),
        };
        mockFacilities.push(createdFac);
        return { rows: [createdFac], rowCount: 1 } as any;
      }

      // Update ghat facility
      if (lowerSql.includes('update ghat_facilities')) {
        const facId = params[params.length - 1];
        const fac = mockFacilities.find((f) => f.id === facId);
        if (fac) {
          if (typeof params[0] === 'boolean') fac.is_operational = params[0];
          fac.updated_at = new Date().toISOString();
          return { rows: [fac], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      }

      // Delete ghat facility
      if (lowerSql.includes('delete from ghat_facilities where id = $1')) {
        const facId = params[0];
        mockFacilities = mockFacilities.filter((f) => f.id !== facId);
        return { rowCount: 1 } as any;
      }

      return { rows: [], rowCount: 0 } as any;
    });
  });

  // ----------------------------------------------------
  // 1. PUBLIC NEWS ENDPOINTS & FILTERING
  // ----------------------------------------------------
  describe('GET /v1/news public filtering and ordering', () => {
    it('returns published news with pinned items first and excludes expired posts', async () => {
      const res = await request(app).get('/v1/news');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const items = res.body.data;
      // Expired news-3-expired must NOT be returned in standard public feed
      const hasExpired = items.some((i: any) => i.id === 'news-3-expired');
      expect(hasExpired).toBe(false);

      // Draft news-4-draft must NOT be returned
      const hasDraft = items.some((i: any) => i.id === 'news-4-draft');
      expect(hasDraft).toBe(false);

      // First item must be pinned (news-2)
      expect(items[0].id).toBe('news-2');
      expect(items[0].is_pinned).toBe(true);
    });

    it('filters news by category correctly', async () => {
      const res = await request(app).get('/v1/news?category=urgent');
      expect(res.status).toBe(200);
      expect(res.body.data.every((i: any) => i.category === 'urgent')).toBe(true);
    });

    it('filters news by ghat ID', async () => {
      const res = await request(app).get('/v1/news?ghat=ghat-kotilingala');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('returns localized fields according to requested language query param', async () => {
      const res = await request(app).get('/v1/news?language=te');
      expect(res.status).toBe(200);
      const post = res.body.data.find((i: any) => i.id === 'news-2');
      expect(post).toBeDefined();
      expect(post.localized_title).toBe('అత్యవసరం: నదీ ప్రవాహ హెచ్చరిక');
      expect(post.localized_summary).toBe('తీవ్ర ప్రవాహ హెచ్చరిక');
    });

    it('GET /v1/news/:id returns 404 for unknown news ID', async () => {
      const res = await request(app).get('/v1/news/unknown-id-999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ----------------------------------------------------
  // 2. SCHEDULED EXPIRY JOB
  // ----------------------------------------------------
  describe('News Expiry Scheduled Job', () => {
    it('marks past-expiration published posts as expired', async () => {
      const targetPost = mockNews.find((n) => n.id === 'news-3-expired');
      expect(targetPost.publish_status).toBe('published');

      const result = await NewsExpiryJob.runOnce();
      expect(result.expiredCount).toBe(1);
      expect(result.expiredIds).toContain('news-3-expired');

      // Check status updated in memory
      expect(targetPost.publish_status).toBe('expired');
    });
  });

  // ----------------------------------------------------
  // 3. DEVICE REGISTRATION & FCM TOPIC SUBSCRIPTIONS
  // ----------------------------------------------------
  describe('POST /v1/devices Registration', () => {
    it('registers an FCM device token with language and ghat topics', async () => {
      const res = await request(app)
        .post('/v1/devices')
        .send({
          token: 'fcm-sample-token-abc123',
          language: 'te',
          ghat_topics: ['ghat-kotilingala', 'ghat-pushkar'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('fcm-sample-token-abc123');
      expect(res.body.data.language).toBe('te');
      expect(res.body.data.ghat_topics).toEqual(['ghat-kotilingala', 'ghat-pushkar']);
    });

    it('updates device preferences on duplicate registration', async () => {
      // First registration
      await request(app)
        .post('/v1/devices')
        .send({
          token: 'device-token-xyz',
          language: 'en',
          ghat_topics: ['ghat-1'],
        });

      // Update registration with Hindi and new topic
      const res = await request(app)
        .post('/v1/devices')
        .send({
          token: 'device-token-xyz',
          language: 'hi',
          ghat_topics: ['ghat-1', 'ghat-2'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.language).toBe('hi');
      expect(res.body.data.ghat_topics).toEqual(['ghat-1', 'ghat-2']);
    });

    it('rejects registration with empty token', async () => {
      const res = await request(app).post('/v1/devices').send({ token: '' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  // ----------------------------------------------------
  // 4. ADMIN NEWS CREATION, AUDIT LOGGING & OFFICIAL TRUST CHECK
  // ----------------------------------------------------
  describe('Admin News Publishing, Audit Logs & Trust Validation', () => {
    it('creates a news post with mandatory audit logging', async () => {
      const payload = {
        title: { en: 'New Aarti Timing Announcement', te: 'కొత్త హారతి సమయాల ప్రకటన', hi: 'नई आरती समय घोषणा' },
        content: { en: 'Evening Maha Harathi begins at 6:30 PM.', te: 'సాయంత్రం మహా హారతి 6:30 కి ప్రారంభం.', hi: 'शाम की महा आरती 6:30 बजे शुरू होगी।' },
        summary: { en: 'Aarti timing updated', te: 'హారతి సమయం మార్చబడింది', hi: 'आरती का समय बदला' },
        category: 'general',
        priority: 'normal',
        ghat_ids: ['ghat-kotilingala'],
        source_url: 'https://eastgodavari.ap.gov.in/aarti',
        is_official: true,
        is_pinned: false,
        publish_status: 'published',
        audit_reason: 'Annual Pushkaralu aarti schedule officially released by devasthanam.',
      };

      const res = await request(app)
        .post('/v1/admin/news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.title.en).toBe('New Aarti Timing Announcement');

      // Verify audit log entry
      expect(mockAuditLogs.length).toBe(1);
      const log = mockAuditLogs[0];
      expect(log.action).toBe('news.create');
      expect(log.entity_type).toBe('news_post');
      expect(log.reason).toBe(payload.audit_reason);
      expect(log.admin_id).toBe('admin-uuid-1');
    });

    it('strictly forbids setting is_official = true without a verified government source URL', async () => {
      const payload = {
        title: { en: 'Unofficial Rumor Notice' },
        content: { en: 'Rumor circulating on social media' },
        category: 'advisory',
        is_official: true,
        source_url: 'https://random-blog.com/news/123', // Not a government domain!
        audit_reason: 'Testing trust validation',
      };

      const res = await request(app)
        .post('/v1/admin/news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Official label can only be granted when source URL is a verified official government');
    });

    it('rejects news creation if audit_reason is missing', async () => {
      const payload = {
        title: { en: 'Missing Reason Notice' },
        content: { en: 'Some content' },
        category: 'general',
      };

      const res = await request(app)
        .post('/v1/admin/news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('administrative audit reason is strictly required');
    });

    it('updates a news post and creates audit log with old and new values', async () => {
      const res = await request(app)
        .patch('/v1/admin/news/news-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          priority: 'high',
          audit_reason: 'Elevating priority due to expected evening rush.',
        });

      expect(res.status).toBe(200);

      // Verify audit log has recorded old and new values
      const log = mockAuditLogs.find((l) => l.action === 'news.update');
      expect(log).toBeDefined();
      expect(log.entity_id).toBe('news-1');
      expect(log.reason).toBe('Elevating priority due to expected evening rush.');
    });

    it('deletes a news post and logs deletion in audit table', async () => {
      const res = await request(app)
        .delete('/v1/admin/news/news-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ audit_reason: 'Obsolete test announcement removed.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const delLog = mockAuditLogs.find((l) => l.action === 'news.delete');
      expect(delLog).toBeDefined();
      expect(delLog.entity_id).toBe('news-1');
      expect(delLog.reason).toBe('Obsolete test announcement removed.');
    });
  });

  // ----------------------------------------------------
  // 5. FCM TOPIC TARGETING ON PUBLISH WITH NOTIFY
  // ----------------------------------------------------
  describe('FCM Topic Targeting on Publish', () => {
    it('dispatches multilingual FCM notifications to category, ghat and language topics', async () => {
      const payload = {
        title: {
          en: 'Bridge Traffic Diverted',
          te: 'వంతెన ట్రాఫిక్ మళ్లించబడింది',
          hi: 'पुल यातायात डायवर्ट किया गया',
        },
        content: {
          en: 'Vehicles diverted away from Godavari bridge.',
          te: 'గోదావరి వంతెన వైపు వాహనాలు నిలిపివేయబడ్డాయి.',
          hi: 'गोदावरी पुल से वाहनों का मार्ग बदला गया।',
        },
        category: 'traffic',
        priority: 'high',
        ghat_ids: ['ghat-kotilingala'],
        publish_status: 'published',
        notify: true,
        audit_reason: 'Urgent traffic management update announced by district police.',
      };

      const res = await request(app)
        .post('/v1/admin/news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.meta.notificationSent).toBe(true);

      const history = FCMService.getSentHistory();
      expect(history.length).toBeGreaterThan(0);

      // Verify dispatch contains Telugu, Hindi and English topics
      const teluguCategoryNotif = history.find((n) => n.topic === 'news_traffic_te');
      expect(teluguCategoryNotif).toBeDefined();
      expect(teluguCategoryNotif?.title).toBe('వంతెన ట్రాఫిక్ మళ్లించబడింది');
      expect(teluguCategoryNotif?.language).toBe('te');

      const hindiCategoryNotif = history.find((n) => n.topic === 'news_traffic_hi');
      expect(hindiCategoryNotif).toBeDefined();
      expect(hindiCategoryNotif?.title).toBe('पुल यातायात डायवर्ट किया गया');
      expect(hindiCategoryNotif?.language).toBe('hi');

      const ghatTopicNotif = history.find((n) => n.topic === 'ghat_ghat-kotilingala_en');
      expect(ghatTopicNotif).toBeDefined();
    });
  });

  // ----------------------------------------------------
  // 6. RBAC PERMISSION ENFORCEMENT
  // ----------------------------------------------------
  describe('RBAC Permission Checks', () => {
    it('denies news creation to non-admin users with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/v1/admin/news')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({
          title: { en: 'Hacker post' },
          content: { en: 'Should be blocked' },
          audit_reason: 'Testing authorization',
        });

      expect(res.status).toBe(403);
    });

    it('denies news deletion without authentication with 401 Unauthorized', async () => {
      const res = await request(app).delete('/v1/admin/news/news-1');
      expect(res.status).toBe(401);
    });
  });

  // ----------------------------------------------------
  // 7. GHAT FACILITIES MANAGEMENT & AUDIT LOGGING
  // ----------------------------------------------------
  describe('Ghat Facilities Management (Public & Admin)', () => {
    it('GET /v1/ghats/:id/facilities returns facilities for a given ghat', async () => {
      const res = await request(app).get('/v1/ghats/ghat-kotilingala/facilities');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].facility_type).toBe('drinking_water');
    });

    it('POST /v1/admin/ghats/:id/facilities adds a facility with audit log', async () => {
      const payload = {
        facility_type: 'medical_camp',
        details: { en: 'First Aid & Ambulance Post 2', te: 'ప్రథమ చికిత్స కేంద్రం 2', hi: 'प्राथमिक चिकित्सा केंद्र 2' },
        is_operational: true,
        count: 2,
        source_url: 'https://eastgodavari.ap.gov.in/health',
        audit_reason: 'District medical officer deployed second ambulance post.',
      };

      const res = await request(app)
        .post('/v1/admin/ghats/ghat-kotilingala/facilities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.facility_type).toBe('medical_camp');

      const facAudit = mockAuditLogs.find((l) => l.action === 'facility.create');
      expect(facAudit).toBeDefined();
      expect(facAudit.reason).toBe(payload.audit_reason);
    });

    it('PATCH /v1/admin/ghats/:ghatId/facilities/:facilityId updates status with audit log', async () => {
      const res = await request(app)
        .patch('/v1/admin/ghats/ghat-kotilingala/facilities/fac-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          is_operational: false,
          audit_reason: 'Water filtration pipe under temporary maintenance.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.is_operational).toBe(false);

      const updateLog = mockAuditLogs.find((l) => l.action === 'facility.update');
      expect(updateLog).toBeDefined();
      expect(updateLog.reason).toBe('Water filtration pipe under temporary maintenance.');
    });
  });

  // ----------------------------------------------------
  // 8. DRAFT TRANSLATION ASSISTANCE
  // ----------------------------------------------------
  describe('POST /v1/admin/news/draft-translate', () => {
    it('produces draft Telugu and Hindi translations for admin editor review', async () => {
      const res = await request(app)
        .post('/v1/admin/news/draft-translate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Urgent: High crowd at Pushkar ghat',
          content: 'District administration advisory on water level.',
          summary: 'Pushkar ghat advisory',
          sourceLang: 'en',
        });

      expect(res.status).toBe(200);
      const { data } = res.body;
      expect(data.title.en).toBe('Urgent: High crowd at Pushkar ghat');
      // Telugu translation contains domain keywords
      expect(data.title.te).toContain('అత్యవసరం:');
      expect(data.title.te).toContain('పుష్కర ఘాట్');
      // Hindi translation contains domain keywords
      expect(data.title.hi).toContain('अति आवश्यक:');
      expect(data.title.hi).toContain('पुष्कर घाट');
    });
  });
});

