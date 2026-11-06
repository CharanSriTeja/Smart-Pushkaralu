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
  price_range?: 'budget' | 'mid_range' | 'luxury' | 'dharamshala' | 'free' | string;
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
  disclaimer: string;
  budget_guard_active?: boolean;
}
