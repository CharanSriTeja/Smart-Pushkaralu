import crypto from 'crypto';
import { sevaRepository } from './seva.repository.js';
import { extractYouTubeVideoId } from './youtube-validator.js';
import {
  SevaVideoRecord,
  SevaVideoResponse,
  CreateSevaVideoDto,
  UpdateSevaVideoDto,
  ReorderSevaItem,
  LocalizedSevaString,
} from '../../types/seva.js';

export class SevaService {
  /**
   * Transforms raw SevaVideoRecord into a full multilingual response with {en, te, hi} fallbacks
   */
  formatResponse(record: SevaVideoRecord): SevaVideoResponse {
    const title: LocalizedSevaString = {
      en: record.title_en,
      te: record.title_te || record.title_en,
      hi: record.title_hi || record.title_en,
    };

    const description: LocalizedSevaString = {
      en: record.description_en || '',
      te: record.description_te || record.description_en || '',
      hi: record.description_hi || record.description_en || '',
    };

    return {
      ...record,
      title,
      description,
    };
  }

  /**
   * Public list of published seva videos with category, ghat, and live filters.
   */
  async getPublicVideos(filters: {
    category?: string;
    ghat?: string;
    live?: string | boolean;
  }): Promise<{
    data: SevaVideoResponse[];
    live_count: number;
    total: number;
    categories: Array<{ id: string; name: LocalizedSevaString }>;
  }> {
    let isLiveFilter: boolean | undefined = undefined;
    if (filters.live !== undefined) {
      if (typeof filters.live === 'boolean') {
        isLiveFilter = filters.live;
      } else {
        const lower = String(filters.live).toLowerCase();
        if (lower === 'true' || lower === '1') isLiveFilter = true;
        if (lower === 'false' || lower === '0') isLiveFilter = false;
      }
    }

    const records = await sevaRepository.findPublishedVideos({
      category: filters.category,
      ghat_id: filters.ghat,
      is_live: isLiveFilter,
    });

    const liveCount = records.filter((r) => r.is_live).length;

    const categories: Array<{ id: string; name: LocalizedSevaString }> = [
      { id: 'all', name: { en: 'All Events', te: 'అన్ని కార్యక్రమాలు', hi: 'सभी कार्यक्रम' } },
      { id: 'aarthi', name: { en: 'Godavari Harathi', te: 'గోదావరి హారతి', hi: 'गोदावरी महा आरती' } },
      { id: 'pooja', name: { en: 'Pujas & Rituals', te: 'పూజలు & క్రతువులు', hi: 'पूजा एवं अनुष्ठान' } },
      { id: 'cultural', name: { en: 'Cultural & Bhajans', te: 'సాంస్కృతిక & భజనలు', hi: 'सांस्कृतिक एवं भजन' } },
      { id: 'snanam', name: { en: 'Holy Dip & Snanam', te: 'పుణ్యస్నానం & మార్గదర్శి', hi: 'पुण्य स्नान एवं विधि' } },
      { id: 'live_darshan', name: { en: 'Live Darshan', te: 'ప్రత్యక్ష దర్శనం', hi: 'सीधा दर्शन' } },
      { id: 'general', name: { en: 'Highlights & Guides', te: 'విశేషాలు & సమాచారం', hi: 'झलकियाँ एवं मार्गदर्शिका' } },
    ];

    return {
      data: records.map((r) => this.formatResponse(r)),
      live_count: liveCount,
      total: records.length,
      categories,
    };
  }

  /**
   * Get single published video by ID
   */
  async getPublicVideoById(id: string): Promise<SevaVideoResponse | null> {
    const record = await sevaRepository.findVideoById(id, false);
    if (!record) return null;
    return this.formatResponse(record);
  }

  /**
   * Admin list of all videos (including unpublished)
   */
  async getAdminVideos(filters?: {
    category?: string;
    published?: boolean;
    is_live?: boolean;
  }): Promise<{ data: SevaVideoResponse[]; total: number }> {
    const records = await sevaRepository.findAllAdminVideos(filters);
    return {
      data: records.map((r) => this.formatResponse(r)),
      total: records.length,
    };
  }

  /**
   * Admin create video with strict YouTube URL validation
   */
  async createVideo(dto: CreateSevaVideoDto): Promise<SevaVideoResponse> {
    const parsed = extractYouTubeVideoId(dto.url);
    if (!parsed) {
      throw new Error('INVALID_YOUTUBE_URL: Only valid youtu.be, youtube.com/watch, and youtube.com/live URLs are accepted.');
    }

    if (!dto.title_en || !dto.title_te) {
      throw new Error('VALIDATION_ERROR: English and Telugu titles are required.');
    }

    const id = `seva-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const newRecord: SevaVideoRecord = {
      id,
      youtube_id: parsed.videoId,
      youtube_url: parsed.canonicalUrl,
      title_en: dto.title_en.trim(),
      title_te: dto.title_te.trim(),
      title_hi: dto.title_hi?.trim() || null,
      description_en: dto.description_en?.trim() || null,
      description_te: dto.description_te?.trim() || null,
      description_hi: dto.description_hi?.trim() || null,
      category: dto.category || 'general',
      ghat_id: dto.ghat_id || null,
      event_date: dto.event_date ? new Date(dto.event_date).toISOString() : new Date().toISOString(),
      is_live: Boolean(dto.is_live),
      published: dto.published !== undefined ? Boolean(dto.published) : true,
      sort_order: typeof dto.sort_order === 'number' ? dto.sort_order : 100,
      thumbnail_url: parsed.thumbnailUrl,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = await sevaRepository.createVideo(newRecord);
    return this.formatResponse(saved);
  }

  /**
   * Admin update video
   */
  async updateVideo(id: string, dto: UpdateSevaVideoDto): Promise<SevaVideoResponse | null> {
    const existing = await sevaRepository.findVideoById(id, true);
    if (!existing) return null;

    const updates: Partial<SevaVideoRecord> = {};

    if (dto.url) {
      const parsed = extractYouTubeVideoId(dto.url);
      if (!parsed) {
        throw new Error('INVALID_YOUTUBE_URL: Only valid youtu.be, youtube.com/watch, and youtube.com/live URLs are accepted.');
      }
      updates.youtube_id = parsed.videoId;
      updates.youtube_url = parsed.canonicalUrl;
      updates.thumbnail_url = parsed.thumbnailUrl;
    }

    if (dto.title_en !== undefined) updates.title_en = dto.title_en.trim();
    if (dto.title_te !== undefined) updates.title_te = dto.title_te.trim();
    if (dto.title_hi !== undefined) updates.title_hi = dto.title_hi.trim() || null;
    if (dto.description_en !== undefined) updates.description_en = dto.description_en.trim() || null;
    if (dto.description_te !== undefined) updates.description_te = dto.description_te.trim() || null;
    if (dto.description_hi !== undefined) updates.description_hi = dto.description_hi.trim() || null;
    if (dto.category !== undefined) updates.category = dto.category;
    if (dto.ghat_id !== undefined) updates.ghat_id = dto.ghat_id || null;
    if (dto.event_date !== undefined) updates.event_date = new Date(dto.event_date).toISOString();
    if (dto.is_live !== undefined) updates.is_live = Boolean(dto.is_live);
    if (dto.published !== undefined) updates.published = Boolean(dto.published);
    if (dto.sort_order !== undefined) updates.sort_order = Number(dto.sort_order);

    const updated = await sevaRepository.updateVideo(id, updates);
    if (!updated) return null;
    return this.formatResponse(updated);
  }

  /**
   * Admin delete video
   */
  async deleteVideo(id: string): Promise<boolean> {
    return sevaRepository.deleteVideo(id);
  }

  /**
   * Admin reorder videos
   */
  async reorderVideos(items: ReorderSevaItem[]): Promise<boolean> {
    return sevaRepository.reorderVideos(items);
  }
}

export const sevaService = new SevaService();

