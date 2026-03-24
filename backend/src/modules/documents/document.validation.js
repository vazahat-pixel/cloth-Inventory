const { body } = require('express-validator');
const { DocumentType } = require('../../core/enums');

const createDocumentValidation = [
    body('type')
        .notEmpty().withMessage('Document type is required')
        .isIn(Object.values(DocumentType)).withMessage('Invalid Document type'),
    
    body('items')
        .isArray({ min: 1 }).withMessage('At least one item is required in the document'),
    
    body('items.*.productId')
        .notEmpty().withMessage('Product ID is required')
        .isMongoId().withMessage('Invalid Product ID'),

    body('items.*.orderedQty')
        .optional()
        .isNumeric().withMessage('Ordered quantity must be a number'),

    body('items.*.price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
];

module.exports = {
    createDocumentValidation
};
