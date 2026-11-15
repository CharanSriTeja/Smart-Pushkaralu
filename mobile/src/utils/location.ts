import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface LocationResult {
  granted: boolean;
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  } | null;
  error?: string;
}

// In-memory cache for fast synchronous access
let cachedUserCoords: {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
} | null = null;

let isPromptInProgress = false;
const locationListeners = new Set<(coords: { latitude: number; longitude: number; accuracy?: number | null } | null) => void>();

export function addLocationListener(cb: (coords: { latitude: number; longitude: number; accuracy?: number | null } | null) => void) {
  locationListeners.add(cb);
  return () => {
    locationListeners.delete(cb);
  };
}

function notifyLocationListeners(coords: { latitude: number; longitude: number; accuracy?: number | null } | null) {
  cachedUserCoords = coords;
  locationListeners.forEach((fn) => {
    try {
      fn(coords);
    } catch {}
  });
}

export function getLastKnownLocation() {
  return cachedUserCoords;
}

export function setLastKnownLocation(coords: { latitude: number; longitude: number; accuracy?: number | null } | null) {
  notifyLocationListeners(coords);
}

/**
 * Robust cross-platform location acquirer.
 * - On Web: Uses browser HTML5 navigator.geolocation to directly trigger
 *   the browser's native location permission dialog ("Allow location").
 *   Gracefully falls back from high-accuracy to network-based geolocation.
 * - On Android/iOS: Uses expo-location foreground permissions & GPS.
 */
export async function acquireUserLocation(): Promise<LocationResult> {
  // 1. Web Browser Geolocation
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'geolocation' in navigator) {
    return new Promise<LocationResult>((resolve) => {
      const onSuccess = (position: GeolocationPosition) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 15,
        };
        notifyLocationListeners(coords);
        resolve({
          granted: true,
          coords,
        });
      };

      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (err) => {
          // If high accuracy timed out or failed (common on laptops/desktops without hardware GPS),
          // immediately fallback to low-accuracy network/IP geolocation (fast & reliable)
          if (err.code !== 1) { // 1 = PERMISSION_DENIED
            navigator.geolocation.getCurrentPosition(
              onSuccess,
              (err2) => {
                console.warn('[Web Geolocation] Fallback failed:', err2.message);
                resolve({
                  granted: false,
                  coords: cachedUserCoords || null,
                  error: err2.message || 'Location unavailable',
                });
              },
              { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
            );
            return;
          }

          console.warn('[Web Geolocation] Permission denied by user:', err.message);
          resolve({
            granted: false,
            coords: cachedUserCoords || null,
            error: err.message || 'Location permission denied by browser',
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 60000,
        }
      );
    });
  }

  // 2. Mobile Native (Android & iOS)
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        granted: false,
        coords: cachedUserCoords || null,
        error: 'Location permission was denied',
      };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy || 15,
    };
    notifyLocationListeners(coords);

    return {
      granted: true,
      coords,
    };
  } catch (err: any) {
    console.warn('[Native Location] Failed to acquire GPS:', err);
    return {
      granted: false,
      coords: cachedUserCoords || null,
      error: err.message || 'Failed to detect GPS location',
    };
  }
}

/**
 * Triggers permission and initial location query immediately upon application / site opening.
 */
export async function requestLocationOnStartup(): Promise<LocationResult> {
  if (isPromptInProgress) {
    return { granted: !!cachedUserCoords, coords: cachedUserCoords };
  }
  isPromptInProgress = true;
  try {
    return await acquireUserLocation();
  } finally {
    isPromptInProgress = false;
  }
}
