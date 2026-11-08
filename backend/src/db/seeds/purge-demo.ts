import { pool, withTransaction } from '../index.js';

export async function purgeDemoData(): Promise<void> {
  console.log('[Purge:Demo] Starting safe deletion of all rows marked is_demo=true...');

  await withTransaction(async (client) => {
    const tables = [
      'seva_videos',
      'external_links',
      'shuttle_routes',
      'rail_stations',
      'special_services',
      'bus_routes',
      'transport_hubs',
      'sos_alerts',
      'places',
      'issues',
      'news_posts',
      'ghats',
    ];

    for (const table of tables) {
      const colCheck = await client.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'is_demo'`,
        [table]
      );
      if (colCheck.rows.length > 0) {
        const res = await client.query(`DELETE FROM ${table} WHERE is_demo = true`);
        console.log(`[Purge:Demo] Deleted ${res.rowCount || 0} demo rows from ${table}.`);
      }
    }
  });

  console.log('[Purge:Demo] All demo data purged successfully.');
}

if (process.argv[1]?.endsWith('purge-demo.ts')) {
  purgeDemoData()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Purge:Demo] Failed:', err);
      await pool.end();
      process.exit(1);
    });
}

