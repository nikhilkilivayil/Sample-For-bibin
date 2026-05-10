const Driver = require('../models/Driver');

async function findNearestDrivers({ lat, lng, vehicleType, radiusKm = 5, limit = 5 }) {
  const query = {
    isOnline: true,
    isAvailable: true,
    activeRide: null,
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000,
      },
    },
  };
  if (vehicleType) query['vehicle.type'] = vehicleType;

  return Driver.find(query).limit(limit).populate('user', 'name rating');
}

module.exports = { findNearestDrivers };
