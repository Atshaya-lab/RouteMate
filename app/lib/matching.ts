/**
 * ============================================================================
 * ROUTEMATE — PURE GUIDE MATCHING ENGINE
 * ============================================================================
 */

import { LocationCoordinate, GuideProfile } from '../types';

export const EARTH_RADIUS_KM = 6371;
export const DEFAULT_SEARCH_RADII_KM = [1.0, 2.5, 5.0, 10.0];

export function calculateHaversineDistanceKm(
  from: LocationCoordinate,
  to: LocationCoordinate
): number {
  if (from.latitude === to.latitude && from.longitude === to.longitude) return 0;
  const toRad = (val: number) => (val * Math.PI) / 180;
  const lat1 = toRad(from.latitude);
  const lon1 = toRad(from.longitude);
  const lat2 = toRad(to.latitude);
  const lon2 = toRad(to.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const clamped = Math.min(1.0, Math.max(-1.0, a));
  const c = 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped));
  return Number((EARTH_RADIUS_KM * c).toFixed(3));
}

export function calculateWalkingEtaMinutes(distanceKm: number, speedKmH: number = 4.8): number {
  if (distanceKm <= 0) return 1;
  return Math.max(1, Math.round((distanceKm / speedKmH) * 60));
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1.0) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

export function scoreAndRankGuides(
  travelerLocation: LocationCoordinate,
  guides: GuideProfile[],
  radiusKm: number = 5.0
): GuideProfile[] {
  return guides
    .filter((g) => g.isOnline && g.isVerified)
    .map((g) => {
      const dist = calculateHaversineDistanceKm(travelerLocation, g.location);
      const etaMin = calculateWalkingEtaMinutes(dist);
      return {
        ...g,
        distanceKm: dist,
        distance: formatDistance(dist),
        eta: `${etaMin} min walk`,
      };
    })
    .filter((g) => g.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
