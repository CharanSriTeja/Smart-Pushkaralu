import { query } from '../db/index.js';

export class NewsExpiryJob {
  private static timer: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Executes a single pass to mark past-expiry posts as 'expired'.
   * Returns count of updated posts.
   */
  static async runOnce(): Promise<{ expiredCount: number; expiredIds: string[] }> {
    if (this.isRunning) {
      return { expiredCount: 0, expiredIds: [] };
    }

    this.isRunning = true;
    try {
      const { rows } = await query<{ id: string }>(
        `UPDATE news_posts
         SET publish_status = 'expired',
             updated_at = CURRENT_TIMESTAMP
         WHERE publish_status = 'published'
           AND expires_at IS NOT NULL
           AND expires_at <= CURRENT_TIMESTAMP
         RETURNING id`
      );

      const expiredIds = rows.map((r) => r.id);
      if (expiredIds.length > 0) {
        console.log(`[NewsExpiryJob] Expired ${expiredIds.length} news posts:`, expiredIds);
      }

      return {
        expiredCount: expiredIds.length,
        expiredIds,
      };
    } catch (err: any) {
      console.error('[NewsExpiryJob] Error expiring news posts:', err.message || err);
      return { expiredCount: 0, expiredIds: [] };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Starts periodic execution of the expiry job
   */
  static start(intervalMs = 60000): void {
    if (this.timer) {
      return;
    }

    // Run initial pass immediately
    this.runOnce().catch(() => {});

    // Schedule periodic sweeps
    this.timer = setInterval(() => {
      this.runOnce().catch(() => {});
    }, intervalMs);

    console.log(`[NewsExpiryJob] Started background post expiry job (interval: ${intervalMs}ms)`);
  }

  /**
   * Stops the periodic execution timer
   */
  static stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[NewsExpiryJob] Stopped background post expiry job');
    }
  }
}

