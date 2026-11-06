import { PlacesService } from '../modules/places/places.service.js';

export class CachePrewarmJob {
  private static timer: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Runs a single pass to pre-warm the cache for all published ghats.
   */
  static async runOnce(): Promise<{ ghatsCount: number; warmedEntries: number; skippedFresh: number }> {
    if (this.isRunning) {
      console.log('[CachePrewarmJob] Pre-warm job is already running, skipping overlapping pass.');
      return { ghatsCount: 0, warmedEntries: 0, skippedFresh: 0 };
    }

    this.isRunning = true;
    try {
      console.log('[CachePrewarmJob] Executing cache pre-warming pass...');
      const result = await PlacesService.prewarmPublishedGhats();
      return result;
    } catch (err: any) {
      console.error('[CachePrewarmJob] Error running cache pre-warm job:', err.message || err);
      return { ghatsCount: 0, warmedEntries: 0, skippedFresh: 0 };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Starts periodic execution of the cache pre-warm job (default: every 12 hours).
   */
  static start(intervalMs = 12 * 60 * 60 * 1000, initialDelayMs = 5000): void {
    if (this.timer) {
      return;
    }

    // Schedule initial pass after startup delay
    setTimeout(() => {
      this.runOnce().catch(() => {});
    }, initialDelayMs);

    // Schedule periodic sweeps
    this.timer = setInterval(() => {
      this.runOnce().catch(() => {});
    }, intervalMs);

    console.log(`[CachePrewarmJob] Scheduled background cache pre-warm job (interval: ${intervalMs}ms)`);
  }

  /**
   * Stops the periodic execution timer.
   */
  static stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[CachePrewarmJob] Stopped background cache pre-warm job');
    }
  }
}
