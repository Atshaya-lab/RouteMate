import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GuideProfile, TripRequest, ActiveSession, ChatMessage, SOSAlert, LocationCoordinate } from '../types';

// ============================================================================
// 🔑 SUPABASE CONFIGURATION
// Paste your Supabase Project URL and Anon Public Key below:
// ============================================================================
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ykqhdpybffwktezvvfyg.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcWhkcHliZmZ3a3RlenZ2ZnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMTQyNDYsImV4cCI6MjEwNjY5MDI0Nn0.EgttCR7rmyvEQJPikvyYjJ1x84jgocEYB-nNk5KkZ6M';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    !SUPABASE_URL.includes('YOUR_SUPABASE_URL') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
  );
};

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? SUPABASE_URL : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured() ? SUPABASE_ANON_KEY : 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// ============================================================================
// 📍 REAL-TIME DATABASE HELPERS
// ============================================================================

/**
 * Broadcast Guide's real-time phone GPS coordinates into Supabase
 */
export async function updateGuideLiveLocation(
  guideId: string,
  lat: number,
  lng: number,
  isOnline: boolean = true
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        latitude: lat,
        longitude: lng,
        is_online: isOnline,
        updated_at: new Date().toISOString(),
      })
      .eq('id', guideId);

    if (error) {
      console.warn(`Supabase location update error for ${guideId}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error updating live guide location in Supabase:', err);
    return false;
  }
}

/**
 * Fetch nearby active guides from Supabase using spatial RPC or table query
 */
export async function fetchSupabaseGuides(
  lat: number,
  lng: number,
  radiusKm: number = 5
): Promise<GuideProfile[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    // Try spatial RPC function if created in Supabase SQL editor
    const { data, error } = await supabase.rpc('get_nearby_guides', {
      user_lat: lat,
      user_lng: lng,
      radius_km: radiusKm,
    });

    if (!error && data && data.length > 0) {
      return data.map((g: any) => ({
        id: g.id,
        name: g.name,
        avatarUrl: g.avatar_url,
        rating: Number(g.rating) || 4.9,
        reviewCount: Number(g.review_count) || 120,
        distance: `${Number(g.distance_km || 0.5).toFixed(1)} km away`,
        distanceKm: Number(g.distance_km) || 0.5,
        eta: `${Math.max(1, Math.round((Number(g.distance_km) || 0.5) * 6))} min walk`,
        pricePerSession: Number(g.price_per_session) || 8,
        languages: g.languages || ['English (Fluent)', 'Czech'],
        location: {
          latitude: Number(g.latitude) || lat,
          longitude: Number(g.longitude) || lng,
        },
        isOnline: Boolean(g.is_online),
        isVerified: Boolean(g.is_verified),
        fastResponder: Boolean(g.fast_responder),
        specialty: g.specialty || 'Verified City Navigator',
        modes: g.modes || ['call', 'chat', 'meetup'],
      }));
    }

    // Fallback query directly on profiles table
    const { data: profiles, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'guide')
      .eq('is_online', true);

    if (!tableError && profiles && profiles.length > 0) {
      return profiles.map((g: any) => ({
        id: g.id,
        name: g.name || 'Verified Guide',
        avatarUrl: g.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        rating: Number(g.rating) || 4.9,
        reviewCount: Number(g.review_count) || 85,
        distance: '0.4 km away',
        distanceKm: 0.4,
        eta: '2 min walk',
        pricePerSession: Number(g.price_per_session) || 8,
        languages: g.languages || ['English (Native)'],
        location: {
          latitude: Number(g.latitude) || lat,
          longitude: Number(g.longitude) || lng,
        },
        isOnline: true,
        isVerified: true,
        fastResponder: true,
        specialty: g.specialty || 'Safe Passage Specialist',
        modes: ['call', 'chat', 'meetup'],
      }));
    }
  } catch (err) {
    console.warn('Supabase guides fetch error:', err);
  }

  return null;
}

/**
 * Create a new Trip Request in Supabase
 */
export async function createSupabaseTripRequest(request: TripRequest): Promise<TripRequest | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { error } = await supabase
      .from('trip_requests')
      .insert({
        id: request.id,
        traveler_id: request.travelerId,
        traveler_name: request.travelerName,
        traveler_avatar: request.travelerAvatar,
        origin_lat: request.pickupLocation.latitude,
        origin_lng: request.pickupLocation.longitude,
        destination: request.destination,
        destination_lat: request.destinationLocation?.latitude || 50.0833,
        destination_lng: request.destinationLocation?.longitude || 14.4242,
        status: request.status,
        search_radius_km: request.searchRadiusKm,
        created_at: new Date(request.createdAt).toISOString(),
        timeout_at: new Date(request.expiresAt).toISOString(),
      });

    if (error) throw error;
    return request;
  } catch (err) {
    console.warn('Supabase create trip request error:', err);
    return null;
  }
}

/**
 * Accept a trip request in Supabase
 */
export async function acceptSupabaseTripRequest(
  requestId: string,
  guideId: string
): Promise<ActiveSession | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const sessionId = `session-${Date.now()}`;
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('trip_requests')
      .update({ status: 'accepted', assigned_guide_id: guideId })
      .eq('id', requestId);

    if (updateError) throw updateError;

    const { error: sessionError } = await supabase
      .from('active_sessions')
      .insert({
        id: sessionId,
        request_id: requestId,
        guide_id: guideId,
        status: 'active',
        started_at: now,
      });

    if (sessionError) throw sessionError;

    return {
      id: sessionId,
      requestId,
      travelerId: 'traveler-001',
      guideId,
      guide: {
        id: guideId,
        name: 'Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        rating: 4.9,
        reviewCount: 184,
        distance: '0.4 km away',
        distanceKm: 0.4,
        eta: '2 min walk',
        pricePerSession: 8,
        languages: ['English (Native)', 'Spanish (C2)', 'Italian (Fluent)'],
        location: { latitude: 50.0882, longitude: 14.4225 },
        isOnline: true,
        isVerified: true,
        fastResponder: true,
        specialty: 'Historic Old Town Alleyway Specialist',
        modes: ['call', 'chat', 'meetup'],
      },
      traveler: {
        id: 'traveler-001',
        name: 'Alex Morgan',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        location: { latitude: 50.0875, longitude: 14.4211 },
      },
      status: 'active',
      mode: 'call',
      startedAt: Date.now(),
      durationSeconds: 0,
      destination: 'Mustek Metro Station, Exit A',
      currentGuideLocation: { latitude: 50.0882, longitude: 14.4225 },
      currentTravelerLocation: { latitude: 50.0875, longitude: 14.4211 },
      audioEncrypted: true,
      beaconActive: true,
    };
  } catch (err) {
    console.warn('Supabase accept request error:', err);
    return null;
  }
}

/**
 * Send real-time chat message into Supabase
 */
export async function sendSupabaseChatMessage(
  sessionId: string,
  message: ChatMessage
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('session_messages').insert({
      id: message.id,
      session_id: sessionId,
      sender_id: message.senderId,
      sender_role: message.isGuide ? 'guide' : 'traveler',
      text: message.text,
      created_at: new Date(message.timestamp).toISOString(),
    });

    return !error;
  } catch (err) {
    console.warn('Supabase send chat message error:', err);
    return false;
  }
}

/**
 * Trigger an Emergency SOS Beacon into Supabase
 */
export async function triggerSupabaseSOS(alert: SOSAlert): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('sos_alerts').insert({
      id: alert.id,
      user_id: alert.userId,
      user_name: alert.userName,
      user_phone: alert.userPhone,
      latitude: alert.location.latitude,
      longitude: alert.location.longitude,
      status: alert.status,
      responders_notified: alert.respondersNotified,
      created_at: new Date(alert.timestamp).toISOString(),
    });

    return !error;
  } catch (err) {
    console.warn('Supabase SOS trigger error:', err);
    return false;
  }
}

/**
 * Subscribe traveler to notification waitlist in Supabase
 */
export async function subscribeSupabaseWaitlist(
  contact: string,
  destination: string,
  origin: LocationCoordinate
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('waitlist_subscribers').insert({
      contact,
      destination,
      origin_lat: origin.latitude,
      origin_lng: origin.longitude,
      created_at: new Date().toISOString(),
    });

    return !error;
  } catch (err) {
    console.warn('Supabase waitlist subscribe error:', err);
    return false;
  }
}

/**
 * Subscribe to Supabase Realtime changes for a specific trip request or active session
 */
export function subscribeToSupabaseSession(
  sessionId: string,
  onMessageReceived: (message: ChatMessage) => void,
  onLocationUpdated?: (coords: LocationCoordinate) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel(`session-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'session_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const row = payload.new as any;
        onMessageReceived({
          id: row.id,
          sessionId: row.session_id,
          senderId: row.sender_id,
          senderName: row.sender_role === 'guide' ? 'Elena Rostova' : 'Alex Morgan',
          text: row.text,
          timestamp: new Date(row.created_at).getTime(),
          isGuide: row.sender_role === 'guide',
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
