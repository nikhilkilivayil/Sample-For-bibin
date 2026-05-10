const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').isString().trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['rider', 'driver']),
  ],
  ctrl.register
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').isLength({ min: 6 })],
  ctrl.login
);

router.get('/me', requireAuth, ctrl.me);

module.exports = router;
