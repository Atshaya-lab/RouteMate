export type UserRole = 'traveler' | 'guide';

export type SessionMode = 'call' | 'chat' | 'meetup';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  altitude?: number;
}

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: UserRole;
  avatarUrl: string;
  isOnline: boolean;
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
  specialty?: string;
  modes: SessionMode[];
}

export interface TripRequest {
  id: string;
  travelerId: string;
  travelerName: string;
  travelerPhone?: string;
  travelerAvatar: string;
  destination: string;
  pickupLocation: LocationCoordinate;
  destinationLocation?: LocationCoordinate;
  status: 'searching' | 'accepted' | 'completed' | 'cancelled';
  searchRadiusKm: number;
  respondingGuides: GuideProfile[];
  selectedGuideId?: string;
  selectedMode: SessionMode;
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
  status: 'active' | 'completed' | 'cancelled';
  mode: SessionMode;
  startedAt: number;
  durationSeconds: number;
  destination: string;
  currentGuideLocation: LocationCoordinate;
  currentTravelerLocation: LocationCoordinate;
  audioEncrypted: boolean;
  beaconActive: boolean;
}

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  location: LocationCoordinate;
  status: 'triggered' | 'acknowledged' | 'dispatched' | 'resolved';
  respondersNotified: number;
  timestamp: number;
}

export type RootStackParamList = {
  Onboarding: undefined;
  HomeRequest: undefined;
  Searching: { destination: string; searchRadiusKm: number };
  GuideResults: { requestId: string; destination: string };
  ActiveSession: { sessionId: string; guideId: string };
  NoGuideFallback: { destination: string };
  Rating: { sessionId: string; guideName: string };
  GuideDashboard: undefined;
};
