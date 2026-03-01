const express = require('express');
const fabricController = require('./fabric.controller');
const { createFabricValidation, updateFabricValidation } = require('./fabric.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(requireAdmin, createFabricValidation, fabricController.createFabric)
    .get(fabricController.getAllFabrics);

router.route('/:id')
    .get(fabricController.getFabricById)
    .patch(requireAdmin, updateFabricValidation, fabricController.updateFabric)
    .delete(requireAdmin, fabricController.deleteFabric);

router.patch('/:id/status', requireAdmin, fabricController.updateFabricStatus);

module.exports = router;
