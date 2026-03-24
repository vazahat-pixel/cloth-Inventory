const express = require('express');
const dashboardController = require('./dashboard.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

// GET /dashboard/summary
router.get('/summary', dashboardController.getSummary);

// GET /dashboard/top-products
router.get('/top-products', dashboardController.getTopProducts);

// GET /dashboard/alerts
router.get('/alerts', dashboardController.getAlerts);

module.exports = router;
