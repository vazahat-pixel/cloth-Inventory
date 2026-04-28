const express = require('express');
const storeInventoryController = require('./storeInventory.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', storeInventoryController.getStoreInventory);
router.post('/adjust', storeInventoryController.adjustInventory);
router.post('/reconcile', storeInventoryController.reconcileStock);
router.get('/:productId', storeInventoryController.getProductInStore);

router.post('/bulk-import', storeInventoryController.bulkImportOpeningStock);

module.exports = router;
