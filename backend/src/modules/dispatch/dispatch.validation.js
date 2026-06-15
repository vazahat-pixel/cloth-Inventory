const { body } = require('express-validator');

const createDispatchValidation = [
    body('destinationStoreId')
        .notEmpty().withMessage('Destination Store ID is required')
        .isMongoId().withMessage('Invalid Store ID'),

    body('sourceId')
        .optional()
        .isMongoId().withMessage('Invalid Source ID'),

    body('sourceWarehouseId')
        .optional()
        .isMongoId().withMessage('Invalid Warehouse ID'),

    body().custom((_, { req }) => {
        const source = req.body.sourceId || req.body.sourceWarehouseId;
        if (!source) throw new Error('Source warehouse ID is required');
        return true;
    }),

    body('items')
        .optional()
        .isArray()
        .withMessage('Items must be an array'),

    body('products')
        .optional()
        .isArray()
        .withMessage('Products must be an array'),

    body().custom((_, { req }) => {
        const finalItems = req.body.items || req.body.products || [];
        if (!finalItems.length) throw new Error('At least one item is required for dispatch');
        return true;
    }),

    body('items.*.variantId')
        .optional()
        .isMongoId().withMessage('Invalid variant ID'),

    body('items.*.quantity')
        .optional()
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const updateDispatchValidation = [
    body('destinationStoreId')
        .optional()
        .isMongoId().withMessage('Invalid Store ID'),

    body('sourceId')
        .optional()
        .isMongoId().withMessage('Invalid Source ID'),
];

module.exports = {
    createDispatchValidation,
    updateDispatchValidation,
};
