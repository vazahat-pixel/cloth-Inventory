const { body } = require('express-validator');

const createGRNValidation = [
    body('purchaseId')
        .notEmpty().withMessage('Purchase ID is required')
        .isMongoId().withMessage('Invalid Purchase ID'),
    
    body('items')
        .isArray({ min: 1 }).withMessage('At least one item is required in the GRN'),
    
    body('items.*.productId')
        .notEmpty().withMessage('Product ID is required')
        .isMongoId().withMessage('Invalid Product ID'),

    body('items.*.orderedQty')
        .notEmpty().withMessage('Ordered quantity is required')
        .isNumeric().withMessage('Ordered quantity must be a number'),

    body('items.*.receivedQty')
        .notEmpty().withMessage('Received quantity is required')
        .isNumeric().withMessage('Received quantity must be a number'),
];

module.exports = {
    createGRNValidation
};
