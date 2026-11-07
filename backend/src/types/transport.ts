import { LocalizedString } from './ghats.js';

export type TransportHubType =
  | 'railway_station'
  | 'bus_stand'
  | 'airport'
  | 'boat_point'
  | 'auto_stand'
  | 'parking';

export interface TransportHub {
  id: string;
  name: LocalizedString;
  description?: LocalizedString | null;
  hub_type: TransportHubType;
  operator?: string | null;
  code?: string | null;
  address?: LocalizedString | null;
  phone?: string | null;
  lat: number;
  lng: number;
  operating_hours?: any;
  is_hidden: boolean;
  is_active: boolean;
  source_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HubWithDistance extends TransportHub {
  distance_m: number;
  distance_km: number;
  driving_time_minutes: number;
  walking_time_minutes: number;
  google_maps_url: string;
}

export interface BusRoute {
  id: string;
  route_number: string;
  operator: 'APSRTC' | 'TGSRTC' | 'CITY_BUS' | 'SPECIAL_RTC' | 'OTHER';
  origin: LocalizedString;
  destination: LocalizedString;
  origin_hub_id?: string | null;
  destination_hub_id?: string | null;
  via_stops: (string | LocalizedString)[];
  first_bus_time?: string | null;
  last_bus_time?: string | null;
  frequency_minutes?: number | null;
  fare_range?: { min: number; max: number; currency: string } | null;
  bus_type: 'ordinary' | 'express' | 'deluxe' | 'super_luxury' | 'ac' | 'electric';
  connected_ghat_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusSpecialService {
  id: string;
  service_code: string;
  service_title: LocalizedString;
  operator: 'APSRTC' | 'TGSRTC' | 'JOINT_RTC';
  origin_city: LocalizedString;
  destination_ghat_id?: string | null;
  destination_town: LocalizedString;
  operating_dates: { start_date: string; end_date: string };
  timings_description?: LocalizedString | null;
  booking_url?: string | null;
  emergency_helpline?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RailStation {
  id: string;
  hub_id?: string | null;
  station_code: string;
  station_name: LocalizedString;
  division?: string | null;
  zone: string;
  total_platforms: number;
  has_pushkaralu_special_trains: boolean;
  helpdesk_phone?: string | null;
  official_enquiry_url?: string | null;
  lat: number;
  lng: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RailStationWithDistance extends RailStation {
  distance_m: number;
  distance_km: number;
  driving_time_minutes: number;
  walking_time_minutes: number;
  google_maps_url: string;
}

export interface ShuttleStop {
  id: string;
  shuttle_route_id: string;
  stop_order: number;
  stop_name: LocalizedString;
  landmark?: LocalizedString | null;
  lat: number;
  lng: number;
  is_major_boarding_point: boolean;
  created_at: string;
}

export interface ShuttleRoute {
  id: string;
  route_code: string;
  route_name: LocalizedString;
  origin_hub_id?: string | null;
  origin_name: LocalizedString;
  destination_ghat_id?: string | null;
  destination_name: LocalizedString;
  shuttle_type: 'free' | 'nominal' | 'electric_cart' | 'battery_rickshaw' | 'feeder_bus';
  fare: number;
  frequency_minutes: number;
  operating_hours: { start: string; end: string; frequency_peak_mins?: number };
  accessible_for_elderly_disabled: boolean;
  color_code: string;
  is_active: boolean;
  stops?: ShuttleStop[];
  created_at: string;
  updated_at: string;
}

export type ExternalLinkCategory = 'bus' | 'rail' | 'shuttle' | 'emergency' | 'traffic';

export interface ExternalLink {
  id: string;
  category: ExternalLinkCategory;
  key: string;
  title: LocalizedString;
  description?: LocalizedString | null;
  url: string;
  official_authority: string;
  is_verified: boolean;
  last_verified_at: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StubApiResponse<T = null> {
  status: 'integration_pending' | 'unavailable' | 'not_implemented';
  provider: string;
  message: string;
  is_stub: true;
  official_portal_url: string;
  policy: string;
  data: T;
  timestamp: string;
}

export interface BusTransportResponse {
  ghat: {
    id: string;
    name: LocalizedString;
    lat: number;
    lng: number;
  } | null;
  hubs: HubWithDistance[];
  routes: BusRoute[];
  special_services: BusSpecialService[];
  official_links: ExternalLink[];
  disclaimer: LocalizedString;
}

export interface RailTransportResponse {
  ghat: {
    id: string;
    name: LocalizedString;
    lat: number;
    lng: number;
  } | null;
  stations: RailStationWithDistance[];
  official_links: ExternalLink[];
  disclaimer: LocalizedString;
}

export interface ShuttleTransportResponse {
  ghat: {
    id: string;
    name: LocalizedString;
    lat: number;
    lng: number;
  } | null;
  shuttle_routes: ShuttleRoute[];
  official_links: ExternalLink[];
  disclaimer: LocalizedString;
}

