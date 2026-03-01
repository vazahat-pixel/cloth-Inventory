const { body } = require('express-validator');

const createFabricValidation = [
    body('supplierId')
        .notEmpty().withMessage('Supplier ID is required')
        .isMongoId().withMessage('Invalid Supplier ID format'),

    body('fabricType')
        .trim()
        .notEmpty().withMessage('Fabric type is required'),

    body('invoiceNumber')
        .trim()
        .notEmpty().withMessage('Invoice number is required'),

    body('meterPurchased')
        .notEmpty().withMessage('Meter purchased is required')
        .isFloat({ min: 0.1 }).withMessage('Meter purchased must be a positive number'),

    body('ratePerMeter')
        .notEmpty().withMessage('Rate per meter is required')
        .isFloat({ min: 0 }).withMessage('Rate per meter must be a non-negative number'),

    body('purchaseDate')
        .optional()
        .isISO8601().withMessage('Purchase date must be a valid date'),

    body('gsm')
        .optional()
        .isNumeric().withMessage('GSM must be a number'),
];

const updateFabricValidation = [
    body('fabricType')
        .optional()
        .trim()
        .notEmpty().withMessage('Fabric type cannot be empty'),

    body('meterPurchased')
        .optional()
        .isFloat({ min: 0.1 }).withMessage('Meter purchased must be a positive number'),

    body('ratePerMeter')
        .optional()
        .isFloat({ min: 0 }).withMessage('Rate per meter must be a non-negative number'),
];

module.exports = {
    createFabricValidation,
    updateFabricValidation
};
