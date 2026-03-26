const { body } = require('express-validator');

const createPurchaseValidation = [
    body('supplierId').notEmpty().withMessage('Supplier ID is required').isMongoId().withMessage('Invalid Supplier ID'),
    body('warehouseId').optional().isMongoId().withMessage('Invalid Warehouse ID'),
    body('invoiceNumber').trim().notEmpty().withMessage('Invoice number is required'),
    body('invoiceDate').notEmpty().withMessage('Invoice date is required').isISO8601().withMessage('Invalid date format'),
    body('products').isArray({ min: 1 }).withMessage('At least one product is required'),
    body('products.*.productId').notEmpty().withMessage('Product ID is required').isMongoId().withMessage('Invalid Product ID'),
    body('products.*.quantity').isNumeric({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('products.*.rate').isNumeric({ min: 0 }).withMessage('Rate cannot be negative'),
];

module.exports = {
    createPurchaseValidation
};
