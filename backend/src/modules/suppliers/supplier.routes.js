const express = require('express');
const supplierController = require('./supplier.controller');
const { createSupplierValidation, updateSupplierValidation } = require('./supplier.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(requireAdmin, createSupplierValidation, supplierController.createSupplier)
    .get(supplierController.getAllSuppliers);

router.route('/:id')
    .get(supplierController.getSupplierById)
    .patch(requireAdmin, updateSupplierValidation, supplierController.updateSupplier)
    .delete(requireAdmin, supplierController.deleteSupplier);

module.exports = router;
