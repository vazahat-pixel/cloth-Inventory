const express = require('express');
const storeController = require('./store.controller');
const { createStoreValidation, updateStoreValidation } = require('./store.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

const validate = require('../../middlewares/validate.middleware');

router.route('/')
    .post(requireAdmin, createStoreValidation, validate, storeController.createStore)
    .get(storeController.getAllStores);

router.route('/:id')
    .get(storeController.getStoreById)
    .patch(requireAdmin, updateStoreValidation, validate, storeController.updateStore)
    .delete(requireAdmin, storeController.deleteStore);

router.patch('/:id/status', requireAdmin, storeController.toggleStoreStatus);

module.exports = router;
