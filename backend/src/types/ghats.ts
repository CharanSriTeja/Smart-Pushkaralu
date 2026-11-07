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
  source_type: 'government' | 'district_portal' | 'police_dept' | 'devasthanam' | 'media' | 'community' | 'other';
  is_official: boolean;
  last_verified_at: string | null;
  notes?: string | null;
  created_at: string;
}

export interface GhatFacility {
  id: string;
  ghat_id: string;
  facility_type: string;
  details: LocalizedString;
  is_operational: boolean;
  count: number;
  source_url?: string | null;
  last_verified_at?: string | null;
  updated_at: string;
}

export interface GhatAartiTiming {
  id: string;
  ghat_id: string;
  name: LocalizedString;
  time_start: string;
  time_end: string;
  description: LocalizedString;
  days_of_week: string;
  created_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface CrowdStatus {
  id: string;
  ghat_id: string;
  current_level: CrowdLevel;
  source_type: CrowdSourceType;
  override_by_admin_id: string | null;
  confidence_score: number;
  recent_report_count: number;
  note: LocalizedString | null;
  updated_at: string;
}

export interface CrowdReport {
  id: string;
  ghat_id: string;
  user_id: string | null;
  device_fingerprint: string;
  reported_crowd_level: 'low' | 'medium' | 'high' | 'very_high';
  reported_lat: number;
  reported_lng: number;
  distance_meters: number;
  is_verified_proximity: boolean;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
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
  created_at: string;
  updated_at: string;

  // Joined relations
  sources?: GhatSource[];
  facilities?: GhatFacility[];
  aarti_timings?: GhatAartiTiming[];
  active_notices?: GhatNotice[];
  crowd_status?: CrowdStatus | null;
}

export interface GhatQueryParams {
  state?: string;
  district?: string;
  river?: string;
  facilities?: string | string[]; // comma separated or array
  crowdLevel?: CrowdLevel;
  bathingStatus?: BathingStatus;
  publishStatus?: PublishStatus;
  near?: string; // "lat,lng" e.g. "17.0005,81.7725"
  maxDistanceMeters?: number;
  search?: string;
  sortBy?: 'distance' | 'name' | 'crowd_level' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeHidden?: boolean; // admin only
}
