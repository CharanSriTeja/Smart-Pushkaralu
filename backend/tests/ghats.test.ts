import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as db from '../src/db/index.js';
import { signAccessToken } from '../src/services/token.js';
import { GODAVARI_GHATS_SEED } from '../src/db/seeds/001_seed_ghats.js';
import { calculateHaversineDistance, isWithinGhatProximity } from '../src/utils/geo.js';
import { isOfficialGovernmentUrl, evaluateOfficialApproval } from '../src/utils/trustVerifier.js';

describe('Module 3: Ghat Information & Trust Engine Tests', () => {
  let mockGhats: any[] = [];
  let mockCrowdStatus: any[] = [];
  let mockCrowdReports: any[] = [];
  let mockAuditLogs: any[] = [];
  let mockNotices: any[] = [];
  let mockFacilities: any[] = [];

  const adminToken = signAccessToken({
    userId: 'admin-uuid-1',
    phone: '+919876543210',
    firebaseUid: 'admin-f-uid',
    isAdmin: true,
  });

  const regularUserToken = signAccessToken({
    userId: 'user-uuid-2',
    phone: '+919111122223',
    firebaseUid: 'user-f-uid',
    isAdmin: false,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    mockAuditLogs = [];
    mockCrowdReports = [];
    mockNotices = [];
    mockFacilities = [];

    // Initialize mock ghats from seed data
    mockGhats = GODAVARI_GHATS_SEED.map((g, idx) => {
      const ghatId = `ghat-uuid-${idx + 1}`;
      
      // Populate facilities
      g.facilities.forEach((f, fIdx) => {
        mockFacilities.push({
          id: `fac-${ghatId}-${fIdx}`,
          ghat_id: ghatId,
          facility_type: f.facility_type,
          details: f.details,
          is_operational: f.is_operational,
          count: f.count,
        });
      });

      // Populate notices
      if (g.notices) {
        g.notices.forEach((n, nIdx) => {
          mockNotices.push({
            id: `notice-${ghatId}-${nIdx}`,
            ghat_id: ghatId,
            title: n.title,
            message: n.message,
            severity: n.severity,
            is_active: n.is_active,
            starts_at: new Date().toISOString(),
            ends_at: null,
          });
        });
      }

      return {
        id: ghatId,
        name: g.name,
        river: g.river,
        district: g.district,
        state: g.state,
        lat: g.lat,
        lng: g.lng,
        nearest_town: g.nearest_town,
        nearest_railway_station: g.nearest_railway_station,
        nearest_bus_stand: g.nearest_bus_stand,
        official_source_url: g.official_source_url,
        verified_at: g.verified_at,
        record_status: g.record_status,
        bathing_status: g.bathing_status,
        crowd_level: g.crowd_level,
        publish_status: g.publish_status,
        description: g.description,
        max_capacity: g.max_capacity,
        created_at: new Date('2026-09-01T00:00:00Z'),
        updated_at: new Date('2026-09-01T00:00:00Z'),
      };
    });

    mockCrowdStatus = mockGhats.map((g) => ({
      id: `cs-${g.id}`,
      ghat_id: g.id,
      current_level: g.crowd_level,
      source_type: g.record_status === 'officially_listed' ? 'sensor_or_camera' : 'default',
      confidence_score: 0.85,
      recent_report_count: 0,
      note: { en: 'Baseline status' },
      updated_at: new Date().toISOString(),
    }));

    // Mock DB queries
    vi.spyOn(db, 'query').mockImplementation(async (sql: string, params: any[] = []) => {
      const lowerSql = sql.toLowerCase().replace(/\s+/g, ' ');

      // PostGIS extension check
      if (lowerSql.includes("from pg_extension where extname = 'postgis'")) {
        return { rows: [{ extname: 'postgis' }], rowCount: 1 } as any;
      }

      // Check admin by user_id
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

      // SELECT from users where id = $1
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

      // INSERT INTO audit_logs
      if (lowerSql.includes('insert into audit_logs')) {
        const [admin_id, admin_email, action, entity_type, entity_id, old_values, new_values, source_url, reason, ip_address] = params;
        const newLog = {
          id: `audit-${mockAuditLogs.length + 1}`,
          admin_id,
          admin_email,
          action,
          entity_type,
          entity_id,
          old_values: old_values ? JSON.parse(old_values) : null,
          new_values: new_values ? JSON.parse(new_values) : null,
          source_url,
          reason,
          ip_address,
          created_at: new Date().toISOString(),
        };
        mockAuditLogs.push(newLog);
        return { rows: [newLog], rowCount: 1 } as any;
      }

      // SELECT COUNT(*) FROM audit_logs
      if (lowerSql.includes('count(*) as count from audit_logs')) {
        return { rows: [{ count: String(mockAuditLogs.length) }] } as any;
      }

      // SELECT FROM audit_logs
      if (lowerSql.includes('from audit_logs')) {
        return { rows: mockAuditLogs, rowCount: mockAuditLogs.length } as any;
      }

      // SELECT ghats (list query or count query)
      if (lowerSql.includes('select count(*) as total from ghats g')) {
        let filtered = mockGhats;
        if (!lowerSql.includes('includehidden')) {
          filtered = filtered.filter((g) => g.publish_status === 'published');
        }
        return { rows: [{ total: String(filtered.length) }], rowCount: 1 } as any;
      }

      if (lowerSql.includes('select g.*') && lowerSql.includes('from ghats g') && lowerSql.includes('left join crowd_status') && !lowerSql.includes('where g.id = $1')) {
        let results = [...mockGhats];

        // Filter publish_status
        if (!lowerSql.includes('includhidden')) {
          results = results.filter((g) => g.publish_status === 'published');
        }

        // State filter
        const stateIdx = params.findIndex((p) => typeof p === 'string' && (p.toLowerCase() === 'telangana' || p.toLowerCase() === 'andhra pradesh'));
        if (stateIdx !== -1) {
          const targetState = params[stateIdx].toLowerCase();
          results = results.filter((g) => g.state.toLowerCase() === targetState);
        }

        // District filter
        const distIdx = params.findIndex((p) => typeof p === 'string' && (p.toLowerCase().includes('godavari') || p.toLowerCase().includes('konaseema') || p.toLowerCase().includes('kothagudem')));
        if (distIdx !== -1) {
          const targetDist = params[distIdx].toLowerCase();
          results = results.filter((g) => g.district.toLowerCase() === targetDist);
        }

        // Crowd level filter
        const crowdLevels = ['low', 'medium', 'high', 'very_high', 'unknown'];
        const crowdParam = params.find((p) => crowdLevels.includes(p));
        if (crowdParam) {
          results = results.filter((g) => g.crowd_level === crowdParam);
        }

        // Bathing status filter
        const bathingStatuses = ['allowed', 'restricted', 'closed'];
        const bathingParam = params.find((p) => bathingStatuses.includes(p));
        if (bathingParam) {
          results = results.filter((g) => g.bathing_status === bathingParam);
        }

        // Distance calculation if near params exist (first two numeric params)
        const numericParams = params.filter((p) => typeof p === 'number');
        if (numericParams.length >= 2) {
          const userLat = numericParams[0];
          const userLng = numericParams[1];

          results = results.map((g) => {
            const distance_meters = calculateHaversineDistance(userLat, userLng, g.lat, g.lng);
            return {
              ...g,
              distance_meters,
              facilities: mockFacilities.filter((f) => f.ghat_id === g.id),
              active_notices: mockNotices.filter((n) => n.ghat_id === g.id),
            };
          });

          // Sort by distance
          results.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
        } else {
          results = results.map((g) => ({
            ...g,
            distance_meters: null,
            facilities: mockFacilities.filter((f) => f.ghat_id === g.id),
            active_notices: mockNotices.filter((n) => n.ghat_id === g.id),
          }));
        }

        return { rows: results, rowCount: results.length } as any;
      }

      // SELECT single ghat by id
      if (lowerSql.includes('select g.*') && lowerSql.includes('where g.id = $1')) {
        const id = params[0];
        const match = mockGhats.find((g) => g.id === id);
        if (!match) return { rows: [], rowCount: 0 } as any;
        const cs = mockCrowdStatus.find((c) => c.ghat_id === id);
        return { rows: [{ ...match, crowd_status: cs || null }], rowCount: 1 } as any;
      }

      // Relations queries
      if (lowerSql.includes('from ghat_sources where ghat_id = $1')) {
        const id = params[0];
        const ghat = mockGhats.find((g) => g.id === id);
        const sources = ghat?.official_source_url
          ? [
              {
                id: `src-${id}`,
                ghat_id: id,
                source_url: ghat.official_source_url,
                source_name: 'Official District Administration',
                source_type: 'district_portal',
                is_official: true,
                created_at: new Date().toISOString(),
              },
            ]
          : [];
        return { rows: sources, rowCount: sources.length } as any;
      }

      if (lowerSql.includes('from ghat_facilities where ghat_id = $1')) {
        const id = params[0];
        const list = mockFacilities.filter((f) => f.ghat_id === id);
        return { rows: list, rowCount: list.length } as any;
      }

      if (lowerSql.includes('from ghat_aarti_timings where ghat_id = $1')) {
        return {
          rows: [
            {
              id: 'aarti-1',
              name: { en: 'Evening Maha Aarti', te: 'సాయంత్రం మహా హారతి', hi: 'महा आरती' },
              time_start: '18:30:00',
              time_end: '19:15:00',
              days_of_week: 'Daily',
            },
          ],
          rowCount: 1,
        } as any;
      }

      if (lowerSql.includes('from ghat_notices where ghat_id = $1')) {
        const id = params[0];
        const list = mockNotices.filter((n) => n.ghat_id === id);
        return { rows: list, rowCount: list.length } as any;
      }

      // Crowd status query
      if (lowerSql.includes('from crowd_status where ghat_id = $1')) {
        const id = params[0];
        const cs = mockCrowdStatus.find((c) => c.ghat_id === id);
        return { rows: cs ? [cs] : [], rowCount: cs ? 1 : 0 } as any;
      }

      // Crowd reports rate limit check
      if (lowerSql.includes('from crowd_reports where device_fingerprint = $1 and ghat_id = $2')) {
        const [fp, ghatId] = params;
        const recent = mockCrowdReports.filter((r) => r.device_fingerprint === fp && r.ghat_id === ghatId);
        return { rows: recent, rowCount: recent.length } as any;
      }

      // INSERT crowd report
      if (lowerSql.includes('insert into crowd_reports')) {
        const [ghat_id, user_id, device_fingerprint, reported_crowd_level, reported_lat, reported_lng, distance_meters, is_verified_proximity, ip_address] = params;
        const newReport = {
          id: `cr-${mockCrowdReports.length + 1}`,
          ghat_id,
          user_id,
          device_fingerprint,
          reported_crowd_level,
          reported_lat,
          reported_lng,
          distance_meters,
          is_verified_proximity,
          ip_address,
          created_at: new Date().toISOString(),
        };
        mockCrowdReports.push(newReport);
        return { rows: [newReport], rowCount: 1 } as any;
      }

      // Aggregation of crowd reports
      if (lowerSql.includes('select reported_crowd_level, count(*) as count from crowd_reports')) {
        const ghatId = params[0];
        const reports = mockCrowdReports.filter((r) => r.ghat_id === ghatId && r.is_verified_proximity);
        const map: Record<string, number> = {};
        reports.forEach((r) => {
          map[r.reported_crowd_level] = (map[r.reported_crowd_level] || 0) + 1;
        });
        const rows = Object.entries(map).map(([reported_crowd_level, count]) => ({
          reported_crowd_level,
          count: String(count),
        }));
        return { rows, rowCount: rows.length } as any;
      }

      // INSERT/UPDATE crowd_status
      if (lowerSql.includes('insert into crowd_status')) {
        const ghatId = params[0];
        const level = params[1];
        let existing = mockCrowdStatus.find((c) => c.ghat_id === ghatId);
        if (!existing) {
          existing = {
            id: `cs-${ghatId}`,
            ghat_id: ghatId,
            current_level: level,
            source_type: params[2] || 'crowdsourced_aggregate',
            confidence_score: params[3] || 0.8,
            recent_report_count: params[4] || 1,
            note: params[5] ? JSON.parse(params[5]) : null,
            updated_at: new Date().toISOString(),
          };
          mockCrowdStatus.push(existing);
        } else {
          existing.current_level = level;
          if (lowerSql.includes("'official_override'")) {
            existing.source_type = 'official_override';
          } else if (params[2] && typeof params[2] === 'string') {
            existing.source_type = params[2];
          }
          existing.updated_at = new Date().toISOString();
        }
        return { rows: [existing], rowCount: 1 } as any;
      }

      // UPDATE ghats
      if (lowerSql.includes('update ghats set')) {
        const id = params[params.length - 1];
        const ghat = mockGhats.find((g) => g.id === id);
        if (ghat) {
          if (lowerSql.includes('publish_status = $1')) {
            ghat.publish_status = params[0];
          }
          if (lowerSql.includes('crowd_level = $1')) {
            ghat.crowd_level = params[0];
          }
          return { rows: [ghat], rowCount: 1 } as any;
        }
      }

      // INSERT INTO ghats
      if (lowerSql.includes('insert into ghats')) {
        const newGhat = {
          id: `ghat-new-${mockGhats.length + 1}`,
          name: JSON.parse(params[0]),
          river: params[1],
          district: params[2],
          state: params[3],
          lat: params[4],
          lng: params[5],
          nearest_town: JSON.parse(params[6]),
          nearest_railway_station: JSON.parse(params[7]),
          nearest_bus_stand: JSON.parse(params[8]),
          official_source_url: params[9],
          verified_at: params[10],
          record_status: params[11],
          bathing_status: params[12],
          crowd_level: params[13],
          publish_status: params[14],
          description: params[15] ? JSON.parse(params[15]) : null,
          max_capacity: params[16],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockGhats.push(newGhat);
        return { rows: [newGhat], rowCount: 1 } as any;
      }

      // INSERT INTO ghat_notices
      if (lowerSql.includes('insert into ghat_notices')) {
        const newNotice = {
          id: `notice-${mockNotices.length + 1}`,
          ghat_id: params[0],
          title: JSON.parse(params[1]),
          message: JSON.parse(params[2]),
          severity: params[3],
          is_active: params[4],
          starts_at: new Date().toISOString(),
          ends_at: null,
          created_at: new Date().toISOString(),
        };
        mockNotices.push(newNotice);
        return { rows: [newNotice], rowCount: 1 } as any;
      }

      return { rows: [], rowCount: 0 } as any;
    });
  });

  describe('1. Filter Engine Tests', () => {
    it('filters ghats by state (Telangana)', async () => {
      const res = await request(app).get('/v1/ghats?state=Telangana');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((g: any) => {
        expect(g.state.toLowerCase()).toBe('telangana');
      });
    });

    it('filters ghats by district (East Godavari)', async () => {
      const res = await request(app).get('/v1/ghats?district=East%20Godavari');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((g: any) => {
        expect(g.district).toBe('East Godavari');
      });
    });

    it('filters ghats by bathingStatus (allowed)', async () => {
      const res = await request(app).get('/v1/ghats?bathingStatus=allowed');
      expect(res.status).toBe(200);
      res.body.data.forEach((g: any) => {
        expect(g.bathing_status).toBe('allowed');
      });
    });

    it('filters ghats by crowdLevel (high)', async () => {
      const res = await request(app).get('/v1/ghats?crowdLevel=high');
      expect(res.status).toBe(200);
      res.body.data.forEach((g: any) => {
        expect(g.crowd_level).toBe('high');
      });
    });
  });

  describe('2. Geospatial Distance & Sorting Tests', () => {
    it('calculates distance and sorts nearest first when near=lat,lng is supplied', async () => {
      // Coords for Rajahmundry near Pushkar Ghat (17.0005, 81.7725)
      const res = await request(app).get('/v1/ghats?near=17.0005,81.7725');
      expect(res.status).toBe(200);
      const ghats = res.body.data;
      expect(ghats.length).toBeGreaterThan(1);

      // Verify distance_meters is calculated and ordered ascending
      for (let i = 0; i < ghats.length - 1; i++) {
        expect(ghats[i].distance_meters).toBeDefined();
        expect(ghats[i].distance_meters).toBeLessThanOrEqual(ghats[i + 1].distance_meters);
      }

      // First ghat should be Pushkar Ghat (0m or very close)
      expect(ghats[0].name.en).toBe('Pushkar Ghat');
      expect(ghats[0].distance_meters).toBeLessThan(100);
    });

    it('correctly handles Haversine distance formula utility', () => {
      // Distance between Pushkar Ghat (17.0005, 81.7725) and Kotilingala Ghat (16.9922, 81.7656)
      const distance = calculateHaversineDistance(17.0005, 81.7725, 16.9922, 81.7656);
      expect(distance).toBeGreaterThan(1000);
      expect(distance).toBeLessThan(1500); // approx ~1.17 km
    });
  });

  describe('3. Trust Engine & Disclaimer Verification', () => {
    it('attaches safety disclaimer to all ghat queries', async () => {
      const res = await request(app).get('/v1/ghats');
      expect(res.status).toBe(200);
      expect(res.body.data[0].safety_disclaimer).toBeDefined();
      expect(res.body.data[0].safety_disclaimer.en).toContain('Disclaimer: River currents');
      expect(res.body.data[0].safety_disclaimer.te).toContain('గమనిక: గోదావరి పుష్కరాల');
      expect(res.body.data[0].safety_disclaimer.hi).toContain('अस्वीकरण: गोदावरी');
    });

    it('never labels a ghat officially approved unless record_status is officially_listed with official gov url', () => {
      // 1. Official govt domain + officially_listed -> APPROVED
      const approved = evaluateOfficialApproval(
        'officially_listed',
        'https://eastgodavari.ap.gov.in/pushkaralu'
      );
      expect(approved.isOfficiallyApproved).toBe(true);
      expect(approved.trustCode).toBe('OFFICIAL_APPROVED');

      // 2. Officially listed BUT non-gov url (e.g. blog or random website) -> MUST NOT BE APPROVED
      const nonGov = evaluateOfficialApproval(
        'officially_listed',
        'https://myrandomblog.com/ghats'
      );
      expect(nonGov.isOfficiallyApproved).toBe(false);
      expect(nonGov.trustCode).toBe('UNVERIFIED');

      // 3. Unverified ghat with no url -> UNVERIFIED
      const unverified = evaluateOfficialApproval('unverified', null);
      expect(unverified.isOfficiallyApproved).toBe(false);
      expect(unverified.trustCode).toBe('UNVERIFIED');

      // 4. Community reported ghat -> COMMUNITY_REPORTED
      const reported = evaluateOfficialApproval('reported', 'https://localnews.com/peruru');
      expect(reported.isOfficiallyApproved).toBe(false);
      expect(reported.trustCode).toBe('COMMUNITY_REPORTED');
    });

    it('validates government domain whitelist helper', () => {
      expect(isOfficialGovernmentUrl('https://eastgodavari.ap.gov.in/pushkaralu')).toBe(true);
      expect(isOfficialGovernmentUrl('https://bhadradri.telangana.gov.in/temples')).toBe(true);
      expect(isOfficialGovernmentUrl('https://police.gov.in')).toBe(true);
      expect(isOfficialGovernmentUrl('https://ndrf.gov.in')).toBe(true);
      expect(isOfficialGovernmentUrl('https://wikipedia.org/wiki/Godavari')).toBe(false);
      expect(isOfficialGovernmentUrl('https://fakegovt.com')).toBe(false);
      expect(isOfficialGovernmentUrl(null)).toBe(false);
    });
  });

  describe('4. Publish Rules & Access Control', () => {
    it('hides draft or hidden ghats from public list', async () => {
      // Add a draft ghat
      mockGhats.push({
        id: 'ghat-draft-1',
        name: { en: 'Draft Secret Ghat' },
        river: 'Godavari',
        district: 'East Godavari',
        state: 'Andhra Pradesh',
        lat: 17.0,
        lng: 81.7,
        publish_status: 'draft',
      });

      const res = await request(app).get('/v1/ghats');
      expect(res.status).toBe(200);
      const found = res.body.data.find((g: any) => g.id === 'ghat-draft-1');
      expect(found).toBeUndefined();
    });

    it('allows admin to toggle publish status with audit logging', async () => {
      const ghatId = 'ghat-uuid-1';
      const res = await request(app)
        .patch(`/v1/admin/ghats/${ghatId}/publish-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          publish_status: 'hidden',
          reason: 'Emergency flood warning: Temporarily hiding ghat from public view',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.publish_status).toBe('hidden');

      // Verify audit log entry
      expect(mockAuditLogs.length).toBe(1);
      expect(mockAuditLogs[0].action).toBe('ghat.publish_status_change');
      expect(mockAuditLogs[0].entity_id).toBe(ghatId);
      expect(mockAuditLogs[0].reason).toContain('Emergency flood warning');
    });

    it('rejects publish status change from non-admin user with 401 or 403', async () => {
      const res = await request(app)
        .patch('/v1/admin/ghats/ghat-uuid-1/publish-status')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          publish_status: 'published',
          reason: 'Attempt by regular user',
        });

      expect([401, 403]).toContain(res.status);
    });
  });

  describe('5. Admin Operations & Mandatory Audit Logging', () => {
    it('creates a new ghat with audit logging when valid official source is provided', async () => {
      const newGhatPayload = {
        name: {
          en: 'Ramachandrapuram Special Ghat',
          te: 'రామచంద్రపురం ప్రత్యేక ఘాట్',
          hi: 'रामचंद्रपुरम विशेष घाट',
        },
        river: 'Godavari',
        district: 'Konaseema',
        state: 'Andhra Pradesh',
        lat: 16.85,
        lng: 82.02,
        nearest_town: { en: 'Ramachandrapuram' },
        nearest_railway_station: { en: 'Dwarapudi' },
        nearest_bus_stand: { en: 'RC Puram Bus Station' },
        official_source_url: 'https://konaseema.ap.gov.in/special-ghats',
        record_status: 'officially_listed',
        bathing_status: 'allowed',
        crowd_level: 'medium',
        publish_status: 'published',
        reason: 'District Collectorate officially approved new Pushkaralu auxiliary bathing ghat',
      };

      const res = await request(app)
        .post('/v1/admin/ghats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newGhatPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.name.en).toBe('Ramachandrapuram Special Ghat');

      // Verify audit log was created
      const audit = mockAuditLogs.find((l) => l.action === 'ghat.create');
      expect(audit).toBeDefined();
      expect(audit?.admin_id).toBe('admin-uuid-1');
      expect(audit?.reason).toContain('District Collectorate officially approved');
    });

    it('strictly forbids creating officially_listed ghat with non-governmental domain', async () => {
      const invalidPayload = {
        name: { en: 'Unofficial Beach Ghat' },
        river: 'Godavari',
        district: 'East Godavari',
        state: 'Andhra Pradesh',
        lat: 16.99,
        lng: 81.76,
        nearest_town: { en: 'Rajahmundry' },
        nearest_railway_station: { en: 'RJY' },
        nearest_bus_stand: { en: 'RTC' },
        official_source_url: 'https://commercialtravelsite.com/pushkar-ghat', // INVALID: not gov.in
        record_status: 'officially_listed',
        reason: 'Attempting to mark official without govt URL',
      };

      const res = await request(app)
        .post('/v1/admin/ghats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_OFFICIAL_SOURCE');
    });

    it('rejects admin modification without mandatory audit reason', async () => {
      const res = await request(app)
        .patch('/v1/admin/ghats/ghat-uuid-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bathing_status: 'closed',
          // reason intentionally omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('executes admin crowd status override with audit logging', async () => {
      const ghatId = 'ghat-uuid-1';
      const res = await request(app)
        .post(`/v1/admin/ghats/${ghatId}/crowd-override`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          crowd_level: 'very_high',
          reason: 'NDRF drone surveillance detected high density at main ramp',
          source_url: 'https://eastgodavari.ap.gov.in/control-room/advisory-24',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.current_level).toBe('very_high');
      expect(res.body.data.source_type).toBe('official_override');

      const audit = mockAuditLogs.find((l) => l.action === 'ghat.crowd_override');
      expect(audit).toBeDefined();
      expect(audit?.reason).toContain('NDRF drone surveillance');
    });
  });

  describe('6. Crowd Report & Proximity Verification Tests', () => {
    it('verifies on-site crowd report within 1000m proximity', async () => {
      const ghatId = 'ghat-uuid-2'; // Pushkar Ghat at 17.0005, 81.7725

      const res = await request(app)
        .post('/v1/crowd-reports')
        .send({
          ghat_id: ghatId,
          reported_crowd_level: 'high',
          lat: 17.0008, // ~35 meters from ghat
          lng: 81.7726,
          device_fingerprint: 'device-fp-pilgrim-101',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_verified_proximity).toBe(true);
      expect(res.body.data.distance_meters).toBeLessThan(100);
    });

    it('detects off-site crowd report beyond 1000m proximity', async () => {
      const ghatId = 'ghat-uuid-2'; // Pushkar Ghat Rajahmundry (17.0005, 81.7725)

      const res = await request(app)
        .post('/v1/crowd-reports')
        .send({
          ghat_id: ghatId,
          reported_crowd_level: 'low',
          lat: 17.0500, // ~6 km away
          lng: 81.7725,
          device_fingerprint: 'device-fp-pilgrim-remote-202',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.is_verified_proximity).toBe(false);
      expect(res.body.data.distance_meters).toBeGreaterThan(1000);
    });

    it('rate-limits duplicate crowd report from same device within 15 minutes', async () => {
      const ghatId = 'ghat-uuid-2';
      const fp = 'device-spam-test-303';

      // First report succeeds
      const first = await request(app)
        .post('/v1/crowd-reports')
        .send({
          ghat_id: ghatId,
          reported_crowd_level: 'medium',
          lat: 17.0005,
          lng: 81.7725,
          device_fingerprint: fp,
        });
      expect(first.status).toBe(201);

      // Immediate second report should be rate limited
      const second = await request(app)
        .post('/v1/crowd-reports')
        .send({
          ghat_id: ghatId,
          reported_crowd_level: 'very_high',
          lat: 17.0005,
          lng: 81.7725,
          device_fingerprint: fp,
        });

      expect(second.status).toBe(429);
      expect(second.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
