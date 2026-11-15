import { query } from '../src/db/index.js';

async function main() {
  console.log('Publishing all draft ghats in the database...');
  const res = await query("UPDATE ghats SET publish_status = 'published' WHERE publish_status = 'draft' RETURNING id");
  console.log(`Successfully published ${res.rowCount} ghats!`);

  const breakdown = await query("SELECT publish_status, count(*) FROM ghats GROUP BY publish_status");
  console.log('Updated status breakdown:', breakdown.rows);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

