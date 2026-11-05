import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, withTransaction } from './index.js';

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

