const { body } = require('express-validator');

const createQCValidation = [
    body('grnId')
        .notEmpty().withMessage('GRN ID is required')
        .isMongoId().withMessage('Invalid GRN ID'),
    
    body('items')
        .isArray({ min: 1 }).withMessage('At least one item is required in the QC'),
    
    body('items.*.productId')
        .notEmpty().withMessage('Product ID is required')
        .isMongoId().withMessage('Invalid Product ID'),

    body('items.*.receivedQty')
        .notEmpty().withMessage('Received quantity is required')
        .isNumeric().withMessage('Received quantity must be a number'),

    body('items.*.approvedQty')
        .notEmpty().withMessage('Approved quantity is required')
        .isNumeric().withMessage('Approved quantity must be a number'),

    body('items.*.rejectedQty')
        .notEmpty().withMessage('Rejected quantity is required')
        .isNumeric().withMessage('Rejected quantity must be a number'),
];

module.exports = {
    createQCValidation
};
