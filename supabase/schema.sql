-- ============================================================================
-- ROUTEMATE — SUPABASE DATABASE MIGRATION & SEED SCHEMA
-- Run this complete script in your Supabase SQL Editor (SQL Editor -> New Query)
-- ============================================================================

-- 1. Create Profiles Table (Travelers & Verified Guides)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'traveler', -- 'traveler' | 'guide' | 'dispatcher'
  avatar_url TEXT,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  price_per_session NUMERIC(6, 2) DEFAULT 8.0,
  languages TEXT[] DEFAULT '{"English (Fluent)"}',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_online BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  fast_responder BOOLEAN DEFAULT false,
  specialty TEXT,
  modes TEXT[] DEFAULT '{"call", "chat", "meetup"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Trip Requests Table (Radar Searches & Requests)
CREATE TABLE IF NOT EXISTS public.trip_requests (
  id TEXT PRIMARY KEY,
  traveler_id TEXT NOT NULL,
  traveler_name TEXT,
  traveler_avatar TEXT,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination TEXT NOT NULL,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'searching', -- 'searching' | 'accepted' | 'completed' | 'cancelled'
  search_radius_km NUMERIC DEFAULT 1.0,
  assigned_guide_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  timeout_at TIMESTAMPTZ
);

-- 3. Create Active Sessions Table (Ongoing Escort Walks)
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  guide_id TEXT REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'cancelled'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 4. Create Session Messages Table (Encrypted In-App Chat)
CREATE TABLE IF NOT EXISTS public.session_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES public.active_sessions(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL, -- 'traveler' | 'guide' | 'system'
  text TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Emergency SOS Alerts Table
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'triggered', -- 'triggered' | 'acknowledged' | 'dispatched' | 'resolved'
  responders_notified INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Waitlist Subscribers Table (Push Notification Waitlist)
CREATE TABLE IF NOT EXISTS public.waitlist_subscribers (
  id BIGSERIAL PRIMARY KEY,
  contact TEXT NOT NULL,
  destination TEXT NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 📍 SPATIAL HAVERSINE FUNCTION: get_nearby_guides
-- Finds guides within radius_km ordered by distance
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_nearby_guides(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5.0
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  avatar_url TEXT,
  rating NUMERIC,
  review_count INT,
  price_per_session NUMERIC,
  languages TEXT[],
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_online BOOLEAN,
  is_verified BOOLEAN,
  fast_responder BOOLEAN,
  specialty TEXT,
  modes TEXT[],
  distance_km DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.id,
    p.name,
    p.avatar_url,
    p.rating,
    p.review_count,
    p.price_per_session,
    p.languages,
    p.latitude,
    p.longitude,
    p.is_online,
    p.is_verified,
    p.fast_responder,
    p.specialty,
    p.modes,
    ROUND(
      (6371 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(user_lat)) * cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(p.latitude))
        ))
      ))::numeric, 2
    )::double precision AS distance_km
  FROM public.profiles p
  WHERE p.role = 'guide'
    AND p.is_online = true
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (
      6371 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(user_lat)) * cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(p.latitude))
        ))
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
$$;

-- ============================================================================
-- ⚡ ENABLE SUPABASE REALTIME REPLICATION
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;

-- ============================================================================
-- 🌟 SEED INITIAL VERIFIED GUIDES & TRAVELER
-- ============================================================================
INSERT INTO public.profiles (
  id, name, role, avatar_url, rating, review_count, price_per_session, languages,
  latitude, longitude, is_online, is_verified, fast_responder, specialty, modes
) VALUES
(
  'guide-001',
  'Elena Rostova',
  'guide',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  4.9,
  184,
  8.00,
  '{"English (Native)", "Spanish (C2)", "Italian (Fluent)"}',
  50.0882,
  14.4225,
  true,
  true,
  true,
  'Historic Old Town Alleyway Specialist',
  '{"call", "chat", "meetup"}'
),
(
  'guide-002',
  'Marcus Vance',
  'guide',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  4.8,
  92,
  7.00,
  '{"English", "German"}',
  50.0895,
  14.4182,
  true,
  true,
  true,
  'Transit Hubs & Safe Egress Navigator',
  '{"call", "chat", "meetup"}'
),
(
  'guide-003',
  'Sophia Chen',
  'guide',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  5.0,
  210,
  9.00,
  '{"English", "Mandarin", "Catalan"}',
  50.0862,
  14.4258,
  true,
  true,
  false,
  'Top Neighborhood Specialist',
  '{"call", "chat", "meetup"}'
),
(
  'guide-004',
  'Mateo Silva',
  'guide',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  4.98,
  340,
  8.00,
  '{"English", "Czech", "German"}',
  50.0871,
  14.4219,
  true,
  true,
  true,
  'Night Walk & Commuter Guide',
  '{"call", "chat", "meetup"}'
),
(
  'traveler-001',
  'Alex Morgan',
  'traveler',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  5.0,
  14,
  0,
  '{"English"}',
  50.0875,
  14.4211,
  true,
  true,
  false,
  'Solo Traveler',
  '{"call", "chat", "meetup"}'
)
ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  is_online = EXCLUDED.is_online,
  is_verified = EXCLUDED.is_verified;
