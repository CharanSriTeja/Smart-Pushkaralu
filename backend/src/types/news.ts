import { LocalizedString } from './ghats.js';

export type SupportedLanguage = 'en' | 'te' | 'hi';

export type NewsCategory = 'urgent' | 'general' | 'advisory' | 'facility' | 'traffic' | 'weather';

export type NewsPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NewsPublishStatus = 'draft' | 'published' | 'archived' | 'expired';

export interface NewsPost {
  id: string;
  title: LocalizedString;
  content: LocalizedString;
  summary: LocalizedString | null;
  category: NewsCategory;
  priority: NewsPriority;
  ghat_ids: string[];
  source_url: string | null;
  is_official: boolean;
  is_pinned: boolean;
  publish_status: NewsPublishStatus;
  published_at: string | null;
  expires_at: string | null;
  notify_sent: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  // Localized view fields populated on GET request when language query param is specified
  localized_title?: string;
  localized_content?: string;
  localized_summary?: string;
  is_expired?: boolean;
}

export interface NewsQueryParams {
  ghat?: string;
  category?: NewsCategory;
  language?: SupportedLanguage;
  includeExpired?: boolean;
  publishStatus?: NewsPublishStatus;
  limit?: number;
  offset?: number;
}

export interface CreateNewsInput {
  title: LocalizedString;
  content: LocalizedString;
  summary?: LocalizedString | null;
  category: NewsCategory;
  priority?: NewsPriority;
  ghat_ids?: string[];
  source_url?: string | null;
  is_official?: boolean;
  is_pinned?: boolean;
  publish_status?: NewsPublishStatus;
  published_at?: string | null;
  expires_at?: string | null;
  notify?: boolean;
  audit_reason: string;
}

export interface UpdateNewsInput {
  title?: LocalizedString;
  content?: LocalizedString;
  summary?: LocalizedString | null;
  category?: NewsCategory;
  priority?: NewsPriority;
  ghat_ids?: string[];
  source_url?: string | null;
  is_official?: boolean;
  is_pinned?: boolean;
  publish_status?: NewsPublishStatus;
  published_at?: string | null;
  expires_at?: string | null;
  notify?: boolean;
  audit_reason: string;
}

export interface DeviceTokenRecord {
  id?: string;
  token: string;
  fcm_token?: string;
  user_id?: string | null;
  language: SupportedLanguage;
  ghat_topics: string[];
  created_at?: string;
  updated_at?: string;
}

export interface DraftTranslationRequest {
  title?: string;
  content?: string;
  summary?: string;
  sourceLang?: SupportedLanguage;
}

export interface DraftTranslationResult {
  title?: LocalizedString;
  content?: LocalizedString;
  summary?: LocalizedString;
  sourceLang: SupportedLanguage;
}

