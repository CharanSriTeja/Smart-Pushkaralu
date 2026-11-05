import { query } from '../db/index.js';
import { getAdminPhoneList } from '../config/env.js';

export interface UserRecord {
  id: string;
  firebase_uid: string;
  phone: string;
  name: string | null;
  language: string;
  status: string;
  consent_version: string | null;
  consent_at: Date | null;
  created_at: Date;
  last_login_at: Date | null;
}

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export async function isUserAdmin(userId: string, phone: string): Promise<boolean> {
  // Check ADMIN_PHONES env variable first
  const adminPhones = getAdminPhoneList();
  if (adminPhones.includes(phone)) {
    return true;
  }

  // Check admins table
  const { rows } = await query(
    'SELECT 1 FROM admins WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return rows.length > 0;
}

export async function getUserPermissions(
  userId: string,
  phone?: string
): Promise<{ isSuperAdmin: boolean; permissions: string[] }> {
  // Check ADMIN_PHONES env variable first
  if (phone && getAdminPhoneList().includes(phone)) {
    return { isSuperAdmin: true, permissions: ['*'] };
  }

  const { rows } = await query<{ role_name: string; permission_name: string | null }>(
    `SELECT r.name as role_name, p.name as permission_name
     FROM admins a
     JOIN roles r ON a.role_id = r.id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON rp.permission_id = p.id
     WHERE a.user_id = $1`,
    [userId]
  );

  if (rows.length === 0) {
    return { isSuperAdmin: false, permissions: [] };
  }

  const isSuperAdmin = rows.some((r) => r.role_name === 'super_admin');
  const permissions = rows
    .map((r) => r.permission_name)
    .filter((p): p is string => Boolean(p));

  return { isSuperAdmin, permissions };
}

export async function userHasPermission(
  userId: string,
  phone: string | undefined,
  permission: string
): Promise<boolean> {
  const { isSuperAdmin, permissions } = await getUserPermissions(userId, phone);
  if (isSuperAdmin) {
    return true;
  }
  return permissions.includes(permission);
}

export async function findUserById(userId: string): Promise<UserRecord | null> {
  const { rows } = await query<UserRecord>(
    'SELECT * FROM users WHERE id = $1 LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

export async function findOrCreateUser(data: {
  firebaseUid: string;
  phone: string;
  name?: string;
  language?: string;
  consentVersion?: string;
}): Promise<{ user: UserRecord; isNewUser: boolean }> {
  const existing = await query<UserRecord>(
    'SELECT * FROM users WHERE firebase_uid = $1 OR phone = $2 LIMIT 1',
    [data.firebaseUid, data.phone]
  );

  const now = new Date();

  if (existing.rows.length > 0) {
    const user = existing.rows[0];
    // Update last_login_at and make sure firebase_uid is synchronized
    const { rows } = await query<UserRecord>(
      `UPDATE users
       SET last_login_at = $1,
           firebase_uid = $2
       WHERE id = $3
       RETURNING *`,
      [now, data.firebaseUid, user.id]
    );
    return { user: rows[0], isNewUser: false };
  }

  // Create new user
  const consentAt = data.consentVersion ? now : null;
  const { rows } = await query<UserRecord>(
    `INSERT INTO users (firebase_uid, phone, name, language, consent_version, consent_at, last_login_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.firebaseUid,
      data.phone,
      data.name || null,
      data.language || 'en',
      data.consentVersion || null,
      consentAt,
      now,
    ]
  );

  return { user: rows[0], isNewUser: true };
}

export async function updateUser(
  userId: string,
  updates: {
    name?: string;
    language?: string;
    consentVersion?: string;
  }
): Promise<UserRecord | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(updates.name);
  }

  if (updates.language !== undefined) {
    fields.push(`language = $${index++}`);
    values.push(updates.language);
  }

  if (updates.consentVersion !== undefined) {
    fields.push(`consent_version = $${index++}`);
    values.push(updates.consentVersion);
    fields.push(`consent_at = $${index++}`);
    values.push(new Date());
  }

  if (fields.length === 0) {
    return findUserById(userId);
  }

  values.push(userId);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;
  const { rows } = await query<UserRecord>(sql, values);
  return rows[0] || null;
}

export async function deleteUser(userId: string): Promise<boolean> {
  // Cascades to refresh_tokens and admins
  const { rowCount } = await query('DELETE FROM users WHERE id = $1', [userId]);
  return (rowCount ?? 0) > 0;
}

export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<RefreshTokenRecord> {
  const { rows } = await query<RefreshTokenRecord>(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, tokenHash, expiresAt]
  );
  return rows[0];
}

export async function findRefreshToken(
  tokenHash: string
): Promise<RefreshTokenRecord | null> {
  const { rows } = await query<RefreshTokenRecord>(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1',
    [tokenHash]
  );
  return rows[0] || null;
}

export async function revokeRefreshToken(tokenHash: string): Promise<boolean> {
  const { rowCount } = await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
    [tokenHash]
  );
  return (rowCount ?? 0) > 0;
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<boolean> {
  const { rowCount } = await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
  return (rowCount ?? 0) > 0;
}

