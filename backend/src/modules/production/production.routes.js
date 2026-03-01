const express = require('express');
const productionController = require('./production.controller');
const { createBatchValidation, updateStageValidation } = require('./production.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

// Only Admin (proxy for Factory Manager / Super Admin) can manage production
router.route('/')
    .post(requireAdmin, createBatchValidation, productionController.createBatch)
    .get(productionController.getAllBatches);

router.route('/:id')
    .get(productionController.getBatchById)
    .delete(requireAdmin, productionController.deleteBatch);

router.patch('/:id/stage', requireAdmin, updateStageValidation, productionController.updateStage);

module.exports = router;
