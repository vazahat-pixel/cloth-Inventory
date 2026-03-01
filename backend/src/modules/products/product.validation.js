const { body } = require('express-validator');

const updateProductValidation = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    body('brand').optional().trim(),
    body('color').optional().trim(),
    body('salePrice').optional().isFloat({ min: 0 }).withMessage('Sale price must be a non-negative number'),
    body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number'),
];

module.exports = {
    updateProductValidation
};
