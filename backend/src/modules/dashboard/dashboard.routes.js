const express = require('express');
const dashboardController = require('./dashboard.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(requireAdmin); // Dashboard is admin-only

router.get('/', dashboardController.getAdminDashboard);

module.exports = router;
