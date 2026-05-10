const express = require('express');
const ctrl = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.patch('/me', requireAuth, ctrl.updateProfile);

module.exports = router;
