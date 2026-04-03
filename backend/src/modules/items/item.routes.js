const express = require('express');
const itemController = require('./item.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.get('/next-code', itemController.getNextCode);
router.route('/')
    .get(itemController.getAllItems)
    .post(requireAdmin, itemController.createItem);

router.get('/scan/:barcode', itemController.scanItemByBarcode);

router.post('/:id/attributes', requireAdmin, itemController.updateItemAttributes);
router.post('/:id/sizes', requireAdmin, itemController.updateItemSizes);
router.post('/:id/allocate-group', requireAdmin, itemController.allocateItemGroups);
router.post('/:id/deallocate-group', requireAdmin, itemController.deallocateItemGroups);

router.route('/:id')
    .get(itemController.getItemById)
    .put(requireAdmin, itemController.updateItem)
    .patch(requireAdmin, itemController.updateItem)
    .delete(requireAdmin, itemController.deleteItem);

module.exports = router;
