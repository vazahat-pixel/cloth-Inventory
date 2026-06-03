const express = require('express');
const salesController = require('./sales.controller');
const { createSaleValidation } = require('./sales.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny, requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.get('/barcode/:barcode', requireAny, salesController.getProductByBarcode);

router.route('/')
    .post(requireAny, createSaleValidation, salesController.createSale)
    .get(requireAny, salesController.getAllSales);

router.get('/lookup/by-number', requireAny, salesController.getSaleByNumber);
router.get('/:id', requireAny, salesController.getSaleById);
router.put('/:id', requireAdmin, salesController.updateSale);
router.patch('/:id/cancel', requireAdmin, salesController.cancelSale);
router.delete('/:id', requireAdmin, salesController.deleteSale);

// Apply a credit note against an existing sale (post-billing redemption)
// Body: { creditNoteId: string }
router.post('/:id/apply-credit-note', requireAny, salesController.applyCreditNote);

module.exports = router;
