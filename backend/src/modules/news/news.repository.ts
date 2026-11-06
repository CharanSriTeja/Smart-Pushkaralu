import { query } from '../../db/index.js';
import {
  NewsPost,
  NewsQueryParams,
  CreateNewsInput,
  UpdateNewsInput,
  SupportedLanguage,
} from '../../types/news.js';
import { isOfficialGovernmentUrl } from '../../utils/trustVerifier.js';

export class NewsRepository {
  /**
   * Helper to format localized fields on a news post
   */
  private static formatLocalizedPost(post: any, language?: SupportedLanguage): NewsPost {
    const titleObj = typeof post.title === 'string' ? JSON.parse(post.title) : post.title;
    const contentObj = typeof post.content === 'string' ? JSON.parse(post.content) : post.content;
    const summaryObj = post.summary
      ? typeof post.summary === 'string'
        ? JSON.parse(post.summary)
        : post.summary
      : null;

    const lang = language || 'en';
    const localized_title = titleObj?.[lang] || titleObj?.en || '';
    const localized_content = contentObj?.[lang] || contentObj?.en || '';
    const localized_summary =
      summaryObj?.[lang] || summaryObj?.en || localized_content.substring(0, 160);

    const is_expired = post.expires_at ? new Date(post.expires_at) <= new Date() : false;

    return {
      ...post,
      title: titleObj,
      content: contentObj,
      summary: summaryObj,
      ghat_ids: Array.isArray(post.ghat_ids) ? post.ghat_ids : [],
      is_pinned: Boolean(post.is_pinned),
      is_official: Boolean(post.is_official),
      notify_sent: Boolean(post.notify_sent),
      localized_title,
      localized_content,
      localized_summary,
      is_expired,
    };
  }

  /**
   * Public / Admin search for news posts
   */
  static async findNews(params: NewsQueryParams): Promise<{ news: NewsPost[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    // Filter by publish status
    if (params.includeExpired) {
      if (params.publishStatus) {
        conditions.push(`publish_status = $${idx++}`);
        values.push(params.publishStatus);
      }
    } else {
      // Public default: strictly published and non-expired
      conditions.push(`publish_status = 'published'`);
      conditions.push(`(expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`);
    }

    // Category filter
    if (params.category) {
      conditions.push(`category = $${idx++}`);
      values.push(params.category);
    }

    // Ghat filter: matches either explicit ghat tag or global news with empty ghat_ids
    if (params.ghat) {
      conditions.push(`($${idx++} = ANY(ghat_ids) OR ghat_ids = '{}' OR ghat_ids IS NULL)`);
      values.push(params.ghat);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countSql = `SELECT COUNT(*) AS total FROM news_posts ${whereClause}`;
    const countRes = await query<{ total: string }>(countSql, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Ordering: pinned first, then priority (urgent -> high -> normal -> low), then published_at DESC
    const orderClause = `
      ORDER BY 
        is_pinned DESC,
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END ASC,
        published_at DESC NULLS LAST,
        created_at DESC
    `;

    const limit = Math.min(params.limit || 50, 100);
    const offset = params.offset || 0;
    values.push(limit);
    const limitIdx = idx++;
    values.push(offset);
    const offsetIdx = idx++;

    const selectSql = `
      SELECT * FROM news_posts
      ${whereClause}
      ${orderClause}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const { rows } = await query<any>(selectSql, values);
    const news = rows.map((r) => this.formatLocalizedPost(r, params.language));

    return { news, total };
  }

  /**
   * Find single news item by ID
   */
  static async findById(id: string, language?: SupportedLanguage): Promise<NewsPost | null> {
    const { rows } = await query<any>(
      `SELECT * FROM news_posts WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.formatLocalizedPost(rows[0], language);
  }

  /**
   * Create a new news post
   */
  static async create(data: CreateNewsInput, createdBy?: string): Promise<NewsPost> {
    // Official Flag Validation: Strict Trust Enforcement
    let isOfficial = Boolean(data.is_official);
    if (isOfficial) {
      if (!isOfficialGovernmentUrl(data.source_url)) {
        throw new Error(
          'Official label can only be granted when source URL is a verified official government or district portal (*.gov.in / *.nic.in).'
        );
      }
    }

    const publishStatus = data.publish_status || 'draft';
    const publishedAt =
      publishStatus === 'published'
        ? data.published_at || new Date().toISOString()
        : data.published_at || null;

    const { rows } = await query<any>(
      `INSERT INTO news_posts (
        title, content, summary, category, priority,
        ghat_ids, source_url, is_official, is_pinned,
        publish_status, published_at, expires_at, created_by,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        JSON.stringify(data.title),
        JSON.stringify(data.content),
        data.summary ? JSON.stringify(data.summary) : null,
        data.category,
        data.priority || 'normal',
        data.ghat_ids || [],
        data.source_url || null,
        isOfficial,
        Boolean(data.is_pinned),
        publishStatus,
        publishedAt,
        data.expires_at || null,
        createdBy || null,
      ]
    );

    return this.formatLocalizedPost(rows[0]);
  }

  /**
   * Update an existing news post
   */
  static async update(id: string, data: UpdateNewsInput): Promise<NewsPost | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    // Trust verification if official flag is modified or source_url changed
    const targetOfficial = data.is_official !== undefined ? data.is_official : existing.is_official;
    const targetSourceUrl = data.source_url !== undefined ? data.source_url : existing.source_url;

    if (targetOfficial && !isOfficialGovernmentUrl(targetSourceUrl)) {
      throw new Error(
        'Official label can only be granted when source URL is a verified official government or district portal (*.gov.in / *.nic.in).'
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(JSON.stringify(data.title));
    }
    if (data.content !== undefined) {
      updates.push(`content = $${idx++}`);
      values.push(JSON.stringify(data.content));
    }
    if (data.summary !== undefined) {
      updates.push(`summary = $${idx++}`);
      values.push(data.summary ? JSON.stringify(data.summary) : null);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${idx++}`);
      values.push(data.category);
    }
    if (data.priority !== undefined) {
      updates.push(`priority = $${idx++}`);
      values.push(data.priority);
    }
    if (data.ghat_ids !== undefined) {
      updates.push(`ghat_ids = $${idx++}`);
      values.push(data.ghat_ids);
    }
    if (data.source_url !== undefined) {
      updates.push(`source_url = $${idx++}`);
      values.push(data.source_url || null);
    }
    if (data.is_official !== undefined) {
      updates.push(`is_official = $${idx++}`);
      values.push(data.is_official);
    }
    if (data.is_pinned !== undefined) {
      updates.push(`is_pinned = $${idx++}`);
      values.push(data.is_pinned);
    }
    if (data.publish_status !== undefined) {
      updates.push(`publish_status = $${idx++}`);
      values.push(data.publish_status);
      if (data.publish_status === 'published' && !existing.published_at) {
        updates.push(`published_at = COALESCE(published_at, CURRENT_TIMESTAMP)`);
      }
    }
    if (data.published_at !== undefined) {
      updates.push(`published_at = $${idx++}`);
      values.push(data.published_at);
    }
    if (data.expires_at !== undefined) {
      updates.push(`expires_at = $${idx++}`);
      values.push(data.expires_at);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);
    const idIdx = idx++;

    const { rows } = await query<any>(
      `UPDATE news_posts
       SET ${updates.join(', ')}
       WHERE id = $${idIdx}
       RETURNING *`,
      values
    );

    return this.formatLocalizedPost(rows[0]);
  }

  /**
   * Delete a news post
   */
  static async delete(id: string): Promise<boolean> {
    const { rowCount } = await query('DELETE FROM news_posts WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }

  /**
   * Set notify_sent flag
   */
  static async markNotificationSent(id: string): Promise<void> {
    await query('UPDATE news_posts SET notify_sent = true WHERE id = $1', [id]);
  }
}

