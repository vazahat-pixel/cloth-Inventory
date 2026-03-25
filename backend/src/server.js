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

    // 1. Initialize Real-time Visibility (Socket.io)
    initSocket(server);

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
