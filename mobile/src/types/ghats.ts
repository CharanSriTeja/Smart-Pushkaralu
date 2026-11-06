export interface LocalizedString {
  en: string;
  te?: string;
  hi?: string;
}

export type RecordStatus = 'officially_listed' | 'reported' | 'unverified';
export type BathingStatus = 'allowed' | 'restricted' | 'closed' | 'unknown';
export type CrowdLevel = 'low' | 'medium' | 'high' | 'very_high' | 'unknown';
export type PublishStatus = 'draft' | 'published' | 'hidden';
export type NoticeSeverity = 'info' | 'warning' | 'emergency';
export type CrowdSourceType = 'official_override' | 'crowdsourced_aggregate' | 'sensor_or_camera' | 'default';

export interface GhatSource {
  id: string;
  ghat_id: string;
  source_url: string;
  source_name: string;
  source_type: string;
  is_official: boolean;
  last_verified_at: string | null;
  notes?: string | null;
}

export interface GhatFacility {
  id: string;
  ghat_id: string;
  facility_type: string;
  details: LocalizedString;
  is_operational: boolean;
  count: number;
}

export interface GhatAartiTiming {
  id: string;
  ghat_id: string;
  name: LocalizedString;
  time_start: string;
  time_end: string;
  description: LocalizedString;
  days_of_week: string;
}

export interface GhatNotice {
  id: string;
  ghat_id: string;
  title: LocalizedString;
  message: LocalizedString;
  severity: NoticeSeverity;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
}

export interface CrowdStatus {
  id?: string;
  ghat_id: string;
  current_level: CrowdLevel;
  source_type: CrowdSourceType;
  override_by_admin_id?: string | null;
  confidence_score: number;
  recent_report_count: number;
  note: LocalizedString | null;
  updated_at: string;
}

export interface Ghat {
  id: string;
  name: LocalizedString;
  river: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  distance_meters?: number;
  distance_km?: number;
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
  is_officially_approved?: boolean;
  trust_code?: 'OFFICIAL_APPROVED' | 'COMMUNITY_REPORTED' | 'UNVERIFIED';
  trust_label?: LocalizedString;
  safety_disclaimer?: LocalizedString;

  sources?: GhatSource[];
  facilities?: GhatFacility[];
  aarti_timings?: GhatAartiTiming[];
  active_notices?: GhatNotice[];
  crowd_status?: CrowdStatus | null;
}

export interface GhatFilters {
  state?: string;
  district?: string;
  river?: string;
  facilities?: string;
  crowdLevel?: CrowdLevel;
  bathingStatus?: BathingStatus;
  near?: string;
  search?: string;
}

