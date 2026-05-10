const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/ride.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const placeRules = (field) => [
  body(`${field}.label`).isString().notEmpty(),
  body(`${field}.lat`).isFloat({ min: -90, max: 90 }),
  body(`${field}.lng`).isFloat({ min: -180, max: 180 }),
];

router.post('/estimate', requireAuth, ctrl.estimate);

router.post(
  '/',
  requireAuth,
  [...placeRules('pickup'), ...placeRules('dropoff'), body('vehicleType').optional().isIn(['standard', 'premium', 'pool'])],
  ctrl.request
);

router.get('/history', requireAuth, ctrl.history);
router.get('/:id', requireAuth, ctrl.getById);
router.post('/:id/accept', requireAuth, ctrl.accept);
router.post('/:id/cancel', requireAuth, ctrl.cancel);
router.post('/:id/rate', requireAuth, ctrl.rate);
router.post('/:id/:action(arrived|start|complete)', requireAuth, ctrl.advance);

module.exports = router;
