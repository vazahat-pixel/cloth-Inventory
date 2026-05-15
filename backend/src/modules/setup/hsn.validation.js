const { body } = require('express-validator');

const hsnValidation = [
    body('hsnCode')
        .trim()
        .notEmpty().withMessage('HSN code is required')
        .isLength({ min: 4, max: 8 }).withMessage('HSN code must be 4-8 digits'),

    body('gstRate')
        .notEmpty().withMessage('GST rate is required')
        .isNumeric().withMessage('GST rate must be a number')
];

module.exports = {
    hsnValidation
};
