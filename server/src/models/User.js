const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['rider', 'driver'], default: 'rider', index: true },
    avatarUrl: { type: String },
    rating: { type: Number, default: 5.0, min: 0, max: 5 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const { _id, name, email, phone, role, avatarUrl, rating, createdAt } = this;
  return { id: _id, name, email, phone, role, avatarUrl, rating, createdAt };
};

module.exports = mongoose.model('User', userSchema);
