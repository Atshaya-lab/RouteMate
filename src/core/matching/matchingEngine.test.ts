import {
  calculateHaversineDistanceKm,
  calculateWalkingEtaMinutes,
  formatDistance,
  formatWalkingEta,
  getExpandedSearchRadiusKm,
  filterEligibleGuides,
  calculateGuideMatchScore,
  rankNearbyGuides,
  shouldTriggerOfflineFallback,
  CandidateGuide,
  GeoCoordinate,
} from './matchingEngine';

describe('RouteMate Pure Matching Engine', () => {
  const travelerLocation: GeoCoordinate = {
    latitude: 9.5747,
    longitude: 77.6815,
  };

  const sampleGuides: CandidateGuide[] = [
    {
      id: 'guide-001',
      name: 'Achu',
      location: { latitude: 9.5762, longitude: 77.6822 }, // ~180m
      isOnline: true,
      isVerified: true,
      fastResponder: true,
      rating: 5.0,
      reviewCount: 248,
      languages: ['Tamil', 'English'],
    },
    {
      id: 'guide-002',
      name: 'Malar',
      location: { latitude: 9.5724, longitude: 77.6810 }, // ~260m
      isOnline: true,
      isVerified: true,
      fastResponder: false,
      rating: 4.98,
      reviewCount: 195,
      languages: ['Tamil', 'English'],
    },
    {
      id: 'guide-003',
      name: 'Ashika',
      location: { latitude: 9.5776, longitude: 77.6828 }, // ~350m
      isOnline: true,
      isVerified: true,
      fastResponder: true,
      rating: 4.95,
      reviewCount: 310,
      languages: ['Tamil', 'English', 'Malayalam'],
    },
    {
      id: 'guide-offline',
      name: 'Offline Guide',
      location: { latitude: 9.5748, longitude: 77.6816 }, // ~20m
      isOnline: false,
      isVerified: true,
      fastResponder: true,
      rating: 5.0,
      reviewCount: 100,
      languages: ['English'],
    },
    {
      id: 'guide-unverified',
      name: 'Unverified Guide',
      location: { latitude: 9.5748, longitude: 77.6816 }, // ~20m
      isOnline: true,
      isVerified: false,
      fastResponder: true,
      rating: 5.0,
      reviewCount: 100,
      languages: ['English'],
    },
    {
      id: 'guide-far',
      name: 'Far Guide',
      location: { latitude: 9.6500, longitude: 77.7500 }, // ~11 km
      isOnline: true,
      isVerified: true,
      fastResponder: true,
      rating: 5.0,
      reviewCount: 500,
      languages: ['English'],
    },
  ];

  describe('1. Spatial Haversine Distance Calculation', () => {
    it('returns 0 for identical coordinates', () => {
      const dist = calculateHaversineDistanceKm(travelerLocation, travelerLocation);
      expect(dist).toBe(0);
    });

    it('calculates short distance within campus accurately', () => {
      const target: GeoCoordinate = { latitude: 9.5762, longitude: 77.6822 };
      const dist = calculateHaversineDistanceKm(travelerLocation, target);
      expect(dist).toBeGreaterThan(0.15);
      expect(dist).toBeLessThan(0.22);
    });

    it('calculates known long-distance pair accurately', () => {
      // London (51.5074, -0.1278) to Paris (48.8566, 2.3522) ~ 343.5 km
      const london: GeoCoordinate = { latitude: 51.5074, longitude: -0.1278 };
      const paris: GeoCoordinate = { latitude: 48.8566, longitude: 2.3522 };
      const dist = calculateHaversineDistanceKm(london, paris);
      expect(dist).toBeGreaterThan(340);
      expect(dist).toBeLessThan(350);
    });
  });

  describe('2. Pedestrian Walking ETA & Formatting', () => {
    it('calculates minimum 1 minute for small distances', () => {
      expect(calculateWalkingEtaMinutes(0.05)).toBe(1);
    });

    it('calculates walking time proportionally at 4.8 km/h', () => {
      expect(calculateWalkingEtaMinutes(2.4, 4.8)).toBe(30);
      expect(calculateWalkingEtaMinutes(4.8, 4.8)).toBe(60);
    });

    it('formats distance in meters when < 1km', () => {
      expect(formatDistance(0.18)).toBe('180m away');
      expect(formatDistance(0.05)).toBe('50m away');
    });

    it('formats distance in kilometers when >= 1km', () => {
      expect(formatDistance(1.24)).toBe('1.2 km away');
      expect(formatDistance(5.0)).toBe('5.0 km away');
    });

    it('formats walking ETA', () => {
      expect(formatWalkingEta(3)).toBe('3 min walk');
      expect(formatWalkingEta(15)).toBe('15 min walk');
    });
  });

  describe('3. Progressive Radius Expansion', () => {
    it('returns 1.0 km on initial step 0', () => {
      const step0 = getExpandedSearchRadiusKm(0);
      expect(step0.radiusKm).toBe(1.0);
      expect(step0.isMaxRadius).toBe(false);
    });

    it('expands to 2.5 km on step 1', () => {
      const step1 = getExpandedSearchRadiusKm(1);
      expect(step1.radiusKm).toBe(2.5);
      expect(step1.isMaxRadius).toBe(false);
    });

    it('expands to 5.0 km on step 2', () => {
      const step2 = getExpandedSearchRadiusKm(2);
      expect(step2.radiusKm).toBe(5.0);
      expect(step2.isMaxRadius).toBe(false);
    });

    it('reaches maximum radius (10.0 km) on step 3', () => {
      const step3 = getExpandedSearchRadiusKm(3);
      expect(step3.radiusKm).toBe(10.0);
      expect(step3.isMaxRadius).toBe(true);
    });

    it('caps at maximum radius if stepIndex exceeds schedule', () => {
      const stepOver = getExpandedSearchRadiusKm(99);
      expect(stepOver.radiusKm).toBe(10.0);
      expect(stepOver.isMaxRadius).toBe(true);
    });
  });

  describe('4. Eligible Guide Filtering', () => {
    it('filters out offline guides', () => {
      const eligible = filterEligibleGuides(travelerLocation, sampleGuides, 5.0);
      expect(eligible.find((g) => g.id === 'guide-offline')).toBeUndefined();
    });

    it('filters out unverified guides', () => {
      const eligible = filterEligibleGuides(travelerLocation, sampleGuides, 5.0);
      expect(eligible.find((g) => g.id === 'guide-unverified')).toBeUndefined();
    });

    it('filters out guides exceeding current radius', () => {
      const eligible = filterEligibleGuides(travelerLocation, sampleGuides, 1.0);
      expect(eligible.find((g) => g.id === 'guide-far')).toBeUndefined();
      expect(eligible.length).toBe(3); // Achu, Malar, Ashika
    });
  });

  describe('5. Weighted Guide Scoring & Ranking', () => {
    it('rewards proximity in match score', () => {
      const closeGuide = sampleGuides[0]; // Achu (~180m)
      const furtherGuide = sampleGuides[2]; // Ashika (~350m)

      const scoreClose = calculateGuideMatchScore(0.18, closeGuide, 5.0, ['English']);
      const scoreFurther = calculateGuideMatchScore(0.35, furtherGuide, 5.0, ['English']);

      expect(scoreClose.breakdown.proximityScore).toBeGreaterThan(scoreFurther.breakdown.proximityScore);
    });

    it('rewards language match bonus', () => {
      const guide = sampleGuides[2]; // Ashika (Tamil, English, Malayalam)
      const withMatch = calculateGuideMatchScore(0.3, guide, 5.0, ['Malayalam']);
      const withoutMatch = calculateGuideMatchScore(0.3, guide, 5.0, ['French']);

      expect(withMatch.breakdown.languageScore).toBe(10);
      expect(withoutMatch.breakdown.languageScore).toBe(3);
    });

    it('ranks closer, fast-responding guides at top of list', () => {
      const ranked = rankNearbyGuides(travelerLocation, sampleGuides, {
        maxRadiusKm: 1.0,
        preferredLanguages: ['Tamil', 'English'],
      });

      expect(ranked.length).toBe(3);
      expect(ranked[0].guide.name).toBe('Achu');
      expect(ranked[0].matchScore).toBeGreaterThanOrEqual(ranked[1].matchScore);
      expect(ranked[1].matchScore).toBeGreaterThanOrEqual(ranked[2].matchScore);
    });
  });

  describe('6. Offline Fallback Routing Trigger Criteria', () => {
    it('returns false if guides are available within timeout', () => {
      const ranked = rankNearbyGuides(travelerLocation, sampleGuides, { maxRadiusKm: 1.0 });
      expect(shouldTriggerOfflineFallback(ranked, 10, 30)).toBe(false);
    });

    it('returns false if search is still under timeout even if 0 guides', () => {
      expect(shouldTriggerOfflineFallback([], 15, 30)).toBe(false);
    });

    it('returns true when 0 guides and search duration hits/exceeds 30s timeout', () => {
      expect(shouldTriggerOfflineFallback([], 30, 30)).toBe(true);
      expect(shouldTriggerOfflineFallback([], 45, 30)).toBe(true);
    });
  });
});
