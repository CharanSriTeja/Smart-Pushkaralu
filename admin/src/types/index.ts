export interface LocalizedString {
  en: string;
  te?: string;
  hi?: string;
}

export type RecordStatus = 'officially_listed' | 'reported' | 'unverified';
export type BathingStatus = 'allowed' | 'restricted' | 'closed' | 'unknown';
export type CrowdLevel = 'low' | 'medium' | 'high' | 'very_high' | 'unknown';
export type PublishStatus = 'draft' | 'published' | 'hidden';

export interface GhatSource {
  id?: string;
  source_url: string;
  source_name: string;
  source_type: string;
  is_official: boolean;
  notes?: string | null;
}

export interface GhatFacility {
  id?: string;
  facility_type: string;
  details: LocalizedString;
  is_operational: boolean;
  count: number;
  source_url?: string | null;
  last_verified_at?: string | null;
}

export interface GhatAartiTiming {
  id?: string;
  name: LocalizedString;
  time_start: string;
  time_end: string;
  description: LocalizedString;
  days_of_week: string;
}

export interface GhatNotice {
  id?: string;
  ghat_id: string;
  title: LocalizedString;
  message: LocalizedString;
  severity: 'info' | 'warning' | 'emergency';
  is_active: boolean;
  starts_at?: string;
  ends_at?: string | null;
  created_at?: string;
}

export interface CrowdStatus {
  id?: string;
  ghat_id: string;
  current_level: CrowdLevel;
  source_type: string;
  confidence_score: number;
  recent_report_count: number;
  note: LocalizedString | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: any | null;
  new_values: any | null;
  source_url: string | null;
  reason: string;
  ip_address: string | null;
  created_at: string;
}

export interface Ghat {
  id: string;
  name: LocalizedString;
  river: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  nearest_town: LocalizedString;
  nearest_railway_station: LocalizedString;
  nearest_bus_stand: LocalizedString;
  official_source_url: string | null;
  verified_at: string | null;
  record_status: RecordStatus;
  bathing_status: BathingStatus;
  crowd_level: CrowdLevel;
  publish_status: PublishStatus;
  description?: LocalizedString | null;
  max_capacity?: number | null;
  created_at: string;
  updated_at: string;

  sources?: GhatSource[];
  facilities?: GhatFacility[];
  aarti_timings?: GhatAartiTiming[];
  active_notices?: GhatNotice[];
  crowd_status?: CrowdStatus | null;
}

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
}

export interface CreateNewsPayload {
  title: LocalizedString;
  content: LocalizedString;
  summary?: LocalizedString | null;
  category: NewsCategory;
  priority: NewsPriority;
  ghat_ids: string[];
  source_url: string | null;
  is_official: boolean;
  is_pinned: boolean;
  publish_status: NewsPublishStatus;
  published_at?: string | null;
  expires_at?: string | null;
  notify?: boolean;
  audit_reason: string;
}

export interface UpdateNewsPayload {
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


