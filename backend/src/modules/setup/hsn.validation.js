const { body } = require('express-validator');

const hsnValidation = [
    body('hsnCode')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ min: 4, max: 8 }).withMessage('HSN code must be 4-8 digits'),
    body('code')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ min: 4, max: 8 }).withMessage('HSN code must be 4-8 digits'),
    body().custom((_, { req }) => {
        const code = String(req.body.hsnCode || req.body.code || '').trim();
        if (!code) {
            throw new Error('HSN code is required');
        }
        if (!/^[0-9]{4,8}$/.test(code)) {
            throw new Error('HSN code must be 4-8 digits');
        }
        return true;
    }),

    body('gstRate')
        .notEmpty().withMessage('GST rate is required')
        .isNumeric().withMessage('GST rate must be a number')
];

module.exports = {
    hsnValidation
};
