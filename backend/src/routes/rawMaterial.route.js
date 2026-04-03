const express = require('express');
const router = express.Router();
const rawMaterialController = require('../controllers/rawMaterial.controller');

// GET all RM with filters
router.get('/', rawMaterialController.getAllRawMaterials);

// POST create new RM
router.post('/', rawMaterialController.createRawMaterial);

// GET single RM
router.get('/:id', rawMaterialController.getRawMaterial);

// PUT update RM
router.put('/:id', rawMaterialController.updateRawMaterial);

// DELETE RM
router.delete('/:id', rawMaterialController.deleteRawMaterial);

module.exports = router;
