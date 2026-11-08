export interface LocalizedString {
  en: string;
  te?: string;
  hi?: string;
}

export interface TransportHubWithDistance {
  id: string;
  name: LocalizedString;
  description?: LocalizedString | null;
  hub_type: 'railway_station' | 'bus_stand' | 'airport' | 'boat_point' | 'auto_stand' | 'parking';
  operator?: string | null;
  code?: string | null;
  address?: LocalizedString | null;
  phone?: string | null;
  lat: number;
  lng: number;
  is_active: boolean;
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
  via_stops: (string | LocalizedString)[];
  first_bus_time?: string | null;
  last_bus_time?: string | null;
  frequency_minutes?: number | null;
  fare_range?: { min: number; max: number; currency: string } | null;
  bus_type: 'ordinary' | 'express' | 'deluxe' | 'super_luxury' | 'ac' | 'electric';
  is_active: boolean;
}

export interface BusSpecialService {
  id: string;
  service_code: string;
  service_title: LocalizedString;
  operator: 'APSRTC' | 'TGSRTC' | 'JOINT_RTC';
  origin_city: LocalizedString;
  destination_town: LocalizedString;
  operating_dates: { start_date: string; end_date: string };
  timings_description?: LocalizedString | null;
  booking_url?: string | null;
  emergency_helpline?: string | null;
  is_active: boolean;
}

export interface RailStationWithDistance {
  id: string;
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
  distance_m: number;
  distance_km: number;
  driving_time_minutes: number;
  walking_time_minutes: number;
  google_maps_url: string;
}

export interface ShuttleStop {
  id: string;
  stop_order: number;
  stop_name: LocalizedString;
  landmark?: LocalizedString | null;
  lat: number;
  lng: number;
  is_major_boarding_point: boolean;
}

export interface ShuttleRoute {
  id: string;
  route_code: string;
  route_name: LocalizedString;
  origin_name: LocalizedString;
  destination_name: LocalizedString;
  shuttle_type: 'free' | 'nominal' | 'electric_cart' | 'battery_rickshaw' | 'feeder_bus';
  fare: number;
  frequency_minutes: number;
  operating_hours: { start: string; end: string; frequency_peak_mins?: number };
  accessible_for_elderly_disabled: boolean;
  color_code: string;
  stops?: ShuttleStop[];
  is_active: boolean;
}

export interface ExternalLink {
  id: string;
  category: 'bus' | 'rail' | 'shuttle' | 'emergency' | 'traffic';
  key: string;
  title: LocalizedString;
  description?: LocalizedString | null;
  url: string;
  official_authority: string;
  is_verified: boolean;
  sort_order: number;
}

export interface BusTransportData {
  ghat: { id: string; name: LocalizedString; lat: number; lng: number } | null;
  hubs: TransportHubWithDistance[];
  routes: BusRoute[];
  special_services: BusSpecialService[];
  official_links: ExternalLink[];
  disclaimer: LocalizedString;
}

export interface RailTransportData {
  ghat: { id: string; name: LocalizedString; lat: number; lng: number } | null;
  stations: RailStationWithDistance[];
  official_links: ExternalLink[];
  disclaimer: LocalizedString;
}

export interface ShuttleTransportData {
  ghat: { id: string; name: LocalizedString; lat: number; lng: number } | null;
  shuttle_routes: ShuttleRoute[];
  official_links: ExternalLink[];
  disclaimer: LocalizedString;
}

