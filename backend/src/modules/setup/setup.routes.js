const express = require('express');
const router = express.Router();
const hsnController = require('./hsnCode.controller');
const formulaController = require('./formula.controller');
const groupController = require('./group.controller');
const salesmanController = require('./salesman.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

// Salesmen Routes
router.get('/salesmen', salesmanController.getAllSalesmen);
router.put('/salesmen/:id', salesmanController.updateSalesman);
router.patch('/salesmen/:id', salesmanController.updateSalesman);
router.delete('/salesmen/:id', salesmanController.deleteSalesman);
router.post('/salesmen', requireAdmin, salesmanController.createSalesman);

// HSN Routes
router.get('/hsn', hsnController.getAll);
router.put('/hsn/:id', hsnController.update);
router.patch('/hsn/:id', hsnController.update);
router.delete('/hsn/:id', hsnController.delete);
router.post('/hsn', requireAdmin, hsnController.create);

// Group Routes
router.get('/groups', groupController.getAll);
router.put('/groups/:id', groupController.update);
router.patch('/groups/:id', groupController.update);
router.delete('/groups/:id', groupController.delete);
router.post('/groups', requireAdmin, groupController.create);

// Formula Routes
router.get('/formula', formulaController.getAll);
router.put('/formula/:id', formulaController.update);
router.patch('/formula/:id', formulaController.update);
router.delete('/formula/:id', formulaController.delete);
router.post('/formula', requireAdmin, formulaController.create);

module.exports = router;
