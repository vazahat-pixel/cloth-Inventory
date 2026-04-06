const { body } = require('express-validator');

const createGRNValidation = [
    body('purchaseId')
        .optional({ checkFalsy: true })
        .isMongoId().withMessage('Invalid Purchase ID'),
    
    body('purchaseOrderId')
        .optional({ checkFalsy: true })
        .isMongoId().withMessage('Invalid Purchase Order ID'),

    body('jobWorkId')
        .optional({ checkFalsy: true })
        .isMongoId().withMessage('Invalid Job Work ID'),

    
    body('items')
        .isArray({ min: 1 }).withMessage('At least one item is required in the GRN'),
    
    body('items.*.itemId')
        .notEmpty().withMessage('Item ID is required')
        .isMongoId().withMessage('Invalid Item ID'),
    
    body('items.*.variantId')
        .notEmpty().withMessage('Variant ID is required'),

    body('items.*.sku')
        .notEmpty().withMessage('SKU is required'),

    body('items.*.receivedQty')
        .notEmpty().withMessage('Received quantity is required')
        .isNumeric({ min: 1 }).withMessage('Received quantity must be a number greater than 0'),
];

module.exports = {
    createGRNValidation
};
