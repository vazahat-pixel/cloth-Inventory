const ErrorLog = require('../models/errorLog.model');

/**
 * Global Error Handler Middleware that captures and stores errors for Visibility.
 */
const errorCapture = async (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log significant errors to the DB (Bad Request, Validation, Server Errors)
  if (statusCode >= 400) {
    try {
      await ErrorLog.create({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        path: req.originalUrl,
        method: req.method,
        userId: req.user ? req.user._id : null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (dbErr) {
      console.error('Failed to save error log to DB:', dbErr);
    }
  }

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : (err.stack || 'No stack trace available')
  });
};

module.exports = errorCapture;
