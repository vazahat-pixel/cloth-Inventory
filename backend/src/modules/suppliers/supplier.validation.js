const { body } = require('express-validator');

const createSupplierValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Supplier name is required')
        .isLength({ min: 2 }).withMessage('Supplier name must be at least 2 characters'),

    body('phone')
        .optional({ checkFalsy: true })
        .trim(),

    body('email')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail().withMessage('Please provide a valid email address'),

    body('gstNumber')
        .optional({ checkFalsy: true })
        .trim(),
];

const updateSupplierValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('Supplier name must be at least 2 characters'),

    body('phone')
        .optional({ checkFalsy: true })
        .trim(),

    body('email')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail().withMessage('Please provide a valid email address'),
];

module.exports = {
    createSupplierValidation,
    updateSupplierValidation
};
