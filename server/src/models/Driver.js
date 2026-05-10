const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    licenseNumber: { type: String, required: true, trim: true },
    vehicle: {
      make: { type: String, required: true },
      model: { type: String, required: true },
      color: { type: String },
      plate: { type: String, required: true },
      type: { type: String, enum: ['standard', 'premium', 'pool'], default: 'standard' },
    },
    isOnline: { type: Boolean, default: false, index: true },
    isAvailable: { type: Boolean, default: false, index: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      updatedAt: { type: Date },
    },
    activeRide: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', default: null },
  },
  { timestamps: true }
);

driverSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Driver', driverSchema);
