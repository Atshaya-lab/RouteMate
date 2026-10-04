import * as Location from 'expo-location';
import { LocationCoordinate } from '../types';

// Default fallback coordinate (Prague Old Town from design: 50.0875, 14.4211)
export const DEFAULT_FALLBACK_LOCATION: LocationCoordinate = {
  latitude: 50.0875,
  longitude: 14.4211,
  accuracy: 3.0,
};

// Destination coordinates for immediate walking distance locations around user GPS
export const DESTINATION_PRESETS: Record<string, LocationCoordinate> = {
  'Hostel Block & Gate': { latitude: 9.5758, longitude: 77.6826 },
  'Library & Tech Block': { latitude: 9.5762, longitude: 77.6804 },
  'Food Court & Canteen': { latitude: 9.5738, longitude: 77.6818 },
  'Safe Haven / Health Center': { latitude: 9.5751, longitude: 77.6822 },
  'Main Arch & Auto Stand': { latitude: 9.5772, longitude: 77.6830 },
  'Krishnankoil Bus Stop': { latitude: 9.5732, longitude: 77.6808 },
};

export interface PermissionStatusResult {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

/**
 * Request foreground GPS permission gracefully.
 */
export async function requestForegroundLocationPermission(): Promise<PermissionStatusResult> {
  try {
    const { status, canAskAgain, granted } = await Location.requestForegroundPermissionsAsync();
    return { granted, canAskAgain, status };
  } catch (error) {
    console.warn('Location permission request failed:', error);
    return {
      granted: false,
      canAskAgain: true,
      status: Location.PermissionStatus.DENIED,
    };
  }
}

/**
 * Check existing foreground location permission status without prompting.
 */
export async function getForegroundLocationPermissionStatus(): Promise<PermissionStatusResult> {
  try {
    const { status, canAskAgain, granted } = await Location.getForegroundPermissionsAsync();
    return { granted, canAskAgain, status };
  } catch (error) {
    return {
      granted: false,
      canAskAgain: true,
      status: Location.PermissionStatus.UNDETERMINED,
    };
  }
}

/**
 * Request background GPS permission for continuous SOS safety beacon monitoring.
 * Note: App Store / Google Play guidelines require user-facing justification.
 */
export async function requestBackgroundLocationPermission(): Promise<boolean> {
  try {
    const { granted } = await Location.requestBackgroundPermissionsAsync();
    return granted;
  } catch (error) {
    console.warn('Background location permission request warning:', error);
    return false;
  }
}

/**
 * Fetch the traveler's current device coordinate with high accuracy.
 */
export async function getCurrentDeviceLocation(): Promise<LocationCoordinate> {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {}
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission not granted, using fallback');
      return DEFAULT_FALLBACK_LOCATION;
    }

    // Try last known position first for instant response
    let lastKnown = null;
    try {
      lastKnown = await Location.getLastKnownPositionAsync();
    } catch {}

    // Then get current precise fix
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log(`📍 Acquired Live Phone GPS: ${pos.coords.latitude}, ${pos.coords.longitude}`);

      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? 3.0,
        heading: pos.coords.heading ?? 0,
        altitude: pos.coords.altitude ?? 0,
      };
    } catch (posErr) {
      if (lastKnown) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          accuracy: lastKnown.coords.accuracy ?? 3.0,
          heading: lastKnown.coords.heading ?? 0,
          altitude: lastKnown.coords.altitude ?? 0,
        };
      }
      throw posErr;
    }
  } catch (err) {
    console.warn('Could not acquire precise GPS fix:', err);
    return DEFAULT_FALLBACK_LOCATION;
  }
}

/**
 * Subscribe to real-time continuous GPS device movements.
 */
export async function watchDeviceLocation(
  onLocationChange: (loc: LocationCoordinate) => void
): Promise<() => void> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      const req = await Location.requestForegroundPermissionsAsync();
      if (!req.granted) return () => {};
    }

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 5,
      },
      (loc) => {
        onLocationChange({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy ?? 3.0,
          heading: loc.coords.heading ?? 0,
          altitude: loc.coords.altitude ?? 0,
        });
      }
    );

    return () => sub.remove();
  } catch (err) {
    console.warn('watchPositionAsync failed:', err);
    return () => {};
  }
}

/**
 * Reverse geocode coordinate into human readable street/city name.
 */
export async function reverseGeocodeLocation(coord: LocationCoordinate): Promise<string> {
  try {
    const res = await Location.reverseGeocodeAsync({
      latitude: coord.latitude,
      longitude: coord.longitude,
    });
    if (res && res.length > 0) {
      const place = res[0];
      const street = place.street || place.name || place.district || '';
      const city = place.city || place.region || '';
      if (street && city) return `${street}, ${city}`;
      if (city) return city;
      if (street) return street;
    }
  } catch {}
  return `${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`;
}

/**
 * Calculate distance between two coordinates in kilometers (Haversine formula).
 */
export function calculateDistanceKm(coord1: LocationCoordinate, coord2: LocationCoordinate): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance to human-readable string (e.g., "120m away" or "1.4 km away").
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}
