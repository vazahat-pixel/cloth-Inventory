const { body } = require('express-validator');

const createSaleValidation = [
    body('storeId')
        .notEmpty().withMessage('Store ID is required')
        .isMongoId().withMessage('Invalid Store ID'),
    
    body('products')
        .isArray({ min: 1 }).withMessage('At least one product is required for sale'),
    
    body('products.*.productId')
        .optional({ checkFalsy: true })
        .isMongoId().withMessage('Invalid Product ID'),

    body('products.*.barcode')
        .optional()
        .isString().withMessage('Barcode must be a string')
        .trim(),
        
    body('products.*.quantity')
        .notEmpty().withMessage('Quantity is required')
        .isNumeric().withMessage('Quantity must be a number'),
        
    body('products.*.price')
        .notEmpty().withMessage('Item price is required')
        .isFloat({ min: 0 }).withMessage('Price must be positive'),

    body('subTotal').notEmpty().withMessage('Subtotal is required'),
    body('grandTotal').notEmpty().withMessage('Grand total is required'),
    
    body('customerId')
        .optional({ checkFalsy: true })
        .isMongoId().withMessage('Invalid Customer ID'),
        
    body('redeemPoints')
        .optional()
        .isInt({ min: 0 }).withMessage('Redeem points must be a non-negative integer'),
    
    body('paymentMode')
        .optional()
        .isIn(['CASH', 'CARD', 'UPI', 'GIFT_VOUCHER', 'SPLIT']).withMessage('Invalid payment mode'),
];

module.exports = {
    createSaleValidation
};
