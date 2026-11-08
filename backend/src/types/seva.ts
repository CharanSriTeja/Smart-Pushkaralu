export type SevaCategory =
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

export interface SevaVideoRecord {
  id: string;
  youtube_id: string;
  youtube_url: string;
  title_en: string;
  title_te: string;
  title_hi?: string | null;
  description_en?: string | null;
  description_te?: string | null;
  description_hi?: string | null;
  category: SevaCategory;
  ghat_id?: string | null;
  ghat_name?: LocalizedSevaString | null;
  event_date: string;
  is_live: boolean;
  published: boolean;
  sort_order: number;
  thumbnail_url: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface SevaVideoResponse extends SevaVideoRecord {
  title: LocalizedSevaString;
  description: LocalizedSevaString;
}

export interface CreateSevaVideoDto {
  url: string;
  title_en: string;
  title_te: string;
  title_hi?: string;
  description_en?: string;
  description_te?: string;
  description_hi?: string;
  category: SevaCategory;
  ghat_id?: string | null;
  event_date?: string;
  is_live?: boolean;
  published?: boolean;
  sort_order?: number;
  reason?: string;
}

export interface UpdateSevaVideoDto extends Partial<CreateSevaVideoDto> {
  reason?: string;
}

export interface ReorderSevaItem {
  id: string;
  sort_order: number;
}

