import { query } from '../../db/index.js';
import { SevaVideoRecord, LocalizedSevaString } from '../../types/seva.js';

// Curated initial seed records for Godavari Pushkaralu virtual darshan
const INITIAL_IN_MEMORY_VIDEOS: SevaVideoRecord[] = [
  {
    id: 'seva-live-harathi-01',
    youtube_id: 'dQw4w9WgXcQ', // Default demo placeholder id or live stream
    youtube_url: 'https://www.youtube.com/live/dQw4w9WgXcQ',
    title_en: 'Maha Pushkar Godavari Harathi - Live Evening Darshan',
    title_te: 'మహా పుష్కర గోదావరి హారతి - ప్రత్యక్ష ప్రసారం',
    title_hi: 'महा पुष्कर गोदावरी महा आरती - सीधा प्रसारण',
    description_en: 'Live streaming of sacred Godavari Nithya Harathi performed by Vedic priests at Pushkar Ghat, Rajahmundry.',
    description_te: 'రాజమండ్రి పుష్కర్ ఘాట్ వద్ద వేద పండితులచే నిర్వహించబడుతున్న దివ్య గోదావరి హారతి ప్రత్యక్ష ప్రసారం.',
    description_hi: 'पुष्कर घाट, राजमुंदरी पर वैदिक पुजारियों द्वारा पवित्र गोदावरी नित्य महा आरती का सीधा प्रसारण।',
    category: 'aarthi',
    ghat_id: 'pushkar-ghat-01',
    ghat_name: {
      en: 'Pushkar Ghat, Rajahmundry',
      te: 'పుష్కర్ ఘాట్, రాజమండ్రి',
      hi: 'पुष्कर घाट, राजमुंदरी',
    },
    event_date: new Date().toISOString(),
    is_live: true,
    published: true,
    sort_order: 1,
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    view_count: 14200,
    created_at: '2026-11-01T06:00:00Z',
    updated_at: '2026-11-01T06:00:00Z',
  },
  {
    id: 'seva-kotilingala-rudrabhishekam-02',
    youtube_id: 'C0DPdy98e4c',
    youtube_url: 'https://www.youtube.com/watch?v=C0DPdy98e4c',
    title_en: 'Sri Kotilingeswara Swamy Maha Rudrabhishekam',
    title_te: 'శ్రీ కోటిలింగేశ్వర స్వామి మహా రుద్రాభిషేకం',
    title_hi: 'श्री कोटिलिंगेश्वर स्वामी महा रुद्राभिषेक',
    description_en: 'Sacred Rudrabhishekam performed on the holy banks of Godavari during Pushkaralu festival.',
    description_te: 'పుష్కరాల సందర్భంగా గోదావరి తీరాన నిర్వహించిన పవిత్ర రుద్రాభిషేక దృశ్యాలు.',
    description_hi: 'पुष्करालु महोत्सव के दौरान गोदावरी के पावन तट पर आयोजित पवित्र रुद्राभिषेक।',
    category: 'pooja',
    ghat_id: 'kotilingala-ghat-02',
    ghat_name: {
      en: 'Kotilingala Ghat, Rajahmundry',
      te: 'కోటిలింగాల ఘాట్, రాజమండ్రి',
      hi: 'कोटिशिंगला घाट, राजमुंदरी',
    },
    event_date: '2026-11-02T04:30:00Z',
    is_live: false,
    published: true,
    sort_order: 2,
    thumbnail_url: 'https://img.youtube.com/vi/C0DPdy98e4c/hqdefault.jpg',
    view_count: 8900,
    created_at: '2026-11-02T05:00:00Z',
    updated_at: '2026-11-02T05:00:00Z',
  },
  {
    id: 'seva-cultural-classical-03',
    youtube_id: '9bZkp7q19f0',
    youtube_url: 'https://youtu.be/9bZkp7q19f0',
    title_en: 'Pushkara Shobha: Kuchipudi Dance Festival at Saraswathi Ghat',
    title_te: 'పుష్కర శోభ: సరస్వతి ఘాట్ వద్ద కూచిపూడి నృత్యోత్సవం',
    title_hi: 'पुष्कर शोभा: सरस्वती घाट पर कुचिपुड़ी नृत्य महोत्सव',
    description_en: 'Grand cultural showcase celebrating Godavari river heritage featuring renowned classical artists.',
    description_te: 'గోదావరి నదీ వైభవాన్ని చాటిచెప్పే కూచిపూడి కళాకారుల శాస్త్రీయ నృత్య ప్రదర్శన.',
    description_hi: 'गोदावरी नदी की सांस्कृतिक विरासत को प्रदर्शित करने वाला भव्य कुचिपुड़ी शास्त्रीय नृत्य कार्यक्रम।',
    category: 'cultural',
    ghat_id: 'saraswathi-ghat-03',
    ghat_name: {
      en: 'Saraswathi Ghat, Rajahmundry',
      te: 'సరస్వతి ఘాట్, రాజమండ్రి',
      hi: 'सरस्वती घाट, राजमुंदरी',
    },
    event_date: '2026-11-03T18:00:00Z',
    is_live: false,
    published: true,
    sort_order: 3,
    thumbnail_url: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg',
    view_count: 5320,
    created_at: '2026-11-03T19:00:00Z',
    updated_at: '2026-11-03T19:00:00Z',
  },
  {
    id: 'seva-snanam-guide-04',
    youtube_id: 'kJQP7kiw5Fk',
    youtube_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    title_en: 'Pushkara Punya Snanam Ritual Procedures & Guidelines',
    title_te: 'పుష్కర పుణ్య స్నాన విధి విధానాలు & సూచనలు',
    title_hi: 'पुष्कर पुण्य स्नान विधि और महत्वपूर्ण दिशा-निर्देश',
    description_en: 'Official priest guidance on the traditional rituals, sankalpam, and sacred bath timings.',
    description_te: 'పుష్కర పుణ్యస్నానం ఆచరించే పద్ధతులు, సంకల్పం మరియు ముఖ్య సూచనలపై పండితుల వివరణ.',
    description_hi: 'पुष्कर पुण्य स्नान करने की विधि, संकल्प एवं पवित्र स्नान समय पर विद्वानों का मार्गदर्शन।',
    category: 'snanam',
    ghat_id: 'pushkar-ghat-01',
    ghat_name: {
      en: 'Pushkar Ghat, Rajahmundry',
      te: 'పుష్కర్ ఘాట్, రాజమండ్రి',
      hi: 'पुष्कर घाट, राजमुंदरी',
    },
    event_date: '2026-11-04T07:00:00Z',
    is_live: false,
    published: true,
    sort_order: 4,
    thumbnail_url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    view_count: 12050,
    created_at: '2026-11-04T08:00:00Z',
    updated_at: '2026-11-04T08:00:00Z',
  },
  {
    id: 'seva-draft-unpub-05',
    youtube_id: '3JZ_D3ELwOQ',
    youtube_url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    title_en: 'Upcoming: VIP Pushkar Bath Preparation Preview (Draft)',
    title_te: 'రాబోయే కార్యక్రమం: వీఐపీ ఘాట్ ఏర్పాట్లు (చిత్తుప్రతి)',
    title_hi: 'आगामी: वीआईपी घाट व्यवस्था पूर्वावलोकन (प्रारूप)',
    description_en: 'Internal preview video for administrative review.',
    description_te: 'పరిపాలనా సమీక్ష కోసం అంతర్గత వీడియో.',
    description_hi: 'प्रशासनिक समीक्षा के लिए आंतरिक वीडियो।',
    category: 'general',
    ghat_id: null,
    ghat_name: null,
    event_date: '2026-11-10T10:00:00Z',
    is_live: false,
    published: false, // Unpublished draft
    sort_order: 5,
    thumbnail_url: 'https://img.youtube.com/vi/3JZ_D3ELwOQ/hqdefault.jpg',
    view_count: 0,
    created_at: '2026-11-05T10:00:00Z',
    updated_at: '2026-11-05T10:00:00Z',
  },
];

class SevaRepository {
  private inMemoryVideos: SevaVideoRecord[] = [...INITIAL_IN_MEMORY_VIDEOS];

  /**
   * Public feed of published videos with optional filters for category, ghat_id, and live status.
   * Sorted by is_live DESC, sort_order ASC, event_date DESC.
   */
  async findPublishedVideos(filters: {
    category?: string;
    ghat_id?: string;
    is_live?: boolean;
  }): Promise<SevaVideoRecord[]> {
    try {
      const conditions: string[] = ['published = true'];
      const params: any[] = [];

      if (filters.category && filters.category !== 'all') {
        params.push(filters.category);
        conditions.push(`category = $${params.length}`);
      }

      if (filters.ghat_id) {
        params.push(filters.ghat_id);
        conditions.push(`ghat_id = $${params.length}`);
      }

      if (typeof filters.is_live === 'boolean') {
        params.push(filters.is_live);
        conditions.push(`is_live = $${params.length}`);
      }

      const sql = `
        SELECT v.*, g.name as ghat_name_json
        FROM seva_videos v
        LEFT JOIN ghats g ON v.ghat_id = g.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY v.is_live DESC, v.sort_order ASC, v.event_date DESC
      `;

      const { rows } = await query<any>(sql, params);
      if (rows && rows.length > 0) {
        return rows.map(this.mapRowToRecord);
      }
    } catch {
      // In-memory fallback
    }

    return this.inMemoryVideos
      .filter((v) => {
        if (!v.published) return false;
        if (filters.category && filters.category !== 'all' && v.category !== filters.category) return false;
        if (filters.ghat_id && v.ghat_id !== filters.ghat_id) return false;
        if (typeof filters.is_live === 'boolean' && v.is_live !== filters.is_live) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.is_live !== b.is_live) return a.is_live ? -1 : 1;
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
      });
  }

  /**
   * Find video by ID. If includeUnpublished is false, only published videos are returned.
   */
  async findVideoById(id: string, includeUnpublished = false): Promise<SevaVideoRecord | null> {
    try {
      const conditions = ['v.id = $1'];
      if (!includeUnpublished) {
        conditions.push('v.published = true');
      }

      const sql = `
        SELECT v.*, g.name as ghat_name_json
        FROM seva_videos v
        LEFT JOIN ghats g ON v.ghat_id = g.id
        WHERE ${conditions.join(' AND ')}
        LIMIT 1
      `;

      const { rows } = await query<any>(sql, [id]);
      if (rows && rows.length > 0) {
        return this.mapRowToRecord(rows[0]);
      }
    } catch {
      // In-memory fallback
    }

    const video = this.inMemoryVideos.find((v) => v.id === id);
    if (!video) return null;
    if (!includeUnpublished && !video.published) return null;
    return video;
  }

  /**
   * Admin video list returning all videos (including drafts) with category and publication filters.
   */
  async findAllAdminVideos(filters?: {
    category?: string;
    published?: boolean;
    is_live?: boolean;
  }): Promise<SevaVideoRecord[]> {
    try {
      const conditions: string[] = ['1=1'];
      const params: any[] = [];

      if (filters?.category && filters.category !== 'all') {
        params.push(filters.category);
        conditions.push(`category = $${params.length}`);
      }

      if (typeof filters?.published === 'boolean') {
        params.push(filters.published);
        conditions.push(`published = $${params.length}`);
      }

      if (typeof filters?.is_live === 'boolean') {
        params.push(filters.is_live);
        conditions.push(`is_live = $${params.length}`);
      }

      const sql = `
        SELECT v.*, g.name as ghat_name_json
        FROM seva_videos v
        LEFT JOIN ghats g ON v.ghat_id = g.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY v.sort_order ASC, v.event_date DESC
      `;

      const { rows } = await query<any>(sql, params);
      if (rows && rows.length > 0) {
        return rows.map(this.mapRowToRecord);
      }
    } catch {
      // In-memory fallback
    }

    return this.inMemoryVideos
      .filter((v) => {
        if (filters?.category && filters.category !== 'all' && v.category !== filters.category) return false;
        if (typeof filters?.published === 'boolean' && v.published !== filters.published) return false;
        if (typeof filters?.is_live === 'boolean' && v.is_live !== filters.is_live) return false;
        return true;
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  /**
   * Create video in DB and in-memory fallback.
   */
  async createVideo(record: SevaVideoRecord): Promise<SevaVideoRecord> {
    try {
      const sql = `
        INSERT INTO seva_videos (
          id, youtube_id, youtube_url, title_en, title_te, title_hi,
          description_en, description_te, description_hi, category,
          ghat_id, event_date, is_live, published, sort_order,
          thumbnail_url, view_count, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19
        ) RETURNING *
      `;

      const { rows } = await query<any>(sql, [
        record.id,
        record.youtube_id,
        record.youtube_url,
        record.title_en,
        record.title_te,
        record.title_hi || null,
        record.description_en || null,
        record.description_te || null,
        record.description_hi || null,
        record.category,
        record.ghat_id || null,
        record.event_date,
        record.is_live,
        record.published,
        record.sort_order,
        record.thumbnail_url,
        record.view_count || 0,
        record.created_at,
        record.updated_at,
      ]);

      if (rows && rows.length > 0) {
        const created = this.mapRowToRecord(rows[0]);
        this.inMemoryVideos.push(created);
        return created;
      }
    } catch {
      // In-memory fallback
    }

    this.inMemoryVideos.push(record);
    return record;
  }

  /**
   * Update video in DB and in-memory fallback.
   */
  async updateVideo(id: string, updates: Partial<SevaVideoRecord>): Promise<SevaVideoRecord | null> {
    const existing = await this.findVideoById(id, true);
    if (!existing) return null;

    const merged: SevaVideoRecord = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      const sql = `
        UPDATE seva_videos SET
          youtube_id = $2,
          youtube_url = $3,
          title_en = $4,
          title_te = $5,
          title_hi = $6,
          description_en = $7,
          description_te = $8,
          description_hi = $9,
          category = $10,
          ghat_id = $11,
          event_date = $12,
          is_live = $13,
          published = $14,
          sort_order = $15,
          thumbnail_url = $16,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const { rows } = await query<any>(sql, [
        id,
        merged.youtube_id,
        merged.youtube_url,
        merged.title_en,
        merged.title_te,
        merged.title_hi || null,
        merged.description_en || null,
        merged.description_te || null,
        merged.description_hi || null,
        merged.category,
        merged.ghat_id || null,
        merged.event_date,
        merged.is_live,
        merged.published,
        merged.sort_order,
        merged.thumbnail_url,
      ]);

      if (rows && rows.length > 0) {
        const updated = this.mapRowToRecord(rows[0]);
        const idx = this.inMemoryVideos.findIndex((v) => v.id === id);
        if (idx >= 0) this.inMemoryVideos[idx] = updated;
        return updated;
      }
    } catch {
      // In-memory fallback
    }

    const idx = this.inMemoryVideos.findIndex((v) => v.id === id);
    if (idx >= 0) {
      this.inMemoryVideos[idx] = merged;
      return merged;
    }
    return null;
  }

  /**
   * Delete video by ID.
   */
  async deleteVideo(id: string): Promise<boolean> {
    try {
      await query('DELETE FROM seva_videos WHERE id = $1', [id]);
    } catch {
      // In-memory fallback
    }

    const initialLength = this.inMemoryVideos.length;
    this.inMemoryVideos = this.inMemoryVideos.filter((v) => v.id !== id);
    return this.inMemoryVideos.length < initialLength;
  }

  /**
   * Reorder videos in bulk.
   */
  async reorderVideos(items: { id: string; sort_order: number }[]): Promise<boolean> {
    for (const item of items) {
      try {
        await query('UPDATE seva_videos SET sort_order = $2, updated_at = NOW() WHERE id = $1', [
          item.id,
          item.sort_order,
        ]);
      } catch {
        // In-memory fallback
      }

      const match = this.inMemoryVideos.find((v) => v.id === item.id);
      if (match) {
        match.sort_order = item.sort_order;
        match.updated_at = new Date().toISOString();
      }
    }
    return true;
  }

  private mapRowToRecord(row: any): SevaVideoRecord {
    let ghat_name: LocalizedSevaString | null = null;
    if (row.ghat_name_json) {
      if (typeof row.ghat_name_json === 'object') {
        ghat_name = row.ghat_name_json;
      } else {
        try {
          ghat_name = JSON.parse(row.ghat_name_json);
        } catch {
          ghat_name = { en: row.ghat_name_json, te: row.ghat_name_json };
        }
      }
    }

    return {
      id: row.id,
      youtube_id: row.youtube_id,
      youtube_url: row.youtube_url,
      title_en: row.title_en,
      title_te: row.title_te,
      title_hi: row.title_hi || null,
      description_en: row.description_en || null,
      description_te: row.description_te || null,
      description_hi: row.description_hi || null,
      category: row.category,
      ghat_id: row.ghat_id || null,
      ghat_name,
      event_date: row.event_date ? new Date(row.event_date).toISOString() : new Date().toISOString(),
      is_live: Boolean(row.is_live),
      published: Boolean(row.published),
      sort_order: Number(row.sort_order || 0),
      thumbnail_url: row.thumbnail_url || `https://img.youtube.com/vi/${row.youtube_id}/hqdefault.jpg`,
      view_count: Number(row.view_count || 0),
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    };
  }
}

export const sevaRepository = new SevaRepository();

