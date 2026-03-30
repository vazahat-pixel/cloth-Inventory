const SystemLog = require('../models/systemLog.model');

/**
 * Middleware to log system actions for the Debug Visibility System.
 */
const activityLogger = (moduleName) => {
  return async (req, res, next) => {
    // We only log successful state-changing operations
    const originalSend = res.send;
    
    res.send = function(data) {
      // Capture the response and log if it's successful (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const logEntry = {
          action: `${req.method} ${req.originalUrl}`,
          module: moduleName,
          userId: req.user ? req.user._id : null,
          details: {
            body: req.body,
            params: req.params,
            query: req.query,
            statusCode: res.statusCode
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        };

        // Fire and forget logging (don't block the response)
        SystemLog.create(logEntry).catch(err => console.error('Logging Error:', err));
      }
      
      return originalSend.apply(res, arguments);
    };

    next();
  };
};

module.exports = { activityLogger };
