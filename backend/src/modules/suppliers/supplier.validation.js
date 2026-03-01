const { body } = require('express-validator');

const createSupplierValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Supplier name is required')
        .isLength({ min: 2 }).withMessage('Supplier name must be at least 2 characters'),

    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),

    body('email')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail().withMessage('Please provide a valid email address'),

    body('gstNumber')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .withMessage('Invalid GST number format'),
];

const updateSupplierValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('Supplier name must be at least 2 characters'),

    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),

    body('email')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail().withMessage('Please provide a valid email address'),
];

module.exports = {
    createSupplierValidation,
    updateSupplierValidation
};
