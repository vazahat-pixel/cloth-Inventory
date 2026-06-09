/**
 * response.handler.js — Standardized API response helpers
 */

const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
    let responseData = data;
    if (data && typeof data.toObject === 'function') {
        responseData = data.toObject();
    }

    if (Array.isArray(responseData)) {
        return res.status(statusCode).json({
            success: true,
            message,
            data: responseData,
        });
    }

    return res.status(statusCode).json({
        success: true,
        message,
        ...responseData,
    });
};

const sendError = (res, message = 'Something went wrong', statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};

const sendCreated = (res, data = {}, message = 'Created successfully') => {
    return sendSuccess(res, data, message, 201);
};

const sendNotFound = (res, message = 'Resource not found') => {
    return sendError(res, message, 404);
};

const sendUnauthorized = (res, message = 'Unauthorized') => {
    return sendError(res, message, 401);
};

const sendForbidden = (res, message = 'Access denied') => {
    return sendError(res, message, 403);
};

module.exports = { sendSuccess, sendError, sendCreated, sendNotFound, sendUnauthorized, sendForbidden };
