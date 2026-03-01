const { body } = require('express-validator');

const createDispatchValidation = [
    body('storeId')
        .notEmpty().withMessage('Store ID is required')
        .isMongoId().withMessage('Invalid Store ID'),
    
    body('products')
        .isArray({ min: 1 }).withMessage('At least one product is required for dispatch'),
    
    body('products.*.productId')
        .notEmpty().withMessage('Product ID is required')
        .isMongoId().withMessage('Invalid Product ID'),
    
    body('products.*.quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const updateStatusValidation = [
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['SHIPPED', 'RECEIVED']).withMessage('Invalid status value'),
];

module.exports = {
    createDispatchValidation,
    updateStatusValidation
};
