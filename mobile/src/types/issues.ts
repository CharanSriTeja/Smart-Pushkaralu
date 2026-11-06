export type IssueCategory = 'sanitation' | 'road' | 'water' | 'lighting' | 'crowd' | 'other';

export type IssueStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';

export type LocationType = 'gps' | 'map_pin' | 'qr_zone';

export interface IssueReport {
  id: string;
  ticket_no: string;
  category: IssueCategory;
  description: string;
  photo_url: string | null;
  location_type: LocationType;
  lat: number;
  lng: number;
  qr_zone_id: string | null;
  ghat_id: string | null;
  status: IssueStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reporter_id: string | null;
  reporter_phone: string | null;
  reporter_device_token: string | null;
  device_fingerprint: string | null;
  is_duplicate: boolean;
  duplicate_of_ticket_no: string | null;
  duplicate_count: number;
  created_at: string;
  updated_at: string;
}

export interface IssueUpdate {
  id: string;
  issue_id: string;
  status: IssueStatus;
  public_note: string | null;
  resolution_photo_url: string | null;
  created_at: string;
}

export interface CreateIssueDTO {
  category: IssueCategory;
  description: string;
  photo_url?: string | null;
  location_type?: LocationType;
  lat: number;
  lng: number;
  qr_zone_id?: string | null;
  ghat_id?: string | null;
  reporter_device_token?: string | null;
  device_fingerprint?: string | null;
}

