const { body } = require('express-validator');

const createGRNValidation = [
    body('purchaseId')
        .optional()
        .isMongoId().withMessage('Invalid Purchase ID'),
    
    body('purchaseOrderId')
        .optional()
        .isMongoId().withMessage('Invalid Purchase Order ID'),
    
    body('items')
        .isArray({ min: 1 }).withMessage('At least one item is required in the GRN'),
    
    body('items.*.productId')
        .notEmpty().withMessage('Product ID is required')
        .isMongoId().withMessage('Invalid Product ID'),

    body('items.*.orderedQty')
        .optional()
        .isNumeric().withMessage('Ordered quantity must be a number'),

    body('items.*.receivedQty')
        .notEmpty().withMessage('Received quantity is required')
        .isNumeric().withMessage('Received quantity must be a number'),
];

module.exports = {
    createGRNValidation
};
