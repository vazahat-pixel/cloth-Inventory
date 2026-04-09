const express = require('express');
const router = express.Router();
const productionController = require('./production.controller.js');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// Root: /api/v1/production
router.use(protect);
router.use(requireAdmin);

router.post('/outwards', productionController.createOutward);
router.get('/outwards', productionController.getAllOutwards);
router.get('/outwards/:id', productionController.getOutwardById);

module.exports = router;
