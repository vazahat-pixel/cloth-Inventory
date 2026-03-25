const express = require('express');
const systemConfigController = require('./systemConfig.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

// GET /config
router.get('/', systemConfigController.get);

// POST /config
router.post('/', requireAdmin, systemConfigController.update);

module.exports = router;
