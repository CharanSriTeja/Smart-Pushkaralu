import { CachePrewarmJob } from '../src/jobs/cachePrewarmJob.js';
import { pool } from '../src/db/index.js';

async function main() {
  console.log('[Standalone Job] Running cache prewarm job...');
  try {
    const result = await CachePrewarmJob.runOnce();
    console.log(`[Standalone Job] Cache prewarm completed: ${result.warmedEntries} entries warmed for ${result.ghatsCount} ghats.`);
    await pool.end();
    process.exit(0);
  } catch (err: any) {
    console.error('[Standalone Job] Cache prewarm failed:', err);
    await pool.end();
    process.exit(1);
  }
}

main();
