import { env } from '../config/env.js';

export interface TravelTimeEstimate {
  distance_m: number;
  distance_km: number;
  driving_time_minutes: number;
  walking_time_minutes: number;
  estimated_time_text: string;
  google_maps_url: string;
}

/**
 * Calculates Haversine distance in meters between two lat/lng coordinates.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Computes distance and estimated travel times during festival conditions.
 * Driving speed factor: ~15 km/h in crowded ghat zones.
 * Walking speed factor: ~4.5 km/h.
 * Exact route time is available via Google Maps deep link on tap.
 */
export function calculateTravelEstimates(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  exactDistanceMeters?: number
): TravelTimeEstimate {
  const distance_m = exactDistanceMeters ?? calculateHaversineDistanceMeters(originLat, originLng, destLat, destLng);
  const distance_km = Math.round((distance_m / 1000) * 10) / 10;

  const drivingSpeed = env.SPEED_FACTOR_DRIVING_KMH || 15; // km/h
  const walkingSpeed = env.SPEED_FACTOR_WALKING_KMH || 4.5; // km/h

  // Time in minutes = (distance_km / speed_kmh) * 60
  const driving_time_minutes = Math.max(1, Math.round((distance_km / drivingSpeed) * 60));
  const walking_time_minutes = Math.max(1, Math.round((distance_km / walkingSpeed) * 60));

  let estimated_time_text: string;
  if (distance_km < 1.0) {
    estimated_time_text = `~${walking_time_minutes} min walk (${distance_m}m)`;
  } else {
    estimated_time_text = `~${driving_time_minutes} min drive / ~${walking_time_minutes} min walk`;
  }

  // Exact route deep link (Google Maps direction URL)
  const google_maps_url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;

  return {
    distance_m,
    distance_km,
    driving_time_minutes,
    walking_time_minutes,
    estimated_time_text,
    google_maps_url,
  };
}
