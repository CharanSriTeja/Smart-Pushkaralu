import { query } from '../src/db/index.js';

async function main() {
  const sample = await query("SELECT id, name, publish_status, district, state FROM ghats WHERE publish_status = 'draft' LIMIT 5");
  console.log('Sample draft ghats:');
  console.log(JSON.stringify(sample.rows, null, 2));

  const countByStatus = await query("SELECT publish_status, count(*) FROM ghats GROUP BY publish_status");
  console.log('Breakdown by status:');
  console.log(JSON.stringify(countByStatus.rows, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

