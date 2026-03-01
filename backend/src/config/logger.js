/**
 * logger.js — Simple console logger with timestamp and levels.
 */

const { NODE_ENV } = process.env;

const timestamp = () => new Date().toISOString();

const logger = {
    info: (...args) => console.log(`[${timestamp()}] ℹ️  INFO:`, ...args),
    success: (...args) => console.log(`[${timestamp()}] ✅ SUCCESS:`, ...args),
    warn: (...args) => console.warn(`[${timestamp()}] ⚠️  WARN:`, ...args),
    error: (...args) => console.error(`[${timestamp()}] ❌ ERROR:`, ...args),
    debug: (...args) => {
        if (NODE_ENV === 'development') {
            console.log(`[${timestamp()}] 🐛 DEBUG:`, ...args);
        }
    },
};

module.exports = logger;
