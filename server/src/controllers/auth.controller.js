const { validationResult } = require('express-validator');
const User = require('../models/User');
const Driver = require('../models/Driver');
const { signToken } = require('../middleware/auth');

function bail(res, errors) {
  return res.status(400).json({ error: 'Validation failed', details: errors.array() });
}

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return bail(res, errors);

    const { name, email, password, phone, role, vehicle, licenseNumber } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, role });

    if (role === 'driver') {
      if (!vehicle || !licenseNumber) {
        await user.deleteOne();
        return res.status(400).json({ error: 'Driver registration requires vehicle and licenseNumber' });
      }
      await Driver.create({ user: user._id, licenseNumber, vehicle });
    }

    const token = signToken({ id: user._id.toString(), role: user.role, email: user.email });
    res.status(201).json({ user: user.toSafeJSON(), token });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return bail(res, errors);

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken({ id: user._id.toString(), role: user.role, email: user.email });
    res.json({ user: user.toSafeJSON(), token });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};
