export type SevaCategory =
  | 'all'
  | 'aarthi'
  | 'pooja'
  | 'cultural'
  | 'snanam'
  | 'live_darshan'
  | 'general';

export interface LocalizedSevaString {
  en: string;
  te: string;
  hi?: string;
}

export interface SevaVideoItem {
  id: string;
  youtube_id: string;
  youtube_url: string;
  title_en: string;
  title_te: string;
  title_hi?: string | null;
  description_en?: string | null;
  description_te?: string | null;
  description_hi?: string | null;
  title: LocalizedSevaString;
  description: LocalizedSevaString;
  category: SevaCategory;
  ghat_id?: string | null;
  ghat_name?: LocalizedSevaString | null;
  event_date: string;
  is_live: boolean;
  published: boolean;
  sort_order: number;
  thumbnail_url: string;
  view_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SevaFeedResponse {
  data: SevaVideoItem[];
  meta: {
    total: number;
    live_count: number;
    categories: Array<{ id: string; name: LocalizedSevaString }>;
  };
}

