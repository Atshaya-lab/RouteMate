/**
 * ============================================================================
 * ROUTEMATE — PURE GUIDE MATCHING & RANKING ENGINE
 * 
 * Rules:
 * 1. Pure, deterministic, side-effect free mathematical and ranking functions.
 * 2. Independently testable with 100% unit test coverage.
 * 3. Handles Haversine spatial calculation, radius expansion, and multi-factor
 *    weighted score ranking.
 * ============================================================================
 */

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface CandidateGuide {
  id: string;
  name: string;
  location: GeoCoordinate;
  isOnline: boolean;
  isVerified: boolean;
  fastResponder: boolean;
  rating: number; // e.g. 4.95
  reviewCount: number; // e.g. 240
  languages: string[]; // e.g. ['English', 'Tamil']
  pricePerSession?: number;
}

export interface MatchingOptions {
  preferredLanguages?: string[];
  maxRadiusKm?: number;
  walkingSpeedKmH?: number; // default 4.8 km/h
}

export interface RankedGuideResult {
  guide: CandidateGuide;
  distanceKm: number;
  distanceFormatted: string;
  walkingEtaMinutes: number;
  walkingEtaFormatted: string;
  matchScore: number; // 0 to 100
  scoreBreakdown: {
    proximityScore: number;
    ratingScore: number;
    fastResponderScore: number;
    languageScore: number;
    experienceScore: number;
  };
}

export const EARTH_RADIUS_KM = 6371;
export const DEFAULT_SEARCH_RADII_KM = [1.0, 2.5, 5.0, 10.0];
export const DEFAULT_WALKING_SPEED_KM_H = 4.8;

/**
 * Accurately calculate the great-circle distance between two coordinates
 * using the Haversine formula in kilometers.
 */
export function calculateHaversineDistanceKm(
  from: GeoCoordinate,
  to: GeoCoordinate
): number {
  if (
    from.latitude === to.latitude &&
    from.longitude === to.longitude
  ) {
    return 0;
  }

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

  const distance = EARTH_RADIUS_KM * c;
  return Number(distance.toFixed(3));
}

/**
 * Calculate pedestrian walking time in minutes based on distance and walking speed.
 */
export function calculateWalkingEtaMinutes(
  distanceKm: number,
  walkingSpeedKmH: number = DEFAULT_WALKING_SPEED_KM_H
): number {
  if (distanceKm <= 0) return 1;
  const hours = distanceKm / walkingSpeedKmH;
  const minutes = Math.round(hours * 60);
  return Math.max(1, minutes);
}

/**
 * Format distance into human-readable representation (meters or kilometers)
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1.0) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Format walking ETA into human-readable string
 */
export function formatWalkingEta(etaMinutes: number): string {
  return `${etaMinutes} min walk`;
}

/**
 * Progressive search radius expansion step.
 * Expands radius sequentially across steps (e.g. 1.0km -> 2.5km -> 5.0km -> 10.0km).
 */
export function getExpandedSearchRadiusKm(
  stepIndex: number,
  radiiSchedule: number[] = DEFAULT_SEARCH_RADII_KM
): { radiusKm: number; isMaxRadius: boolean } {
  const safeIndex = Math.max(0, stepIndex);
  if (safeIndex >= radiiSchedule.length - 1) {
    return {
      radiusKm: radiiSchedule[radiiSchedule.length - 1],
      isMaxRadius: true,
    };
  }
  return {
    radiusKm: radiiSchedule[safeIndex],
    isMaxRadius: false,
  };
}

/**
 * Filter guides who are strictly online, verified, and within search radius.
 */
export function filterEligibleGuides(
  travelerLocation: GeoCoordinate,
  guides: CandidateGuide[],
  radiusKm: number
): CandidateGuide[] {
  return guides.filter((g) => {
    if (!g.isOnline || !g.isVerified) return false;
    const dist = calculateHaversineDistanceKm(travelerLocation, g.location);
    return dist <= radiusKm;
  });
}

/**
 * Calculate multi-factor weighted ranking score (0 to 100) for a candidate guide:
 * - Proximity (45%): Closer guide scores higher
 * - Rating (25%): 5.0 scale normalized
 * - Fast Responder (15%): Priority bonus
 * - Language Match (10%): Overlap with traveler languages
 * - Experience Volume (5%): Review count logarithmic scale
 */
export function calculateGuideMatchScore(
  distanceKm: number,
  guide: CandidateGuide,
  maxRadiusKm: number,
  preferredLanguages: string[] = []
): {
  totalScore: number;
  breakdown: {
    proximityScore: number;
    ratingScore: number;
    fastResponderScore: number;
    languageScore: number;
    experienceScore: number;
  };
} {
  // 1. Proximity Score (45 points max)
  const proximityRatio = Math.max(0, 1 - distanceKm / Math.max(0.1, maxRadiusKm));
  const proximityScore = Number((proximityRatio * 45).toFixed(2));

  // 2. Rating Score (25 points max) - baseline at 4.0
  const normalizedRating = Math.max(0, Math.min(5.0, guide.rating || 5.0));
  const ratingRatio = normalizedRating / 5.0;
  const ratingScore = Number((ratingRatio * 25).toFixed(2));

  // 3. Fast Responder Score (15 points max)
  const fastResponderScore = guide.fastResponder ? 15 : 5;

  // 4. Language Match Score (10 points max)
  let languageScore = 7; // Default baseline
  if (preferredLanguages.length > 0 && guide.languages) {
    const hasMatch = preferredLanguages.some((lang) =>
      guide.languages.some((gl) => gl.toLowerCase().includes(lang.toLowerCase()))
    );
    languageScore = hasMatch ? 10 : 3;
  }

  // 5. Experience / Volume Score (5 points max)
  const reviewCount = Math.max(0, guide.reviewCount || 0);
  const experienceRatio = Math.min(1.0, Math.log10(reviewCount + 1) / 3); // 1000 reviews = max score
  const experienceScore = Number((experienceRatio * 5).toFixed(2));

  const totalScore = Number(
    (proximityScore + ratingScore + fastResponderScore + languageScore + experienceScore).toFixed(1)
  );

  return {
    totalScore,
    breakdown: {
      proximityScore,
      ratingScore,
      fastResponderScore,
      languageScore,
      experienceScore,
    },
  };
}

/**
 * Score and rank candidate guides by best companion match.
 * Returns sorted list of ranked guides in descending order of matchScore.
 */
export function rankNearbyGuides(
  travelerLocation: GeoCoordinate,
  guides: CandidateGuide[],
  options: MatchingOptions = {}
): RankedGuideResult[] {
  const maxRadiusKm = options.maxRadiusKm || 5.0;
  const speedKmH = options.walkingSpeedKmH || DEFAULT_WALKING_SPEED_KM_H;
  const preferredLanguages = options.preferredLanguages || [];

  const eligible = filterEligibleGuides(travelerLocation, guides, maxRadiusKm);

  const results: RankedGuideResult[] = eligible.map((guide) => {
    const distanceKm = calculateHaversineDistanceKm(travelerLocation, guide.location);
    const walkingEtaMinutes = calculateWalkingEtaMinutes(distanceKm, speedKmH);
    const { totalScore, breakdown } = calculateGuideMatchScore(
      distanceKm,
      guide,
      maxRadiusKm,
      preferredLanguages
    );

    return {
      guide,
      distanceKm,
      distanceFormatted: formatDistance(distanceKm),
      walkingEtaMinutes,
      walkingEtaFormatted: formatWalkingEta(walkingEtaMinutes),
      matchScore: totalScore,
      scoreBreakdown: breakdown,
    };
  });

  // Sort descending by matchScore, tie-break by distance ascending
  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.distanceKm - b.distanceKm;
  });

  return results;
}

/**
 * Check whether no guides are available and offline fallback routing should trigger.
 */
export function shouldTriggerOfflineFallback(
  rankedGuides: RankedGuideResult[],
  searchDurationSeconds: number,
  maxSearchTimeoutSeconds: number = 30
): boolean {
  return rankedGuides.length === 0 && searchDurationSeconds >= maxSearchTimeoutSeconds;
}
