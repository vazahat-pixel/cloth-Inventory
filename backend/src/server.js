const path = require('path');
const dotenv = require('dotenv');

// Try loading from root first, then relative to __dirname
dotenv.config();

dotenv.config({ path: path.join(__dirname, '..', '.env') });

require('./config/env');  // validate env vars early

const connectDB = require('./config/db');
const app = require('./app');
const { initSocket } = require('./config/socket');
const logger = require('./config/logger');
const { PORT } = require('./config/env');

const startServer = async () => {
    await connectDB();

    const server = app.listen(PORT, () => {
        logger.info(`🚀 Server running on http://localhost:${PORT}`);
        logger.info(`📌 Environment: ${process.env.NODE_ENV}`);
    });

    // Increase server timeout to 10 minutes for large bulk uploads
    server.timeout = 600000; // 10 minutes
    server.keepAliveTimeout = 620000;

    // 1. Initialize Real-time Visibility (Socket.io)
    initSocket(server);

    // Daily zero-mismatch verification (optional — see DAILY_ZERO_MISMATCH_CRON in .env)
    const { startDailyZeroMismatchScheduler } = require('./jobs/scheduler');
    startDailyZeroMismatchScheduler();

    // Handle port already in use gracefully
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            logger.error(`❌ Port ${PORT} is already in use!`);
            logger.error(`   Run this to fix: taskkill /F /IM node.exe`);
            logger.error(`   Then restart: npm run dev`);
            process.exit(1);
        } else {
            throw err;
        }
    });

    // ── Graceful shutdown ─────────────────────────────────────────
    const shutdown = async (signal) => {
        logger.warn(`${signal} received. Shutting down gracefully...`);
        server.close(() => {
            logger.info('HTTP server closed.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
});

// ── Prevent crashes from unhandled errors ──────────────────────────
process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION (server will NOT crash):', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ UNHANDLED REJECTION (server will NOT crash):', reason?.message || reason);
    if (reason?.stack) console.error(reason.stack);
});
