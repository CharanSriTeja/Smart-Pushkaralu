export interface LocalizedText {
  en: string;
  te?: string;
  hi?: string;
}

export type MockRole = 'super_admin' | 'editor' | 'viewer' | 'guest';

export interface AdminUser {
  id: string;
  phone: string;
  name: string;
  role: MockRole;
  permissions: string[];
  isSuperAdmin: boolean;
  token?: string;
}

export interface AuditLogRecord {
  id: string;
  admin_id: string | null;
  admin_phone?: string | null;
  admin_name?: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: any;
  new_value: any;
  source_url: string | null;
  reason: string | null;
  created_at: string;
}

export interface SettingRecord {
  key: string;
  value: any;
  updated_by?: string | null;
  updated_by_name?: string | null;
  updated_at?: string;
}

export interface ProviderUsage {
  provider: string;
  totalCalls: number;
  totalCost: number;
}

export interface DailyUsage {
  date: string;
  provider: string;
  count: number;
}

export interface UsageStats {
  monthlyQuota: number;
  currentMonthUsage: number;
  currentMonthCost: number;
  quotaRemaining: number;
  quotaPercentUsed: number;
  providers: ProviderUsage[];
  dailyUsage: DailyUsage[];
}

export interface EmergencyAlert {
  id: string;
  ghatId: string;
  ghatName: string;
  severity: 'critical' | 'high' | 'medium';
  message: string;
  reportedAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
  latitude?: number;
  longitude?: number;
}

export type RecordStatus = 'officially_listed' | 'reported' | 'unverified';
export type BathingStatus = 'allowed' | 'restricted' | 'closed' | 'unknown';
export type CrowdLevel = 'low' | 'medium' | 'high' | 'very_high' | 'unknown';
export type PublishStatus = 'draft' | 'published' | 'hidden';
export type NoticeSeverity = 'info' | 'warning' | 'emergency';
export type CrowdSourceType = 'official_override' | 'crowdsourced_aggregate' | 'sensor_or_camera' | 'default';

export interface GhatNotice {
  id: string;
  ghat_id: string;
  title: LocalizedText;
  message: LocalizedText;
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
  note: LocalizedText | null;
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
  name: LocalizedText;
  river: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  distance_meters?: number;
  distance_km?: number;
  nearest_town: LocalizedText;
  nearest_railway_station: LocalizedText;
  nearest_bus_stand: LocalizedText;
  official_source_url: string | null;
  verified_at: string | null;
  record_status: RecordStatus;
  bathing_status: BathingStatus;
  crowd_level: CrowdLevel;
  publish_status: PublishStatus;
  description?: LocalizedText | null;
  max_capacity?: number | null;
  sources?: any[];
  facilities?: any[];
  aarti_timings?: any[];
}

export interface NewsPost {
  id: string;
  title: LocalizedText;
  content: LocalizedText;
  summary?: LocalizedText | null;
  is_urgent: boolean;
  is_important: boolean;
  publish_status: PublishStatus;
  created_at: string;
  updated_at: string;
}

export type SosChannel = 'app' | 'sms' | 'qr' | 'call';
export type SosType = 'medical' | 'police' | 'fire' | 'lost_person' | 'other' | 'general';
export type SosStatus = 'new' | 'acknowledged' | 'dispatched' | 'resolved' | 'false_alarm';

export interface SosAlertAdminRecord {
  id: string;
  user_id: string | null;
  phone: string | null;
  channel: SosChannel;
  type: SosType;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  ghat_id: string | null;
  ghat_name?: any;
  zone_id: string | null;
  zone_code: string | null;
  zone_label?: any;
  language: string;
  status: SosStatus;
  severity: number;
  assigned_to_name: string | null;
  assigned_to_phone: string | null;
  device_id: string | null;
  status_token: string;
  merged_into_id: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface SosUpdateAdminRecord {
  id: string;
  alert_id: string;
  admin_id: string | null;
  admin_name?: string | null;
  status: SosStatus | null;
  note: string;
  is_public: boolean;
  created_at: string;
}

export interface QrZoneAdminRecord {
  id: string;
  zone_code: string;
  ghat_id: string | null;
  ghat_name?: any;
  label: LocalizedText;
  lat: number | null;
  lng: number | null;
  active: boolean;
  created_at: string;
}

export interface EmergencyContactAdminRecord {
  id: string;
  label: LocalizedText;
  phone: string;
  kind: string;
  ghat_id: string | null;
  ghat_name?: any;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface ClusterNotification {
  ghatId?: string | null;
  ghatName?: string | null;
  zoneCode?: string | null;
  alertCount: number;
  timeWindowMinutes: number;
  detectedAt: string;
  recentAlertIds: string[];
}

// Module 6: Transport and Shuttles Admin Types
export interface AdminTransportHub {
  id: string;
  name: LocalizedText;
  description?: LocalizedText | null;
  hub_type: 'railway_station' | 'bus_stand' | 'airport' | 'boat_point' | 'auto_stand' | 'parking';
  operator?: string | null;
  code?: string | null;
  address?: LocalizedText | null;
  phone?: string | null;
  lat: number;
  lng: number;
  operating_hours?: any;
  is_hidden: boolean;
  is_active: boolean;
  source_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminBusRoute {
  id: string;
  route_number: string;
  operator: 'APSRTC' | 'TGSRTC' | 'CITY_BUS' | 'SPECIAL_RTC' | 'OTHER';
  origin: LocalizedText;
  destination: LocalizedText;
  origin_hub_id?: string | null;
  destination_hub_id?: string | null;
  via_stops: any[];
  first_bus_time?: string | null;
  last_bus_time?: string | null;
  frequency_minutes?: number | null;
  fare_range?: { min: number; max: number; currency: string } | null;
  bus_type: 'ordinary' | 'express' | 'deluxe' | 'super_luxury' | 'ac' | 'electric';
  connected_ghat_ids?: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminBusSpecialService {
  id: string;
  service_code: string;
  service_title: LocalizedText;
  operator: 'APSRTC' | 'TGSRTC' | 'JOINT_RTC';
  origin_city: LocalizedText;
  destination_ghat_id?: string | null;
  destination_town: LocalizedText;
  operating_dates: { start_date: string; end_date: string };
  timings_description?: LocalizedText | null;
  booking_url?: string | null;
  emergency_helpline?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminRailStation {
  id: string;
  hub_id?: string | null;
  station_code: string;
  station_name: LocalizedText;
  division?: string | null;
  zone: string;
  total_platforms: number;
  has_pushkaralu_special_trains: boolean;
  helpdesk_phone?: string | null;
  official_enquiry_url?: string | null;
  lat: number;
  lng: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminShuttleStop {
  id: string;
  shuttle_route_id: string;
  stop_order: number;
  stop_name: LocalizedText;
  landmark?: LocalizedText | null;
  lat: number;
  lng: number;
  is_major_boarding_point: boolean;
  created_at?: string;
}

export interface AdminShuttleRoute {
  id: string;
  route_code: string;
  route_name: LocalizedText;
  origin_hub_id?: string | null;
  origin_name: LocalizedText;
  destination_ghat_id?: string | null;
  destination_name: LocalizedText;
  shuttle_type: 'free' | 'nominal' | 'electric_cart' | 'battery_rickshaw' | 'feeder_bus';
  fare: number;
  frequency_minutes: number;
  operating_hours: { start: string; end: string; frequency_peak_mins?: number };
  accessible_for_elderly_disabled: boolean;
  color_code: string;
  is_active: boolean;
  stops?: AdminShuttleStop[];
  created_at?: string;
  updated_at?: string;
}

export interface AdminExternalLink {
  id: string;
  category: 'bus' | 'rail' | 'shuttle' | 'emergency' | 'traffic';
  key: string;
  title: LocalizedText;
  description?: LocalizedText | null;
  url: string;
  official_authority: string;
  is_verified: boolean;
  last_verified_at: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}



