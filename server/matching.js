/**
 * ROUTEMATE BACKEND — PURE SPATIAL & GUIDE MATCHING SERVICE
 */

const EARTH_RADIUS_KM = 6371;

function calculateHaversineDistanceKm(from, to) {
  if (from.latitude === to.latitude && from.longitude === to.longitude) {
    return 0;
  }

  const toRad = (val) => (val * Math.PI) / 180;
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

function calculateWalkingEtaMinutes(distanceKm, speedKmH = 4.8) {
  if (distanceKm <= 0) return 1;
  const minutes = Math.round((distanceKm / speedKmH) * 60);
  return Math.max(1, minutes);
}

function scoreAndRankGuides(travelerLocation, guides, radiusKm = 5.0) {
  const eligible = guides.filter((g) => {
    if (!g.isOnline || !g.isVerified) return false;
    const dist = calculateHaversineDistanceKm(travelerLocation, g.location);
    return dist <= radiusKm;
  });

  return eligible
    .map((g) => {
      const distKm = calculateHaversineDistanceKm(travelerLocation, g.location);
      const etaMin = calculateWalkingEtaMinutes(distKm);
      const proximityScore = Math.max(0, 1 - distKm / radiusKm) * 45;
      const ratingScore = ((g.rating || 5.0) / 5.0) * 25;
      const fastScore = g.fastResponder ? 15 : 5;
      const totalScore = Number((proximityScore + ratingScore + fastScore + 10).toFixed(1));

      return {
        ...g,
        distanceKm: distKm,
        distance: distKm < 1 ? `${Math.round(distKm * 1000)}m away` : `${distKm.toFixed(1)} km away`,
        eta: `${etaMin} min walk`,
        matchScore: totalScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = {
  calculateHaversineDistanceKm,
  calculateWalkingEtaMinutes,
  scoreAndRankGuides,
};
