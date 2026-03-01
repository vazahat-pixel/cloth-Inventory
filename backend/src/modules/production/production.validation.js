const { body } = require('express-validator');

const createBatchValidation = [
    body('fabricId')
        .notEmpty().withMessage('Fabric ID is required')
        .isMongoId().withMessage('Invalid Fabric ID'),

    body('meterUsed')
        .notEmpty().withMessage('Meter used is required')
        .isFloat({ min: 0.1 }).withMessage('Meter used must be a positive number'),

    body('sizeBreakdown')
        .isArray({ min: 1 }).withMessage('Size breakdown must be an array with at least one size'),

    body('sizeBreakdown.*.size')
        .notEmpty().withMessage('Size is required')
        .isIn(['S', 'M', 'L', 'XL', 'XXL', 'FREE']).withMessage('Invalid size value'),

    body('sizeBreakdown.*.quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
];

const updateStageValidation = [
    body('stage')
        .notEmpty().withMessage('Stage is required')
        .isIn(['MATERIAL_RECEIVED', 'CUTTING', 'FINISHING', 'READY']).withMessage('Invalid production stage'),

    body('productMetadata')
        .if(body('stage').equals('READY'))
        .notEmpty().withMessage('Product metadata is required when moving to READY stage'),

    body('productMetadata.name')
        .if(body('stage').equals('READY'))
        .notEmpty().withMessage('Product name is required'),

    body('productMetadata.category')
        .if(body('stage').equals('READY'))
        .notEmpty().withMessage('Product category is required'),

    body('productMetadata.salePrice')
        .if(body('stage').equals('READY'))
        .isFloat({ min: 0 }).withMessage('Sale price must be a non-negative number'),
];

module.exports = {
    createBatchValidation,
    updateStageValidation
};
