import { NewsExpiryJob } from '../src/jobs/newsExpiryJob.js';
import { pool } from '../src/db/index.js';

async function main() {
  console.log('[Standalone Job] Running news expiry job...');
  try {
    const result = await NewsExpiryJob.runOnce();
    console.log(`[Standalone Job] News expiry completed: expired ${result.expiredCount} posts.`);
    await pool.end();
    process.exit(0);
  } catch (err: any) {
    console.error('[Standalone Job] News expiry failed:', err);
    await pool.end();
    process.exit(1);
  }
}

main();
