export type LocalizedText = {
  en: string;
  te?: string;
  hi?: string;
};

export type RouteMode = 'car' | 'bike' | 'walk' | 'bus' | 'train';

export type CoordinatesPrecision =
  | 'access_verified'
  | 'approximate'
  | 'village_centre'
  | 'none';

export type AccessPointKind = 'parking' | 'drop_off' | 'entry_gate' | 'main';

export type RouteOriginKind = 'city' | 'railway_station' | 'bus_stand' | 'other';

export type ClosureSeverity = 'info' | 'warning' | 'blocked';

export type TempleSource = 'osm' | 'official' | 'admin' | 'other';

export interface RouteOrigin {
  id: string;
  name: LocalizedText;
  kind: RouteOriginKind;
  lat: number;
  lng: number;
  district: string;
  state: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GhatAccessPoint {
  id: string;
  ghat_id: string;
  kind: AccessPointKind;
  name: LocalizedText;
  lat: number;
  lng: number;
  coordinates_precision: CoordinatesPrecision;
  notes?: LocalizedText | null;
  is_default: boolean;
  active: boolean;
  source_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StandardRoute {
  id: string;
  origin_id: string;
  access_point_id: string;
  mode: 'car' | 'walk';
  distance_m: number;
  duration_s: number;
  polyline: string;
  provider: string;
  computed_at: string;
  stale: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouteClosure {
  id: string;
  title: LocalizedText;
  description?: LocalizedText | null;
  severity: ClosureSeverity;
  geometry: any; // GeoJSON or WKT
  starts_at: string;
  ends_at: string;
  active: boolean;
  source_name: string;
  source_url?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GhatDelayFactor {
  id: string;
  ghat_id?: string | null; // null for global factor
  factor: number;
  label: LocalizedText;
  starts_at: string;
  ends_at: string;
  active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RouteTemple {
  id: string;
  name: LocalizedText;
  lat: number;
  lng: number;
  district: string;
  state: string;
  coordinates_precision: CoordinatesPrecision;
  source: TempleSource;
  source_url?: string | null;
  osm_id?: string | null;
  verified: boolean;
  active: boolean;
  distance_from_route_m?: number;
  distance_along_route_m?: number;
}

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  encodedPolyline?: string;
}

export interface RouteAlternative {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string;
  summary?: string;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  estimatedDurationSeconds: number;
  delayFactor: number;
  delayFactorLabel?: LocalizedText;
  encodedPolyline: string;
  legs: RouteLeg[];
  alternatives: RouteAlternative[];
  warnings: string[];
  providerName: string;
  isEstimatedForBike?: boolean;
  attribution: string;
  safetyDisclaimer: string;
  googleMapsLink: string;
}

export interface DegradedRouteResult {
  degraded: true;
  straightLineDistanceMeters: number;
  googleMapsLink: string;
  message: string;
  attribution: string;
  safetyDisclaimer: string;
  orderedStops?: { id: string; name: LocalizedText; lat: number; lng: number }[];
}

export interface ComputeRouteParams {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: { lat: number; lng: number }[];
  mode: RouteMode;
  alternatives?: boolean;
}

export interface IRoutingProvider {
  name: string;
  computeRoute(params: ComputeRouteParams): Promise<RouteResult>;
}

