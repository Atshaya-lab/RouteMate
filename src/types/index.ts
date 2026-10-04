export type UserRole = 'traveler' | 'guide';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  altitude?: number;
}

export interface User {
  id: string;
  phoneNumber: string;
  role: UserRole;
  name: string;
  avatarUrl: string;
  isOnline?: boolean;
}

export interface GuideProfile {
  id: string;
  name: string;
  avatarUrl: string;
  rating: number;
  reviewCount: number;
  distance: string;
  distanceKm: number;
  eta: string;
  pricePerSession: number;
  languages: string[];
  location: LocationCoordinate;
  isOnline: boolean;
  isVerified: boolean;
  fastResponder: boolean;
  specialty: string;
  modes: ('call' | 'chat' | 'meetup')[];
}

export type RequestStatus =
  | 'searching'
  | 'guides_found'
  | 'matched'
  | 'accepted'
  | 'no_guides_found'
  | 'cancelled'
  | 'completed';

export interface TripRequest {
  id: string;
  travelerId: string;
  travelerName: string;
  travelerPhone: string;
  travelerAvatar: string;
  destination: string;
  pickupLocation: LocationCoordinate;
  destinationLocation?: LocationCoordinate;
  status: RequestStatus;
  searchRadiusKm: number;
  respondingGuides: GuideProfile[];
  selectedGuideId?: string;
  selectedMode: 'call' | 'chat' | 'meetup';
  createdAt: number;
  expiresAt: number;
}

export interface ActiveSession {
  id: string;
  requestId: string;
  travelerId: string;
  guideId: string;
  guide: GuideProfile;
  traveler: {
    id: string;
    name: string;
    avatarUrl: string;
    location: LocationCoordinate;
  };
  status: 'connecting' | 'active' | 'completed' | 'cancelled';
  mode: 'call' | 'chat' | 'meetup';
  startedAt: number;
  durationSeconds: number;
  destination: string;
  currentGuideLocation: LocationCoordinate;
  currentTravelerLocation: LocationCoordinate;
  audioEncrypted: boolean;
  beaconActive: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
  isGuide: boolean;
}

export interface RouteTip {
  id: string;
  title: string;
  description: string;
  category: 'safety' | 'transit' | 'local_secret' | 'low_signal';
  verified: boolean;
}

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  location: LocationCoordinate;
  timestamp: number;
  status: 'triggered' | 'dispatched' | 'resolved';
  respondersNotified: number;
}

export interface OfflineRouteData {
  id: string;
  destination: string;
  origin: LocationCoordinate;
  destinationCoords: LocationCoordinate;
  polylineCoords: LocationCoordinate[];
  distanceText: string;
  durationText: string;
  cachedAt: number;
  tips: RouteTip[];
  mapTileCacheUri?: string;
}
