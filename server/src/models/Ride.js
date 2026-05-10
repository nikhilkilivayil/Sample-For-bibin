const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    pickup: { type: placeSchema, required: true },
    dropoff: { type: placeSchema, required: true },
    vehicleType: { type: String, enum: ['standard', 'premium', 'pool'], default: 'standard' },
    distanceKm: { type: Number, required: true },
    durationMin: { type: Number, required: true },
    fare: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'requested',
        'accepted',
        'driver_arrived',
        'in_progress',
        'completed',
        'cancelled',
      ],
      default: 'requested',
      index: true,
    },
    cancelledBy: { type: String, enum: ['rider', 'driver', 'system', null], default: null },
    paymentMethod: { type: String, enum: ['cash', 'card', 'wallet'], default: 'card' },
    rating: {
      byRider: { type: Number, min: 1, max: 5 },
      byDriver: { type: Number, min: 1, max: 5 },
    },
    timeline: {
      requestedAt: { type: Date, default: Date.now },
      acceptedAt: { type: Date },
      arrivedAt: { type: Date },
      startedAt: { type: Date },
      completedAt: { type: Date },
      cancelledAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);
