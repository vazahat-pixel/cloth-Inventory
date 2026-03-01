const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

const errorHandler = (err, req, res, next) => {
    try {
        const logPath = path.join(__dirname, '..', '..', 'temp_err.log');
        fs.appendFileSync(logPath, new Date().toISOString() + ' ' + err.message + '\n' + err.stack + '\n\n');
    } catch (logErr) {
        console.error('Failed to write to temp log:', logErr.message);
    }
    logger.error(err.message, { stack: err.stack, url: req.originalUrl });

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        return res.status(400).json({ success: false, message: `${field || 'Field'} already exists.` });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ success: false, message: messages[0] });
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }

    // Generic fallback
    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error.',
    });
};

module.exports = errorHandler;
