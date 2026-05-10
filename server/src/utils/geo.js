const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function estimateFare({ distanceKm, durationMin, vehicleType = 'standard' }) {
  const rates = {
    standard: { base: 2.5, perKm: 1.2, perMin: 0.25, min: 5 },
    premium: { base: 5, perKm: 2.0, perMin: 0.4, min: 10 },
    pool: { base: 1.5, perKm: 0.8, perMin: 0.15, min: 3 },
  };
  const r = rates[vehicleType] || rates.standard;
  const fare = r.base + r.perKm * distanceKm + r.perMin * durationMin;
  return Math.max(r.min, Math.round(fare * 100) / 100);
}

module.exports = { haversineKm, estimateFare };
