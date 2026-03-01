const { body } = require('express-validator');

const createSaleValidation = [
    body('storeId')
        .notEmpty().withMessage('Store ID is required')
        .isMongoId().withMessage('Invalid Store ID'),
    
    body('products')
        .isArray({ min: 1 }).withMessage('At least one product is required for sale'),
    
    body('products.*.productId')
        .notEmpty().withMessage('Product ID is required')
        .isMongoId().withMessage('Invalid Product ID'),
    
    body('products.*.barcode')
        .notEmpty().withMessage('Barcode is required'),
        
    body('products.*.quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        
    body('products.*.price')
        .notEmpty().withMessage('Item price is required')
        .isFloat({ min: 0 }).withMessage('Price must be positive'),

    body('subTotal').notEmpty().withMessage('Subtotal is required'),
    body('grandTotal').notEmpty().withMessage('Grand total is required'),
    
    body('paymentMode')
        .optional()
        .isIn(['CASH', 'CARD', 'UPI']).withMessage('Invalid payment mode'),
];

module.exports = {
    createSaleValidation
};
