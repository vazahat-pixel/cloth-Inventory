const express = require('express');
const router = express.Router();
const hsnController = require('./hsnCode.controller');
const formulaController = require('./formula.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

// HSN Routes
router.get('/hsn', hsnController.getAll);
router.put('/hsn/:id', hsnController.update);
router.delete('/hsn/:id', hsnController.delete);
router.post('/hsn', requireAdmin, hsnController.create);

// Formula Routes
router.get('/formula', formulaController.getAll);
router.put('/formula/:id', formulaController.update);
router.delete('/formula/:id', formulaController.delete);
router.post('/formula', requireAdmin, formulaController.create);

module.exports = router;
