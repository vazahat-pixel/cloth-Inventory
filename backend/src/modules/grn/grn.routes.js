const express = require('express');
const grnController = require('./grn.controller');
const { protect } = require('../../middlewares/auth.middleware');

const { createGRNValidation } = require('./grn.validation');
const validate = require('../../middlewares/validate.middleware');

const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(grnController.getAll)
    .post(createGRNValidation, validate, grnController.create);

router.get('/all', grnController.getAll);
router.get('/suggested-number', grnController.getNextNumber);
router.get('/purchase/:purchaseId', grnController.getByPurchase);

router.route('/:id')
    .get(grnController.getById);

router.patch('/:id/approve', requireAdmin, grnController.approve);

module.exports = router;
