import { GuideProfile, LocationCoordinate, TripRequest, ActiveSession, SOSAlert } from '../types';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.1.1.56:3000';

export async function fetchNearbyGuides(
  location: LocationCoordinate,
  radiusKm: number = 2.5
): Promise<GuideProfile[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/guides/nearby?lat=${location.latitude}&lng=${location.longitude}&radiusKm=${radiusKm}`
    );
    if (res.ok) {
      const data = await res.json();
      return data.guides;
    }
  } catch (err) {
    console.warn('API fetch nearby guides error:', err);
  }
  return [];
}

export async function createTripRequest(request: Partial<TripRequest>): Promise<TripRequest | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/requests/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (res.ok) {
      const data = await res.json();
      return data.request;
    }
  } catch (err) {
    console.warn('API create trip request error:', err);
  }
  return null;
}

export async function triggerEmergencySOS(alert: Partial<SOSAlert>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sos/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    return res.ok;
  } catch (err) {
    console.warn('API trigger SOS error:', err);
    return false;
  }
}
