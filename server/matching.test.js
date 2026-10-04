const {
  calculateHaversineDistanceKm,
  calculateWalkingEtaMinutes,
  scoreAndRankGuides,
} = require('./matching');

describe('Backend Spatial & Guide Matching Service', () => {
  const userCoords = { latitude: 9.5747, longitude: 77.6815 };

  const testGuides = [
    {
      id: 'g-1',
      name: 'Achu',
      location: { latitude: 9.5760, longitude: 77.6820 },
      isOnline: true,
      isVerified: true,
      fastResponder: true,
      rating: 5.0,
    },
    {
      id: 'g-2',
      name: 'Malar',
      location: { latitude: 9.5780, longitude: 77.6830 },
      isOnline: true,
      isVerified: true,
      fastResponder: false,
      rating: 4.9,
    },
    {
      id: 'g-offline',
      name: 'Offline Guide',
      location: { latitude: 9.5750, longitude: 77.6816 },
      isOnline: false,
      isVerified: true,
      fastResponder: true,
      rating: 5.0,
    },
  ];

  it('calculates spatial Haversine distance correctly in km', () => {
    const dist = calculateHaversineDistanceKm(userCoords, { latitude: 9.5760, longitude: 77.6820 });
    expect(dist).toBeGreaterThan(0.1);
    expect(dist).toBeLessThan(0.3);
  });

  it('calculates walking ETA accurately in minutes', () => {
    expect(calculateWalkingEtaMinutes(0.2)).toBe(3); // 200m at 4.8 km/h ~ 2.5 min -> 3 min
    expect(calculateWalkingEtaMinutes(2.4)).toBe(30);
  });

  it('filters out offline guides and ranks online guides by weighted match score', () => {
    const ranked = scoreAndRankGuides(userCoords, testGuides, 2.0);
    expect(ranked.length).toBe(2);
    expect(ranked[0].name).toBe('Achu');
    expect(ranked[0].matchScore).toBeGreaterThanOrEqual(ranked[1].matchScore);
    expect(ranked.find((g) => g.id === 'g-offline')).toBeUndefined();
  });
});
