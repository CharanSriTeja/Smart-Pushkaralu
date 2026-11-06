import { LocalizedString } from './ghats';

export type NewsCategory = 'urgent' | 'general' | 'advisory' | 'facility' | 'traffic' | 'weather';
export type NewsPriority = 'low' | 'normal' | 'high' | 'urgent';

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
  publish_status: 'draft' | 'published' | 'archived' | 'expired';
  published_at: string | null;
  expires_at: string | null;
  notify_sent: boolean;
  created_at: string;
  updated_at: string;

  // Localized view fields populated on GET request
  localized_title?: string;
  localized_content?: string;
  localized_summary?: string;
}

export interface NewsFilters {
  category?: NewsCategory | 'all';
  ghat?: string;
  language?: 'en' | 'te' | 'hi';
}

export interface RegisterDevicePayload {
  token: string;
  language: 'en' | 'te' | 'hi';
  ghat_topics?: string[];
}

