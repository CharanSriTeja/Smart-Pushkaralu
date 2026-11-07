export type SosChannel = 'app' | 'sms' | 'qr' | 'call';
export type SosType = 'medical' | 'police' | 'fire' | 'lost_person' | 'other' | 'general';
export type SosStatus = 'new' | 'acknowledged' | 'dispatched' | 'resolved' | 'false_alarm';
export type EmergencyContactKind = 'ambulance' | 'police' | 'fire' | 'control_room' | 'temple_office' | 'other';

export interface LocalizedString {
  en: string;
  te?: string;
  hi?: string;
}

export interface SosAlertRecord {
  id: string;
  user_id: string | null;
  phone: string | null;
  channel: SosChannel;
  type: SosType;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  ghat_id: string | null;
  zone_id: string | null;
  zone_code: string | null;
  language: string;
  status: SosStatus;
  severity: number;
  assigned_to_name: string | null;
  assigned_to_phone: string | null;
  device_id: string | null;
  idempotency_key: string | null;
  status_token: string;
  merged_into_id: string | null;
  metadata?: Record<string, any> | null;
  created_at: string | Date;
  updated_at: string | Date;
  ghat_name?: LocalizedString | null;
  zone_label?: LocalizedString | null;
}

export interface SosUpdateRecord {
  id: string;
  alert_id: string;
  admin_id: string | null;
  admin_name?: string | null;
  status: SosStatus | null;
  note: string;
  is_public: boolean;
  created_at: string | Date;
}

export interface QrZoneRecord {
  id: string;
  zone_code: string;
  ghat_id: string | null;
  ghat_name?: LocalizedString | null;
  label: LocalizedString;
  lat: number | null;
  lng: number | null;
  active: boolean;
  created_at: string | Date;
}

export interface EmergencyContactRecord {
  id: string;
  label: LocalizedString;
  phone: string;
  kind: EmergencyContactKind;
  ghat_id: string | null;
  ghat_name?: LocalizedString | null;
  sort_order: number;
  active: boolean;
  created_at: string | Date;
}

export interface ClusterEventPayload {
  ghatId?: string | null;
  ghatName?: string | null;
  zoneCode?: string | null;
  alertCount: number;
  timeWindowMinutes: number;
  detectedAt: string;
  recentAlertIds: string[];
}

