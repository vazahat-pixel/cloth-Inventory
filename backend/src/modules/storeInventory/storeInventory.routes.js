const express = require('express');
const storeInventoryController = require('./storeInventory.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', storeInventoryController.getStoreInventory);
router.get('/:productId', storeInventoryController.getProductInStore);

module.exports = router;
