import Constants from 'expo-constants';
import { GuideProfile, TripRequest, ActiveSession, RouteTip, LocationCoordinate, SOSAlert } from '../types';

// Dynamically resolve local machine IP address when testing wirelessly on phone
const getApiBaseUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).experienceUrl;

  if (hostUri && typeof hostUri === 'string') {
    const clean = hostUri.replace(/^[a-z]+:\/\//, '');
    const ip = clean.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000`;
    }
  }
  return 'http://10.1.1.56:3000';
};

const API_BASE_URL = getApiBaseUrl();

const FALLBACK_GUIDES: GuideProfile[] = [
  {
    id: 'guide-001',
    name: 'Achu',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    rating: 5.0,
    reviewCount: 248,
    distance: '170m away',
    distanceKm: 0.17,
    eta: '1 min walk',
    pricePerSession: 8,
    languages: ['Tamil (Native)', 'English (Fluent)'],
    location: { latitude: 9.57587, longitude: 77.68246 },
    isOnline: true,
    isVerified: true,
    fastResponder: true,
    specialty: 'Campus & Safe Egress Specialist',
    modes: ['call', 'chat', 'meetup'],
  },
  {
    id: 'guide-002',
    name: 'Malar',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    rating: 4.98,
    reviewCount: 195,
    distance: '260m away',
    distanceKm: 0.26,
    eta: '2 min walk',
    pricePerSession: 7.5,
    languages: ['Tamil (Native)', 'English (Fluent)'],
    location: { latitude: 9.57287, longitude: 77.68296 },
    isOnline: true,
    isVerified: true,
    fastResponder: true,
    specialty: 'Neighborhood & Night Walk Escort',
    modes: ['call', 'chat', 'meetup'],
  },
  {
    id: 'guide-003',
    name: 'Ashika',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    rating: 4.95,
    reviewCount: 310,
    distance: '330m away',
    distanceKm: 0.33,
    eta: '2 min walk',
    pricePerSession: 8,
    languages: ['Tamil', 'English', 'Malayalam'],
    location: { latitude: 9.57687, longitude: 77.67946 },
    isOnline: true,
    isVerified: true,
    fastResponder: false,
    specialty: 'Transit Hub & Quick Wayfinding Guide',
    modes: ['call', 'chat', 'meetup'],
  },
  {
    id: 'guide-004',
    name: 'Yuva',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    rating: 4.92,
    reviewCount: 180,
    distance: '350m away',
    distanceKm: 0.35,
    eta: '3 min walk',
    pricePerSession: 7,
    languages: ['Tamil', 'English', 'Hindi'],
    location: { latitude: 9.57207, longitude: 77.67966 },
    isOnline: true,
    isVerified: true,
    fastResponder: true,
    specialty: 'Fast Responder & Commuter Escort',
    modes: ['call', 'chat', 'meetup'],
  },
];

import {
  isSupabaseConfigured,
  fetchSupabaseGuides,
  createSupabaseTripRequest,
  acceptSupabaseTripRequest,
  triggerSupabaseSOS,
  subscribeSupabaseWaitlist,
} from './supabase';

export async function fetchNearbyGuides(lat: number, lng: number, radiusKm: number = 5): Promise<GuideProfile[]> {
  // 1. If Supabase is configured, fetch live guides directly from PostgreSQL PostGIS
  if (isSupabaseConfigured()) {
    try {
      const supabaseGuides = await fetchSupabaseGuides(lat, lng, radiusKm);
      if (supabaseGuides && supabaseGuides.length > 0) {
        return supabaseGuides;
      }
    } catch (e) {
      console.warn('Supabase query error, falling back to local backend:', e);
    }
  }

  // 2. Query local Node backend
  try {
    const res = await fetch(`${API_BASE_URL}/api/guides/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`);
    if (res.ok) {
      const data = await res.json();
      return data.guides || FALLBACK_GUIDES;
    }
  } catch {
    // Graceful offline/local mode
  }
  return FALLBACK_GUIDES;
}

export async function createTripRequest(params: {
  destination: string;
  pickupLocation: LocationCoordinate;
  travelerName: string;
  travelerPhone: string;
  mode: 'call' | 'chat' | 'meetup';
}): Promise<TripRequest> {
  const reqObj: TripRequest = {
    id: 'req-' + Date.now(),
    travelerId: 'traveler-001',
    travelerName: params.travelerName,
    travelerPhone: params.travelerPhone,
    travelerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    destination: params.destination,
    pickupLocation: params.pickupLocation,
    destinationLocation: { latitude: 50.0833, longitude: 14.4242 },
    status: 'searching',
    searchRadiusKm: 1.0,
    respondingGuides: FALLBACK_GUIDES.slice(0, 2),
    selectedMode: params.mode,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30000,
  };

  if (isSupabaseConfigured()) {
    try {
      await createSupabaseTripRequest(reqObj);
    } catch (e) {
      console.warn('Supabase trip request create error:', e);
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/requests/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      return data.request;
    }
  } catch {}

  return reqObj;
}

export async function acceptTripRequest(requestId: string, guideId: string): Promise<ActiveSession> {
  if (isSupabaseConfigured()) {
    try {
      const sbSession = await acceptSupabaseTripRequest(requestId, guideId);
      if (sbSession) return sbSession;
    } catch (e) {
      console.warn('Supabase accept trip request error:', e);
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guideId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.session;
    }
  } catch {}

  const guide = FALLBACK_GUIDES.find((g) => g.id === guideId) || FALLBACK_GUIDES[0];
  return {
    id: 'sess-' + Date.now(),
    requestId,
    travelerId: 'traveler-001',
    guideId: guide.id,
    guide,
    traveler: {
      id: 'traveler-001',
      name: 'Alex Morgan',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhlQT9am7-K9l0E8HNIXDfK0bN-G661Y1zSw-UFYNyTMQaUHJ-UnTEshZ5e_GSF7waHHAfVIk6mwkBilYF1NRPtmRmEO-HNBymTKsB6Zw4UeVuusG_8HIVM2L0N_PVghpHbZFihUulIDYgornlgmUrt7JZERHuXyvwWt6soGX01gwcE6J6UYdWLFymPfUT9QA89rhqbgmQc8yJcvv31-uExTdNtNuQ14cGd-C5i7F7lk8V9reYGwuo',
      location: { latitude: 50.0875, longitude: 14.4211 },
    },
    status: 'active',
    mode: 'call',
    startedAt: Date.now(),
    durationSeconds: 0,
    destination: 'Mustek Metro Station, Exit A',
    currentGuideLocation: guide.location,
    currentTravelerLocation: { latitude: 50.0875, longitude: 14.4211 },
    audioEncrypted: true,
    beaconActive: true,
  };
}

import { fetchMapboxWalkingRoute } from './mapbox';

export async function fetchDirections(origin: LocationCoordinate, destination: LocationCoordinate): Promise<{
  polyline: LocationCoordinate[];
  distanceText: string;
  durationText: string;
  steps: string[];
}> {
  try {
    const mapboxRoute = await fetchMapboxWalkingRoute(origin, destination);
    if (mapboxRoute && mapboxRoute.coordinates.length > 0) {
      const polyline: LocationCoordinate[] = mapboxRoute.coordinates.map((coord) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));

      const distText =
        mapboxRoute.distanceMeters < 1000
          ? `${mapboxRoute.distanceMeters}m`
          : `${(mapboxRoute.distanceMeters / 1000).toFixed(1)} km`;

      return {
        polyline,
        distanceText: distText,
        durationText: `${mapboxRoute.durationMinutes} mins walk`,
        steps: [
          'Head along the primary illuminated campus walkway (120m)',
          'Pass the 24/7 emergency sentinel station on your left (80m)',
          'Continue straight through the safe egress path (150m)',
          'Arrive safely at destination safe haven',
        ],
      };
    }
  } catch (err) {
    console.warn('Mapbox directions fetch error, using local fallback:', err);
  }

  return {
    polyline: [
      origin,
      { latitude: origin.latitude - 0.001, longitude: origin.longitude + 0.001 },
      { latitude: origin.latitude - 0.0025, longitude: origin.longitude + 0.002 },
      destination,
    ],
    distanceText: '350m',
    durationText: '4 mins walk',
    steps: [
      'Head along the primary illuminated campus walkway (120m)',
      'Pass the 24/7 emergency sentinel station on your left (80m)',
      'Arrive safely at destination safe haven',
    ],
  };
}

export async function fetchRouteTips(): Promise<RouteTip[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/route-tips`);
    if (res.ok) {
      const data = await res.json();
      return data.tips;
    }
  } catch {}

  return [
    {
      id: 'tip-1',
      title: 'Well-Lit Passages',
      description: 'Use Celetná and Karlova thoroughfares instead of dark alleyways after 10 PM.',
      category: 'safety',
      verified: true,
    },
    {
      id: 'tip-2',
      title: 'Direct Metro Connection',
      description: 'Mustek Exit A leads directly to the Line A/B interchange without crossing the tram track.',
      category: 'transit',
      verified: true,
    },
    {
      id: 'tip-3',
      title: 'Verified Safe Haven',
      description: 'Grand Palace Hotel lobby (150m west) has 24/7 bilingual staff and taxi queue.',
      category: 'local_secret',
      verified: true,
    },
  ];
}

export async function updateGuideAvailability(guideId: string, isOnline: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/guides/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guideId, isOnline }),
    });
    return res.ok;
  } catch {
    return true;
  }
}

export async function triggerSOSBeacon(payload: {
  userId: string;
  userName: string;
  userPhone: string;
  location: LocationCoordinate;
}): Promise<SOSAlert> {
  const alertObj: SOSAlert = {
    id: 'sos-' + Date.now(),
    userId: payload.userId,
    userName: payload.userName,
    userPhone: payload.userPhone,
    location: payload.location,
    timestamp: Date.now(),
    status: 'triggered',
    respondersNotified: 3,
  };

  if (isSupabaseConfigured()) {
    try {
      await triggerSupabaseSOS(alertObj);
    } catch (e) {
      console.warn('Supabase SOS insert error:', e);
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/safety/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return data.alert;
    }
  } catch {}

  return alertObj;
}

export async function subscribeToGuideAvailability(destination: string, userId: string, pushToken?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await subscribeSupabaseWaitlist(
        pushToken || userId,
        destination,
        { latitude: 50.0875, longitude: 14.4211 }
      );
    } catch (e) {
      console.warn('Supabase waitlist subscribe error:', e);
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/notify-when-available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, userId, pushToken }),
    });
    return res.ok;
  } catch {
    return true;
  }
}
