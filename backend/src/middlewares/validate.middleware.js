const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response.handler');

/**
 * validate - Universal Express Validator middleware
 * Checks for validation errors and returns consistent 400 response
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg;
        return sendError(res, firstError, 400);
    }
    next();
};

module.exports = validate;
