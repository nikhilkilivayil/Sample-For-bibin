const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

exports.getProfile = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id }).populate('user', 'name email phone rating');
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });
    res.json({ driver });
  } catch (err) {
    next(err);
  }
};

exports.setStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    const driver = await Driver.findOneAndUpdate(
      { user: req.user.id },
      { isOnline: !!isOnline, isAvailable: !!isOnline },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });
    res.json({ driver });
  } catch (err) {
    next(err);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat and lng must be numbers' });
    }
    const driver = await Driver.findOneAndUpdate(
      { user: req.user.id },
      { location: { type: 'Point', coordinates: [lng, lat], updatedAt: new Date() } },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });
    res.json({ driver });
  } catch (err) {
    next(err);
  }
};

exports.nearby = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radiusKm || 5);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'lat and lng query params required' });
    }
    const drivers = await Driver.find({
      isOnline: true,
      isAvailable: true,
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    })
      .limit(20)
      .populate('user', 'name rating');
    res.json({ drivers });
  } catch (err) {
    next(err);
  }
};

exports.activeRide = async (req, res, next) => {
  try {
    const ride = await Ride.findOne({
      driver: req.user.id,
      status: { $in: ['accepted', 'driver_arrived', 'in_progress'] },
    }).populate('rider', 'name phone rating');
    res.json({ ride });
  } catch (err) {
    next(err);
  }
};
