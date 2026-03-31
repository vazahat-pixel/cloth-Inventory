const express = require('express');
const seasonController = require('./season.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect); // Ensure all routes are protected

router.get('/', seasonController.getAllSeasons);

// Admin only routes
router.post('/', requireAdmin, seasonController.createSeason);
router.patch('/:id', requireAdmin, seasonController.updateSeason);
router.delete('/:id', requireAdmin, seasonController.deleteSeason);

module.exports = router;
