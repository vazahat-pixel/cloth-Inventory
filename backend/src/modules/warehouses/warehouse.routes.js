const express = require('express');
const warehouseController = require('./warehouse.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');
const { body } = require('express-validator');

const router = express.Router();

// validation middleware
const warehouseValidation = [
    body('name').trim().notEmpty().withMessage('Warehouse name is required'),
    body('contactPerson').trim().notEmpty().withMessage('Contact person is required'),
    body('contactPhone').trim().notEmpty().withMessage('Contact phone is required'),
    body('location.address').notEmpty().withMessage('Address is required'),
    body('location.city').notEmpty().withMessage('City is required'),
    body('location.state').notEmpty().withMessage('State is required')
];

router.use(protect); // Ensure all routes are protected

// Public to all authenticated users (or restricted by role in future)
router.get('/', warehouseController.getAllWarehouses);
router.get('/:id', warehouseController.getWarehouseById);

// Admin only routes
router.post('/', requireAdmin, warehouseValidation, warehouseController.createWarehouse);
router.patch('/:id', requireAdmin, warehouseValidation, warehouseController.updateWarehouse);
router.patch('/:id/status', requireAdmin, warehouseController.toggleWarehouseStatus);
router.delete('/:id', requireAdmin, warehouseController.deleteWarehouse);

module.exports = router;
