export type IssueCategory = 'sanitation' | 'road' | 'water' | 'lighting' | 'crowd' | 'other';

export type IssueStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';

export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

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
  priority: IssuePriority;
  reporter_id: string | null;
  reporter_phone: string | null;
  reporter_device_token: string | null;
  device_fingerprint: string | null;
  is_duplicate: boolean;
  duplicate_of_ticket_no: string | null;
  duplicate_count: number;
  client_metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface IssueUpdate {
  id: string;
  issue_id: string;
  status: IssueStatus;
  public_note: string | null;
  internal_note?: string | null;
  resolution_photo_url: string | null;
  updated_by_admin_id: string | null;
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
  client_metadata?: Record<string, any> | null;
}

export interface IssueFilterParams {
  status?: IssueStatus;
  category?: IssueCategory;
  ghat_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'priority';
  order?: 'ASC' | 'DESC';
}

