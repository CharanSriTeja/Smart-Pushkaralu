import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import * as firebaseService from '../src/services/firebase.js';
import * as db from '../src/db/index.js';
import { signAccessToken, hashToken } from '../src/services/token.js';
import { env } from '../src/config/env.js';

describe('Smart Pushkaralu Backend Auth Tests', () => {
  // In-memory mock database tables
  let mockUsers: any[] = [];
  let mockTokens: any[] = [];
  let mockAdmins: any[] = [];

  beforeEach(() => {
    mockUsers = [];
    mockTokens = [];
    mockAdmins = [];
    vi.restoreAllMocks();

    // Mock db.query to act as an in-memory SQL handler for auth operations
    vi.spyOn(db, 'query').mockImplementation(async (sql: string, params: any[] = []) => {
      const normalizedSql = sql.toLowerCase().replace(/\s+/g, ' ');

      // SELECT 1 FROM admins WHERE user_id = $1
      if (normalizedSql.includes('from admins where user_id')) {
        const userId = params[0];
        const match = mockAdmins.filter((a) => a.user_id === userId);
        return { rows: match, rowCount: match.length } as any;
      }

      // SELECT * FROM users WHERE id = $1
      if (normalizedSql.includes('select * from users where id = $1')) {
        const userId = params[0];
        const match = mockUsers.filter((u) => u.id === userId);
        return { rows: match, rowCount: match.length } as any;
      }

      // SELECT * FROM users WHERE firebase_uid = $1 OR phone = $2
      if (normalizedSql.includes('where firebase_uid = $1 or phone = $2')) {
        const [fUid, phone] = params;
        const match = mockUsers.filter((u) => u.firebase_uid === fUid || u.phone === phone);
        return { rows: match, rowCount: match.length } as any;
      }

      // INSERT INTO users
      if (normalizedSql.includes('insert into users')) {
        const [firebase_uid, phone, name, language, consent_version, consent_at, last_login_at] = params;
        const newUser = {
          id: 'user-uuid-' + (mockUsers.length + 1),
          firebase_uid,
          phone,
          name: name || null,
          language: language || 'en',
          status: 'active',
          consent_version: consent_version || null,
          consent_at: consent_at || null,
          created_at: new Date(),
          last_login_at: last_login_at || new Date(),
        };
        mockUsers.push(newUser);
        return { rows: [newUser], rowCount: 1 } as any;
      }

      // UPDATE users SET last_login_at
      if (normalizedSql.includes('update users') && normalizedSql.includes('last_login_at')) {
        const [last_login_at, fUid, id] = params;
        const user = mockUsers.find((u) => u.id === id);
        if (user) {
          user.last_login_at = last_login_at;
          user.firebase_uid = fUid;
          return { rows: [user], rowCount: 1 } as any;
        }
      }

      // UPDATE users SET name / language / consent
      if (normalizedSql.includes('update users set')) {
        const user = mockUsers[0];
        if (user) {
          if (params.includes('Telugu')) user.language = 'te';
          return { rows: [user], rowCount: 1 } as any;
        }
      }

      // DELETE FROM users WHERE id = $1
      if (normalizedSql.includes('delete from users where id = $1')) {
        const userId = params[0];
        const initialCount = mockUsers.length;
        mockUsers = mockUsers.filter((u) => u.id !== userId);
        mockTokens = mockTokens.filter((t) => t.user_id !== userId);
        return { rowCount: initialCount - mockUsers.length } as any;
      }

      // INSERT INTO refresh_tokens
      if (normalizedSql.includes('insert into refresh_tokens')) {
        const [user_id, token_hash, expires_at] = params;
        const record = {
          id: 'token-uuid-' + (mockTokens.length + 1),
          user_id,
          token_hash,
          expires_at,
          revoked_at: null,
          created_at: new Date(),
        };
        mockTokens.push(record);
        return { rows: [record], rowCount: 1 } as any;
      }

      // SELECT * FROM refresh_tokens WHERE token_hash = $1
      if (normalizedSql.includes('from refresh_tokens where token_hash = $1')) {
        const hash = params[0];
        const match = mockTokens.filter((t) => t.token_hash === hash);
        return { rows: match, rowCount: match.length } as any;
      }

      // UPDATE refresh_tokens SET revoked_at = NOW()
      if (normalizedSql.includes('update refresh_tokens set revoked_at = now()')) {
        const hash = params[0];
        const token = mockTokens.find((t) => t.token_hash === hash && t.revoked_at === null);
        if (token) {
          token.revoked_at = new Date();
          return { rowCount: 1 } as any;
        }
        return { rowCount: 0 } as any;
      }

      return { rows: [], rowCount: 0 } as any;
    });
  });

  it('GET /v1/health returns ok', async () => {
    const res = await request(app).get('/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('smart-pushkaralu-backend');
  });

  describe('1. Token Verification (Mocked Firebase Admin SDK)', () => {
    it('successfully logs in or registers a new user with verified Firebase ID token', async () => {
      // Mock Firebase Admin verifyIdToken
      vi.spyOn(firebaseService, 'verifyFirebaseIdToken').mockResolvedValue({
        uid: 'firebase-user-123',
        phone_number: '+919876543210',
      } as any);

      const res = await request(app)
        .post('/v1/auth/firebase')
        .send({
          idToken: 'mock-valid-firebase-id-token',
          name: 'Anand Kumar',
          language: 'te',
          consentVersion: 'v1.0',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.isNewUser).toBe(true);
      expect(res.body.user.phone).toBe('+919876543210');
      expect(res.body.user.language).toBe('te');
      expect(mockUsers.length).toBe(1);
      expect(mockTokens.length).toBe(1);
    });

    it('rejects an invalid Firebase ID token with 401', async () => {
      vi.spyOn(firebaseService, 'verifyFirebaseIdToken').mockRejectedValue(
        new Error('Firebase ID token has expired')
      );

      const res = await request(app)
        .post('/v1/auth/firebase')
        .send({
          idToken: 'invalid-or-expired-token',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('FIREBASE_AUTH_FAILED');
    });
  });

  describe('2. Refresh Token Rotation', () => {
    it('rotates refresh token and revokes the old one', async () => {
      // Setup existing user and refresh token
      const existingUser = {
        id: 'user-1',
        firebase_uid: 'f-1',
        phone: '+919876543210',
        name: 'Pilgrim 1',
        language: 'en',
        status: 'active',
        created_at: new Date(),
        last_login_at: new Date(),
      };
      mockUsers.push(existingUser);

      const rawRefreshToken = 'initial-secure-refresh-token';
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      mockTokens.push({
        id: 'token-1',
        user_id: 'user-1',
        token_hash: hashToken(rawRefreshToken),
        expires_at: expiresAt,
        revoked_at: null,
      });

      const res = await request(app)
        .post('/v1/auth/refresh')
        .send({ refreshToken: rawRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.refreshToken).not.toBe(rawRefreshToken);

      // Verify old token is revoked
      const oldRecord = mockTokens.find((t) => t.token_hash === hashToken(rawRefreshToken));
      expect(oldRecord?.revoked_at).not.toBeNull();

      // Verify new token is stored
      const newHash = hashToken(res.body.refreshToken);
      const newRecord = mockTokens.find((t) => t.token_hash === newHash);
      expect(newRecord).toBeDefined();
      expect(newRecord?.revoked_at).toBeNull();
    });
  });

  describe('3. Expired or Revoked Refresh Token Rejection', () => {
    it('rejects an expired refresh token with 401', async () => {
      const rawRefreshToken = 'expired-token';
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago

      mockTokens.push({
        id: 'token-exp',
        user_id: 'user-1',
        token_hash: hashToken(rawRefreshToken),
        expires_at: pastDate,
        revoked_at: null,
      });

      const res = await request(app)
        .post('/v1/auth/refresh')
        .send({ refreshToken: rawRefreshToken });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('EXPIRED_REFRESH_TOKEN');
    });

    it('rejects an already revoked refresh token with 401', async () => {
      const rawRefreshToken = 'already-revoked-token';
      const futureDate = new Date(Date.now() + 1000 * 60 * 60);

      mockTokens.push({
        id: 'token-rev',
        user_id: 'user-1',
        token_hash: hashToken(rawRefreshToken),
        expires_at: futureDate,
        revoked_at: new Date(),
      });

      const res = await request(app)
        .post('/v1/auth/refresh')
        .send({ refreshToken: rawRefreshToken });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('REVOKED_REFRESH_TOKEN');
    });
  });

  describe('4. Account Deletion and Access Control', () => {
    it('deletes user account and invalidates tokens via DELETE /v1/me', async () => {
      const user = {
        id: 'user-delete-test',
        firebase_uid: 'f-delete',
        phone: '+919999988888',
        name: 'Delete Me',
        language: 'en',
        status: 'active',
        created_at: new Date(),
      };
      mockUsers.push(user);

      const token = signAccessToken({
        userId: user.id,
        phone: user.phone,
        firebaseUid: user.firebase_uid,
        isAdmin: false,
      });

      const res = await request(app)
        .delete('/v1/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockUsers.find((u) => u.id === user.id)).toBeUndefined();
    });

    it('rejects access when token is expired', async () => {
      // Craft an expired JWT
      const expiredToken = jwt.sign(
        { userId: 'user-1', phone: '+919999999999', firebaseUid: 'f-1', isAdmin: false },
        env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/v1/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('5. Admin Allowlist Check', () => {
    it('grants admin privileges if phone is in ADMIN_PHONES allowlist', async () => {
      const adminPhone = '+919876543210';
      // Temporarily add phone to env
      const originalAdminPhones = env.ADMIN_PHONES;
      (env as any).ADMIN_PHONES = '+919876543210,+919999999999';

      vi.spyOn(firebaseService, 'verifyFirebaseIdToken').mockResolvedValue({
        uid: 'admin-firebase-uid',
        phone_number: adminPhone,
      } as any);

      const res = await request(app)
        .post('/v1/auth/firebase')
        .send({ idToken: 'admin-token' });

      expect(res.status).toBe(200);
      expect(res.body.user.isAdmin).toBe(true);

      // Verify the JWT also contains isAdmin = true
      const decoded = jwt.decode(res.body.accessToken) as any;
      expect(decoded.isAdmin).toBe(true);

      (env as any).ADMIN_PHONES = originalAdminPhones;
    });

    it('denies admin privileges if phone is not in allowlist or admins table', async () => {
      (env as any).ADMIN_PHONES = '+919999999999';

      vi.spyOn(firebaseService, 'verifyFirebaseIdToken').mockResolvedValue({
        uid: 'regular-user-uid',
        phone_number: '+918888888888',
      } as any);

      const res = await request(app)
        .post('/v1/auth/firebase')
        .send({ idToken: 'regular-user-token' });

      expect(res.status).toBe(200);
      expect(res.body.user.isAdmin).toBe(false);

      const decoded = jwt.decode(res.body.accessToken) as any;
      expect(decoded.isAdmin).toBe(false);
    });
  });
});

