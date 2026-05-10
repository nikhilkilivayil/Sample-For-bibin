const express = require('express');
const ctrl = require('../controllers/driver.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, requireRole('driver'), ctrl.getProfile);
router.post('/status', requireAuth, requireRole('driver'), ctrl.setStatus);
router.post('/location', requireAuth, requireRole('driver'), ctrl.updateLocation);
router.get('/active-ride', requireAuth, requireRole('driver'), ctrl.activeRide);
router.get('/nearby', requireAuth, ctrl.nearby);

module.exports = router;
