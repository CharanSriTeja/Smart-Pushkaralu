export interface LocalizedText {
  en: string;
  te?: string;
  hi?: string;
}

export type PlaceCategory = 'hotel' | 'temple' | 'transport_hub';
export type QueryPlaceType = PlaceCategory | 'all';

export type TransportHubType = 
  | 'railway_station' 
  | 'bus_stand' 
  | 'airport' 
  | 'boat_point' 
  | 'auto_stand' 
  | 'parking';

export interface NearbyPlace {
  id: string;
  name: LocalizedText;
  type: PlaceCategory;
  source_type: 'curated' | 'third_party';
  lat: number;
  lng: number;
  distance_m: number;
  distance_km: number;
  driving_time_minutes: number;
  walking_time_minutes: number;
  estimated_time_text: string;
  google_maps_url: string;
  address?: LocalizedText;
  phone?: string;
  rating?: number;
  price_range?: string; // 'budget' | 'mid_range' | 'luxury' | 'dharamshala' | 'free'
  room_types?: string[];
  deity?: LocalizedText;
  darshan_timings?: LocalizedText;
  special_entry_info?: LocalizedText;
  hub_type?: TransportHubType;
  operating_hours?: LocalizedText;
  photo_url?: string;
  website_url?: string;
  custom_notes?: LocalizedText;
  is_verified?: boolean;
  is_hidden?: boolean;
  source_url?: string;
}

export interface NearbyPlacesCacheRecord {
  id: string;
  ghat_id: string;
  type: string;
  radius_m: number;
  results: NearbyPlace[];
  fetched_at: Date | string;
  expires_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface NearbyPlacesResponse {
  ghat_id: string;
  ghat_name: LocalizedText;
  center: {
    lat: number;
    lng: number;
  };
  radius_m: number;
  radius_km: number;
  type: QueryPlaceType;
  places: NearbyPlace[];
  total: number;
  is_cached: boolean;
  is_stale: boolean;
  cached_at: string | null;
  expires_at: string | null;
  budget_guard_active?: boolean;
  disclaimer: string;
}

export interface CuratedHotel {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  address?: LocalizedText;
  phone?: string;
  lat: number;
  lng: number;
  rating?: number;
  price_range?: string;
  room_types?: string[];
  photo_url?: string;
  website_url?: string;
  is_verified: boolean;
  is_hidden: boolean;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CuratedTemple {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  address?: LocalizedText;
  phone?: string;
  lat: number;
  lng: number;
  deity?: LocalizedText;
  darshan_timings?: LocalizedText;
  special_entry_info?: LocalizedText;
  photo_url?: string;
  website_url?: string;
  is_verified: boolean;
  is_hidden: boolean;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CuratedTransportHub {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  hub_type: TransportHubType;
  address?: LocalizedText;
  phone?: string;
  lat: number;
  lng: number;
  operating_hours?: LocalizedText;
  is_hidden: boolean;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaceOverride {
  id: string;
  place_id: string;
  name_override?: LocalizedText;
  phone_override?: string;
  address_override?: LocalizedText;
  custom_notes?: LocalizedText;
  is_hidden: boolean;
  verified_by_admin_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PlacesApiUsageStats {
  usage_date: string;
  call_count: number;
  daily_limit: number;
  remaining: number;
  limit_reached: boolean;
}
