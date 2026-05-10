const { validationResult } = require('express-validator');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const { haversineKm, estimateFare } = require('../utils/geo');
const { findNearestDrivers } = require('../services/matching');
const { getIO } = require('../sockets');

function bail(res, errors) {
  return res.status(400).json({ error: 'Validation failed', details: errors.array() });
}

const AVERAGE_SPEED_KMH = 32;

exports.estimate = async (req, res, next) => {
  try {
    const { pickup, dropoff, vehicleType = 'standard' } = req.body;
    if (!pickup || !dropoff) return res.status(400).json({ error: 'pickup and dropoff required' });

    const distanceKm = haversineKm(pickup, dropoff);
    const durationMin = Math.max(2, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60));
    const fare = estimateFare({ distanceKm, durationMin, vehicleType });

    res.json({
      distanceKm: Math.round(distanceKm * 100) / 100,
      durationMin,
      fare,
      vehicleType,
    });
  } catch (err) {
    next(err);
  }
};

exports.request = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return bail(res, errors);

    const { pickup, dropoff, vehicleType = 'standard', paymentMethod = 'card' } = req.body;
    const distanceKm = haversineKm(pickup, dropoff);
    const durationMin = Math.max(2, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60));
    const fare = estimateFare({ distanceKm, durationMin, vehicleType });

    const existing = await Ride.findOne({
      rider: req.user.id,
      status: { $in: ['requested', 'accepted', 'driver_arrived', 'in_progress'] },
    });
    if (existing) return res.status(409).json({ error: 'You already have an active ride', ride: existing });

    const ride = await Ride.create({
      rider: req.user.id,
      pickup,
      dropoff,
      vehicleType,
      distanceKm,
      durationMin,
      fare,
      paymentMethod,
    });

    const candidates = await findNearestDrivers({ lat: pickup.lat, lng: pickup.lng, vehicleType });

    const io = getIO();
    if (io) {
      candidates.forEach((d) => {
        io.to(`user:${d.user._id}`).emit('ride:new', { ride });
      });
    }

    res.status(201).json({ ride, notifiedDrivers: candidates.length });
  } catch (err) {
    next(err);
  }
};

exports.accept = async (req, res, next) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can accept rides' });
    }
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, status: 'requested' },
      {
        driver: req.user.id,
        status: 'accepted',
        'timeline.acceptedAt': new Date(),
      },
      { new: true }
    );
    if (!ride) return res.status(409).json({ error: 'Ride is no longer available' });

    await Driver.findOneAndUpdate(
      { user: req.user.id },
      { isAvailable: false, activeRide: ride._id }
    );

    const io = getIO();
    if (io) {
      io.to(`ride:${ride._id}`).emit('ride:accepted', { ride });
      io.to(`user:${ride.rider}`).emit('ride:accepted', { ride });
    }

    res.json({ ride });
  } catch (err) {
    next(err);
  }
};

const STATUS_TRANSITIONS = {
  arrived: { from: 'accepted', to: 'driver_arrived', stamp: 'arrivedAt' },
  start: { from: 'driver_arrived', to: 'in_progress', stamp: 'startedAt' },
  complete: { from: 'in_progress', to: 'completed', stamp: 'completedAt' },
};

exports.advance = async (req, res, next) => {
  try {
    const action = req.params.action;
    const tx = STATUS_TRANSITIONS[action];
    if (!tx) return res.status(400).json({ error: 'Unknown action' });

    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, driver: req.user.id, status: tx.from },
      { status: tx.to, [`timeline.${tx.stamp}`]: new Date() },
      { new: true }
    );
    if (!ride) return res.status(409).json({ error: `Cannot ${action} ride in current state` });

    if (tx.to === 'completed') {
      await Driver.findOneAndUpdate(
        { user: req.user.id },
        { isAvailable: true, activeRide: null }
      );
    }

    const io = getIO();
    if (io) {
      io.to(`ride:${ride._id}`).emit(`ride:${tx.to}`, { ride });
      io.to(`user:${ride.rider}`).emit(`ride:${tx.to}`, { ride });
    }

    res.json({ ride });
  } catch (err) {
    next(err);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    const isRider = ride.rider.toString() === req.user.id;
    const isDriver = ride.driver && ride.driver.toString() === req.user.id;
    if (!isRider && !isDriver) return res.status(403).json({ error: 'Not your ride' });

    if (['completed', 'cancelled'].includes(ride.status)) {
      return res.status(409).json({ error: 'Ride already finalized' });
    }

    ride.status = 'cancelled';
    ride.cancelledBy = isRider ? 'rider' : 'driver';
    ride.timeline.cancelledAt = new Date();
    await ride.save();

    if (ride.driver) {
      await Driver.findOneAndUpdate(
        { user: ride.driver },
        { isAvailable: true, activeRide: null }
      );
    }

    const io = getIO();
    if (io) {
      io.to(`ride:${ride._id}`).emit('ride:cancelled', { ride });
      if (ride.driver) io.to(`user:${ride.driver}`).emit('ride:cancelled', { ride });
      io.to(`user:${ride.rider}`).emit('ride:cancelled', { ride });
    }

    res.json({ ride });
  } catch (err) {
    next(err);
  }
};

exports.rate = async (req, res, next) => {
  try {
    const { stars } = req.body;
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'stars must be 1-5' });
    }
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'completed') return res.status(409).json({ error: 'Ride not completed' });

    if (ride.rider.toString() === req.user.id) {
      ride.rating.byRider = stars;
    } else if (ride.driver && ride.driver.toString() === req.user.id) {
      ride.rating.byDriver = stars;
    } else {
      return res.status(403).json({ error: 'Not your ride' });
    }
    await ride.save();
    res.json({ ride });
  } catch (err) {
    next(err);
  }
};

exports.history = async (req, res, next) => {
  try {
    const role = req.user.role;
    const filter = role === 'driver' ? { driver: req.user.id } : { rider: req.user.id };
    const rides = await Ride.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('rider', 'name')
      .populate('driver', 'name');
    res.json({ rides });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('rider', 'name phone rating')
      .populate('driver', 'name phone rating');
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    const isParticipant =
      ride.rider._id.toString() === req.user.id ||
      (ride.driver && ride.driver._id.toString() === req.user.id);
    if (!isParticipant) return res.status(403).json({ error: 'Not your ride' });
    res.json({ ride });
  } catch (err) {
    next(err);
  }
};
