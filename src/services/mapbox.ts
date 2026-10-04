import Mapbox from '@rnmapbox/maps';
import * as FileSystem from 'expo-file-system';

// ============================================================================
// 🗺️ MAPBOX CONFIGURATION & OFFLINE TILE PACK MANAGER
// ============================================================================

export const MAPBOX_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Initialize Mapbox SDK Token
if (MAPBOX_ACCESS_TOKEN) {
  try {
    Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
  } catch (err) {
    console.warn('Mapbox initialization warning:', err);
  }
}

export const MAPBOX_STYLES = {
  STREETS: Mapbox.StyleURL?.Street || 'mapbox://styles/mapbox/streets-v12',
  DARK: Mapbox.StyleURL?.Dark || 'mapbox://styles/mapbox/dark-v11',
  LIGHT: Mapbox.StyleURL?.Light || 'mapbox://styles/mapbox/light-v11',
  OUTDOORS: Mapbox.StyleURL?.Outdoors || 'mapbox://styles/mapbox/outdoors-v12',
};

/**
 * Fetch Mapbox Directions API route geometry (pedestrian / walking)
 */
export async function fetchMapboxWalkingRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<{ coordinates: [number, number][]; durationMinutes: number; distanceMeters: number } | null> {
  try {
    const coordsString = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordsString}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Directions API returned ${res.status}`);
    }

    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const primaryRoute = data.routes[0];
      return {
        coordinates: primaryRoute.geometry.coordinates as [number, number][],
        durationMinutes: Math.round(primaryRoute.duration / 60),
        distanceMeters: Math.round(primaryRoute.distance),
      };
    }
  } catch (err) {
    console.warn('Could not fetch Mapbox walking directions:', err);
  }

  // Pure fallback: straight line geometry
  return {
    coordinates: [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude],
    ],
    durationMinutes: 4,
    distanceMeters: 300,
  };
}

/**
 * Pre-cache offline region pack for low-connectivity offline mode
 */
export async function downloadOfflineRegionPack(
  name: string,
  center: { latitude: number; longitude: number },
  radiusKm: number = 2.0
): Promise<boolean> {
  try {
    const delta = radiusKm / 111;
    const bounds: [[number, number], [number, number]] = [
      [center.longitude + delta, center.latitude + delta], // NE
      [center.longitude - delta, center.latitude - delta], // SW
    ];

    if (Mapbox.offlineManager) {
      await Mapbox.offlineManager.createPack(
        {
          name,
          styleURL: MAPBOX_STYLES.STREETS,
          minZoom: 13,
          maxZoom: 18,
          bounds,
        },
        (pack: any, status: any) => {
          if (status && status.percentage !== undefined) {
            console.log(`Offline map pack "${name}" progress: ${status.percentage}%`);
          }
        }
      );
      return true;
    }
  } catch (err) {
    console.warn('Mapbox offline region download error:', err);
  }
  return false;
}
