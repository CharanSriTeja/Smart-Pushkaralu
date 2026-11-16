import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool, PoolClient } from 'pg';
import { env, getAdminPhoneList } from '../config/env.js';
import { sanitizeConnectionString } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use MIGRATION_DATABASE_URL (direct unpooled) when available, fallback to DATABASE_URL in dev
const migrationConnStr = sanitizeConnectionString(
  env.MIGRATION_DATABASE_URL || env.DATABASE_URL
);

const isRemoteOrSsl =
  migrationConnStr.includes('neon.tech') ||
  migrationConnStr.includes('sslmode=') ||
  env.NODE_ENV === 'production';

export const migrationPool = new Pool({
  connectionString: migrationConnStr,
  ssl: isRemoteOrSsl ? { rejectUnauthorized: false } : undefined,
  max: 2,
  connectionTimeoutMillis: 30000,
});

export async function runMigrations() {
  console.log('[Migrations] Connecting to database using direct migration connection...');
  const client: PoolClient = await migrationPool.connect();

  try {
    // Acquire session advisory lock to ensure sequential migration execution
    await client.query('SELECT pg_advisory_lock(987654321)');

    await client.query('BEGIN');

    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('[Migrations] No migrations directory found.');
      await client.query('COMMIT');
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM _migrations WHERE name = $1',
        [file]
      );
      if (rows.length === 0) {
        console.log(`[Migrations] Applying ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        console.log(`[Migrations] Applied ${file} successfully.`);
      } else {
        console.log(`[Migrations] ${file} already applied.`);
      }
    }

    // Seed the first super_admin from ADMIN_PHONES
    const adminPhones = getAdminPhoneList();
    if (adminPhones.length > 0) {
      const { rows: roleRows } = await client.query(
        "SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1"
      );
      if (roleRows.length > 0) {
        const superAdminRoleId = roleRows[0].id;
        for (const phone of adminPhones) {
          const { rows: userRows } = await client.query(
            'SELECT id FROM users WHERE phone = $1 LIMIT 1',
            [phone]
          );
          let userId: string;
          if (userRows.length === 0) {
            const { rows: newUserRows } = await client.query(
              `INSERT INTO users (firebase_uid, phone, name, language)
               VALUES ($1, $2, 'Super Admin', 'en')
               RETURNING id`,
              [`superadmin_${phone.replace(/\D/g, '')}`, phone]
            );
            userId = newUserRows[0].id;
          } else {
            userId = userRows[0].id;
          }

          await client.query(
            `INSERT INTO admins (user_id, role, role_id)
             VALUES ($1, 'super_admin', $2)
             ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', role_id = $2`,
            [userId, superAdminRoleId]
          );
          console.log(`[Migrations] Seeded super_admin user for phone ${phone}`);
        }
      }
    }

    await client.query('COMMIT');
    console.log('[Migrations] All migrations completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.query('SELECT pg_advisory_unlock(987654321)').catch(() => {});
    client.release();
  }
}

if (process.argv[1] === __filename) {
  runMigrations()
    .then(async () => {
      await migrationPool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Migrations] Failed:', err);
      await migrationPool.end();
      process.exit(1);
    });
}
