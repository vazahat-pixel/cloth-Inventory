const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response.handler');

/**
 * validateRequest — middleware to check express-validator results.
 * 
 * Usage: add validation chain first, then use this middleware before controller:
 *   router.post('/path', [validationChain], validateRequest, controller)
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, errors.array()[0].msg, 400);
    }
    next();
};

module.exports = { validateRequest };
