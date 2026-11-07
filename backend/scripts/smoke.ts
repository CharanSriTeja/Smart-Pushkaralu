/**
 * Smart Pushkaralu 2027: Integration Smoke Test Suite
 * Exercises every public, authenticated, and admin API route.
 * Reports status code, latency, and PASS/FAIL.
 * Exits with code 0 if all pass, 1 if any fail.
 */

import request from 'supertest';
import { app } from '../src/app.js';
import { signAccessToken } from '../src/services/token.js';
import { pool } from '../src/db/index.js';

interface TestResult {
  method: string;
  route: string;
  expectedStatus: number | number[];
  actualStatus: number;
  latencyMs: number;
  passed: boolean;
  notes?: string;
}

const results: TestResult[] = [];

async function runStep(
  name: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  options: {
    token?: string;
    body?: any;
    expectedStatus: number | number[];
    notes?: string;
  }
): Promise<any> {
  const start = Date.now();
  let req: any;

  if (method === 'GET') req = request(app).get(path);
  else if (method === 'POST') req = request(app).post(path);
  else if (method === 'PATCH') req = request(app).patch(path);
  else if (method === 'PUT') req = request(app).put(path);
  else if (method === 'DELETE') req = request(app).delete(path);

  if (options.token) {
    req.set('Authorization', `Bearer ${options.token}`);
  }

  if (options.body) {
    req.send(options.body);
  }

  const res = await req;
  const latencyMs = Date.now() - start;

  const expectedList = Array.isArray(options.expectedStatus)
    ? options.expectedStatus
    : [options.expectedStatus];
  const passed = expectedList.includes(res.status);

  results.push({
    method,
    route: path,
    expectedStatus: options.expectedStatus,
    actualStatus: res.status,
    latencyMs,
    passed,
    notes: options.notes,
  });

  const statusBadge = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(
    `[${statusBadge}] ${method.padEnd(6)} ${path.padEnd(42)} -> ${res.status} (${latencyMs}ms)`
  );

  return res;
}

async function runAllSmokeTests() {
  console.log('='.repeat(80));
  console.log('🚀 SMART PUSHKARALU 2027: INTEGRATION SMOKE SUITE');
  console.log('='.repeat(80));

  // 1. Setup / Seed Smoke Test Users in Database
  const { rows: adminUserRows } = await pool.query(`
    INSERT INTO users (firebase_uid, phone, name, language, status)
    VALUES ('smoke_admin_uid', '+919999999999', 'District Collector (Super Admin)', 'en', 'active')
    ON CONFLICT (phone) DO UPDATE SET status = 'active'
    RETURNING id, phone, firebase_uid
  `);
  const adminUserId = adminUserRows[0].id;

  await pool.query(`
    INSERT INTO admins (user_id, role)
    VALUES ($1, 'super_admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin'
  `, [adminUserId]);

  const { rows: regularUserRows } = await pool.query(`
    INSERT INTO users (firebase_uid, phone, name, language, status)
    VALUES ('smoke_user_uid', '+919888877777', 'Smoke Pilgrim', 'en', 'active')
    ON CONFLICT (phone) DO UPDATE SET status = 'active'
    RETURNING id, phone, firebase_uid
  `);
  const regularUserId = regularUserRows[0].id;

  const superAdminToken = signAccessToken({
    userId: adminUserId,
    phone: adminUserRows[0].phone,
    firebaseUid: adminUserRows[0].firebase_uid,
    isAdmin: true,
  });

  const regularUserToken = signAccessToken({
    userId: regularUserId,
    phone: regularUserRows[0].phone,
    firebaseUid: regularUserRows[0].firebase_uid,
    isAdmin: false,
  });

  // --- 1. HEALTH CHECK ---
  await runStep('Health Check', 'GET', '/v1/health', { expectedStatus: 200 });

  // --- 2. PUBLIC SETTINGS ---
  await runStep('Public Settings', 'GET', '/v1/settings/public', { expectedStatus: 200 });

  // --- 3. GHATS (PUBLIC) ---
  const ghatsRes = await runStep('List Ghats', 'GET', '/v1/ghats', { expectedStatus: 200 });
  const sampleGhatId = ghatsRes.body?.data?.[0]?.id || 'sample-ghat-id';

  await runStep('Get Ghat Details', 'GET', `/v1/ghats/${sampleGhatId}`, { expectedStatus: [200, 404] });
  await runStep('Get Ghat Notices', 'GET', `/v1/ghats/${sampleGhatId}/notices`, { expectedStatus: [200, 404] });
  await runStep('Get Ghat Facilities', 'GET', `/v1/ghats/${sampleGhatId}/facilities`, { expectedStatus: [200, 404] });
  await runStep('Get Ghat Crowd', 'GET', `/v1/ghats/${sampleGhatId}/crowd`, { expectedStatus: [200, 404] });
  await runStep('Get Ghat Nearby Places', 'GET', `/v1/ghats/${sampleGhatId}/nearby`, { expectedStatus: [200, 404] });

  // --- 4. NEWS (PUBLIC) ---
  const newsRes = await runStep('List News', 'GET', '/v1/news', { expectedStatus: 200 });
  const sampleNewsId = newsRes.body?.data?.[0]?.id || 'sample-news-id';
  await runStep('Get Single News', 'GET', `/v1/news/${sampleNewsId}`, { expectedStatus: [200, 404] });

  // --- 5. EMERGENCY SOS (PUBLIC) ---
  await runStep('Emergency Contacts List', 'GET', '/v1/emergency-contacts', { expectedStatus: 200 });

  const sosRes = await runStep('Trigger Emergency SOS (App)', 'POST', '/v1/sos', {
    expectedStatus: 201,
    body: {
      type: 'medical',
      channel: 'app',
      lat: 17.0005,
      lng: 81.7725,
      accuracy_m: 10,
      phone: '+919988776655',
      language: 'en',
    },
  });

  const createdSosId = sosRes.body?.data?.id;
  const statusToken = sosRes.body?.data?.statusToken;

  if (createdSosId && statusToken) {
    await runStep('Get SOS Alert Status', 'GET', `/v1/sos/${createdSosId}/status?token=${statusToken}`, {
      expectedStatus: 200,
    });

    await runStep('Cancel SOS Alert', 'POST', `/v1/sos/${createdSosId}/cancel`, {
      expectedStatus: 200,
      body: {
        token: statusToken,
        reason: 'Smoke test auto-cancellation',
      },
    });
  }

  // --- 6. ISSUES / GRIEVANCES (PUBLIC) ---
  const issueRes = await runStep('Submit Issue', 'POST', '/v1/issues', {
    expectedStatus: [200, 201],
    body: {
      category: 'sanitation',
      description: 'Smoke test grievance ticket for verification',
      location_type: 'gps',
      lat: 17.0001,
      lng: 81.7721,
      reporter_phone: '+919988776655',
    },
  });

  const ticketNo = issueRes.body?.data?.ticket_no || issueRes.body?.ticket_no;
  if (ticketNo) {
    await runStep('Get Issue By Ticket', 'GET', `/v1/issues/${ticketNo}`, { expectedStatus: 200 });
  }

  await runStep('My Issues (Device Fingerprint)', 'GET', '/v1/issues/mine?device_fingerprint=smoke-device-123', {
    expectedStatus: 200,
  });

  await runStep('Request Issue Upload URL', 'POST', '/v1/issues/upload-url', {
    expectedStatus: 200,
    body: {
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
    },
  });

  // --- 7. AUTH & USER PROFILE ---
  await runStep('Get Current User Profile', 'GET', '/v1/me', {
    token: regularUserToken,
    expectedStatus: 200,
  });

  await runStep('Update Current User Language', 'PATCH', '/v1/me', {
    token: regularUserToken,
    body: { language: 'te' },
    expectedStatus: 200,
  });

  // --- 8. PERMISSION ENFORCEMENT & SECURITY CHECKS ---
  await runStep('Admin Settings (Unauthenticated 401)', 'GET', '/v1/admin/settings', {
    expectedStatus: 401,
  });

  await runStep('Admin Settings (Regular User 403 Forbidden)', 'GET', '/v1/admin/settings', {
    token: regularUserToken,
    expectedStatus: 403,
  });

  await runStep('Admin Audit Logs (Unauthenticated 401)', 'GET', '/v1/admin/audit-logs', {
    expectedStatus: 401,
  });

  await runStep('Admin SOS (Unauthenticated 401)', 'GET', '/v1/admin/sos', {
    expectedStatus: 401,
  });

  await runStep('Admin Places (Unauthenticated 401)', 'GET', '/v1/admin/places/curated', {
    expectedStatus: 401,
  });

  // --- 9. ADMIN OPERATIONS (SUPER ADMIN) ---
  await runStep('Admin Settings (Super Admin 200)', 'GET', '/v1/admin/settings', {
    token: superAdminToken,
    expectedStatus: 200,
  });

  await runStep('Admin Audit Logs (Super Admin 200)', 'GET', '/v1/admin/audit-logs', {
    token: superAdminToken,
    expectedStatus: 200,
  });

  await runStep('Admin API Usage Stats (Super Admin 200)', 'GET', '/v1/admin/usage', {
    token: superAdminToken,
    expectedStatus: 200,
  });

  await runStep('Admin List Issues (Super Admin 200)', 'GET', '/v1/admin/issues', {
    token: superAdminToken,
    expectedStatus: 200,
  });

  await runStep('Admin List SOS Alerts (Super Admin 200)', 'GET', '/v1/admin/sos', {
    token: superAdminToken,
    expectedStatus: 200,
  });

  await runStep('Admin List QR SOS Zones (Super Admin 200)', 'GET', '/v1/admin/sos/zones', {
    token: superAdminToken,
    expectedStatus: 200,
  });

  await runStep('Admin List Emergency Contacts (Super Admin 200)', 'GET', '/v1/admin/sos/contacts', {
    token: superAdminToken,
    expectedStatus: 200,
  });

  await runStep('Admin List Curated Places (Super Admin 200)', 'GET', '/v1/admin/places/curated', {
    token: superAdminToken,
    expectedStatus: 200,
  });

  await runStep('Admin List Place Overrides (Super Admin 200)', 'GET', '/v1/admin/places/overrides', {
    token: superAdminToken,
    expectedStatus: 200,
  });

  await runStep('Admin Get Places Cache Status (Super Admin 200)', 'GET', '/v1/admin/places/cache-status', {
    token: superAdminToken,
    expectedStatus: 200,
  });

  // --- 10. INPUT VALIDATION & ERROR SHAPE CHECK (NEGATIVE CASES) ---
  const invalidGhat = await runStep('Invalid Ghat Creation (Missing fields 400)', 'POST', '/v1/admin/ghats', {
    token: superAdminToken,
    body: { name: { en: '' } }, // missing mandatory fields
    expectedStatus: 400,
  });
  if (invalidGhat.body?.error?.code && invalidGhat.body?.error?.message) {
    console.log('  ↳ Verified error envelope shape: { error: { code, message, details? } }');
  }

  const invalidSos = await runStep('Invalid SOS Type (Bad Enum 400)', 'POST', '/v1/sos', {
    body: { type: 'invalid_type_abc' },
    expectedStatus: 400,
  });
  if (invalidSos.body?.error?.code) {
    console.log('  ↳ Verified Zod validation envelope rejection.');
  }

  console.log('='.repeat(80));

  // --- SUMMARY REPORT ---
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const avgLatency = Math.round(
    results.reduce((acc, r) => acc + r.latencyMs, 0) / (total || 1)
  );

  console.log(`SUMMARY: ${passed}/${total} routes PASSED (${failed} failed)`);
  console.log(`AVERAGE LATENCY: ${avgLatency}ms`);
  console.log('='.repeat(80));

  await pool.end();

  if (failed > 0) {
    console.error('\x1b[31mSmoke test suite FAILED with errors.\x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[32mAll smoke tests completed successfully!\x1b[0m');
    process.exit(0);
  }
}

runAllSmokeTests().catch(async (err) => {
  console.error('[Smoke Test] Fatal crash:', err);
  await pool.end();
  process.exit(1);
});
