const express = require('express');
const storeController = require('./store.controller');
const { createStoreValidation, updateStoreValidation } = require('./store.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * All store routes are protected and require Admin (Super Admin) role
 */
router.use(protect);
router.use(requireAdmin);

router.route('/')
    .post(createStoreValidation, storeController.createStore)
    .get(storeController.getAllStores);

router.route('/:id')
    .get(storeController.getStoreById)
    .patch(updateStoreValidation, storeController.updateStore)
    .delete(storeController.deleteStore);

router.patch('/:id/status', storeController.toggleStoreStatus);

module.exports = router;
