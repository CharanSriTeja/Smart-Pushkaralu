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
}

export interface RouteClosure {
  id: string;
  title: LocalizedText;
  description?: LocalizedText | null;
  severity: ClosureSeverity;
  geometry?: any;
  starts_at: string;
  ends_at: string;
  active: boolean;
  source_name: string;
  source_url?: string | null;
}

export interface RouteTemple {
  id: string;
  name: LocalizedText;
  lat: number;
  lng: number;
  district: string;
  state: string;
  coordinates_precision: CoordinatesPrecision;
  distance_from_route_m?: number;
}

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  encodedPolyline?: string;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  estimatedDurationSeconds: number;
  delayFactor: number;
  delayFactorLabel?: LocalizedText;
  encodedPolyline: string;
  legs: RouteLeg[];
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

