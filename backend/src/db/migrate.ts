import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, withTransaction } from './index.js';
import { getAdminPhoneList } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('[Migrations] Connecting to database...');
  await withTransaction(async (client) => {
    // Ensure migrations table exists
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
          // Find or create user
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

          // Link to admins table with role_id
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
  });
  console.log('[Migrations] All migrations completed.');
}

if (process.argv[1] === __filename) {
  runMigrations()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Migrations] Failed:', err);
      await pool.end();
      process.exit(1);
    });
}
