const { body } = require('express-validator');

const createStoreValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Store name is required')
        .isLength({ min: 3 }).withMessage('Store name must be at least 3 characters'),

    body('managerName')
        .trim()
        .notEmpty().withMessage('Manager name is required'),

    body('managerPhone')
        .trim()
        .notEmpty().withMessage('Manager phone is required')
        .matches(/^[0-9]{10}$/).withMessage('Manager phone must be a valid 10-digit number'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address'),

    body('location.address').notEmpty().withMessage('Address is required'),
    body('location.city').notEmpty().withMessage('City is required'),
    body('location.state').notEmpty().withMessage('State is required'),

    body('gstNumber')
        .optional({ checkFalsy: true })
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .withMessage('Invalid GST number format'),
];

const updateStoreValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3 }).withMessage('Store name must be at least 3 characters'),

    body('managerPhone')
        .optional()
        .trim()
        .matches(/^[0-9]{10}$/).withMessage('Manager phone must be a valid 10-digit number'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email address'),

    body('gstNumber')
        .optional({ checkFalsy: true })
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .withMessage('Invalid GST number format'),
];

module.exports = {
    createStoreValidation,
    updateStoreValidation
};
