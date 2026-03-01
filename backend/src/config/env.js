/**
 * env.js — Validates required environment variables at startup.
 * Import this before anything else in server.js.
 */

const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'ADMIN_REGISTRATION_SECRET',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
    console.error(`\n❌ Missing required environment variables:\n   ${missing.join('\n   ')}\n`);
    process.exit(1);
}

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    ADMIN_REGISTRATION_SECRET: process.env.ADMIN_REGISTRATION_SECRET,
    NODE_ENV: process.env.NODE_ENV || 'development',
};
