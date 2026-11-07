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

/**
 * Robust cross-platform location acquirer.
 * - On Web: Uses browser HTML5 navigator.geolocation to directly trigger
 *   the browser's native location permission dialog ("Allow location").
 * - On Android/iOS: Uses expo-location foreground permissions & GPS.
 */
export async function acquireUserLocation(): Promise<LocationResult> {
  // 1. Web Browser Geolocation
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'geolocation' in navigator) {
    return new Promise<LocationResult>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            granted: true,
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy || 10,
            },
          });
        },
        (err) => {
          console.warn('[Web Geolocation] Error or denied:', err.message);
          resolve({
            granted: false,
            coords: null,
            error: err.message || 'Location permission denied by browser',
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 30000,
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
        coords: null,
        error: 'Location permission was denied',
      };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      granted: true,
      coords: {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy || 15,
      },
    };
  } catch (err: any) {
    console.warn('[Native Location] Failed to acquire GPS:', err);
    return {
      granted: false,
      coords: null,
      error: err.message || 'Failed to detect GPS location',
    };
  }
}
