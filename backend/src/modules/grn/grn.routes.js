const express = require('express');
const grnController = require('./grn.controller');
const { protect } = require('../../middlewares/auth.middleware');

const { createGRNValidation } = require('./grn.validation');
const validate = require('../../middlewares/validate.middleware');

const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.post('/', createGRNValidation, validate, grnController.create);
router.get('/', grnController.getAll);
router.get('/all', grnController.getAll);
router.get('/:id', grnController.getById);
router.get('/purchase/:purchaseId', grnController.getByPurchase);
router.patch('/:id/approve', requireAdmin, grnController.approve);

module.exports = router;
