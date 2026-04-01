const { body } = require('express-validator');

const createPurchaseValidation = [
    body('supplierId')
        .notEmpty().withMessage('Supplier ID is required')
        .isMongoId().withMessage('Invalid Supplier ID'),

    // Accept both warehouseId (new) and storeId (legacy)
    body('warehouseId').optional().isMongoId().withMessage('Invalid Warehouse ID'),
    body('storeId').optional().isMongoId().withMessage('Invalid Store ID'),

    body('invoiceNumber')
        .trim().notEmpty().withMessage('Invoice number is required'),

    body('invoiceDate')
        .notEmpty().withMessage('Invoice date is required')
        .isISO8601().withMessage('Invalid date format'),

    // Accept 'items' (new form) OR 'products' (legacy) — at least one must be a non-empty array
    body('items').optional().isArray().withMessage('items must be an array'),
    body('products').optional().isArray().withMessage('products must be an array'),

    // Custom check: either items or products must have >= 1 entry
    body().custom((body) => {
        const items = body.items || body.products || [];
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('At least one item/product is required');
        }
        return true;
    }),

    // Validate items array fields (new format)
    body('items.*.itemId')
        .optional()
        .isMongoId().withMessage('Invalid Item ID in items array'),

    body('items.*.variantId')
        .optional()
        .notEmpty().withMessage('Variant ID is required in items'),

    body('items.*.quantity')
        .optional()
        .isNumeric().withMessage('Quantity must be a number')
        .custom(v => Number(v) >= 1).withMessage('Quantity must be at least 1'),

    body('items.*.rate')
        .optional()
        .isNumeric().withMessage('Rate must be a number')
        .custom(v => Number(v) >= 0).withMessage('Rate cannot be negative'),

    // Validate products array fields (legacy format)
    body('products.*.productId')
        .optional()
        .isMongoId().withMessage('Invalid Product ID'),

    body('products.*.quantity')
        .optional()
        .isNumeric().withMessage('Quantity must be a number'),

    body('products.*.rate')
        .optional()
        .isNumeric().withMessage('Rate must be a number'),
];

module.exports = {
    createPurchaseValidation
};
