import { Paths, File, Directory } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { LocationCoordinate, OfflineRouteData, RouteTip } from '../types';

const OFFLINE_CACHE_KEY = '@routemate_last_cached_route';

// Standard fallback route coordinates (e.g. Prague Old Town to Mustek Metro)
export const DEFAULT_OFFLINE_POLYLINE: LocationCoordinate[] = [
  { latitude: 50.0875, longitude: 14.4211 },
  { latitude: 50.0868, longitude: 14.4218 },
  { latitude: 50.0855, longitude: 14.4229 },
  { latitude: 50.0845, longitude: 14.4237 },
  { latitude: 50.0833, longitude: 14.4242 },
];

export const LOW_SIGNAL_SAFETY_TIPS: RouteTip[] = [
  {
    id: 'tip-1',
    title: 'Keep Visual Line of Sight',
    description: 'In cobblestone alleys with bouncing GPS, stay oriented using major street lanterns and metro egress signs.',
    category: 'low_signal',
    verified: true,
  },
  {
    id: 'tip-2',
    title: 'Offline Map Cached',
    description: 'Vector paths are stored in flash memory. Turn navigation remains active without cellular data.',
    category: 'low_signal',
    verified: true,
  },
  {
    id: 'tip-3',
    title: 'Emergency SMS Fallback',
    description: 'If 4G/5G drops, the SOS button automatically falls back to raw SMS coordinate broadcast to local desk.',
    category: 'safety',
    verified: true,
  },
];

/**
 * Initialize offline storage directory
 */
export async function ensureOfflineDirectoryExists(): Promise<void> {
  try {
    const dir = new Directory(Paths.document, 'routemate_cache');
    if (!dir.exists) {
      dir.create();
    }
  } catch (err) {
    console.warn('Offline cache directory error:', err);
  }
}

/**
 * Cache current trip route to local storage and filesystem
 */
export async function cacheTripRoute(routeData: OfflineRouteData): Promise<void> {
  try {
    await ensureOfflineDirectoryExists();
    const file = new File(Paths.document, `routemate_cache/route_${routeData.id}.json`);
    if (file.exists) {
      file.delete();
    }
    file.create();
    file.write(JSON.stringify(routeData));
    await AsyncStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(routeData));
  } catch (err) {
    console.warn('Failed to cache trip route offline:', err);
    await AsyncStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(routeData));
  }
}

/**
 * Load the last cached offline route
 */
export async function getLastCachedRoute(): Promise<OfflineRouteData | null> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read cached route from storage:', err);
  }

  // Provide high-fidelity built-in offline route if nothing is cached yet
  return {
    id: 'offline-cached-route-1',
    destination: 'Mustek Metro Station, Exit A',
    origin: { latitude: 50.0875, longitude: 14.4211 },
    destinationCoords: { latitude: 50.0833, longitude: 14.4242 },
    polylineCoords: DEFAULT_OFFLINE_POLYLINE,
    distanceText: '620m (7 min walk)',
    durationText: '7 mins',
    cachedAt: Date.now(),
    tips: LOW_SIGNAL_SAFETY_TIPS,
  };
}

/**
 * Subscribe to real-time network connectivity changes
 */
export function subscribeToNetworkStatus(callback: (isConnected: boolean, isLowSignal: boolean) => void): () => void {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const isConnected = !!state.isConnected && (state.isInternetReachable ?? true);
    // Low signal detection based on connection type / cellular generation
    const isLowSignal =
      !isConnected ||
      (state.type === 'cellular' &&
        (state.details as any)?.cellularGeneration === '2g');
    callback(isConnected, isLowSignal);
  });

  return unsubscribe;
}
