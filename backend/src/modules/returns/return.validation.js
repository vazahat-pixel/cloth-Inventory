const { body } = require('express-validator');
const { ReturnType } = require('../../core/enums');

const processReturnValidation = [
    body('type')
        .notEmpty().withMessage('Return type is required')
        .isIn(Object.values(ReturnType)).withMessage('Invalid return type'),
    
    body('storeId')
        .notEmpty().withMessage('Store ID is required')
        .isMongoId().withMessage('Invalid Store ID'),
        
    body('productId')
        .notEmpty().withMessage('Product ID is required')
        .isMongoId().withMessage('Invalid Product ID'),
        
    body('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        
    body('referenceSaleId')
        .if(body('type').equals(ReturnType.CUSTOMER_RETURN))
        .notEmpty().withMessage('Reference sale ID is required for customer returns')
        .isMongoId().withMessage('Invalid Sale ID'),
    
    body('reason').optional().trim(),
];

module.exports = {
    processReturnValidation
};
