/**
 * socket.js — Socket.IO setup (stub — ready for real-time features).
 * Pass the HTTP server instance to initialize.
 */

let io = null;

const { verifyToken } = require('../utils/jwt.utils');

const initSocket = (httpServer) => {
    const { Server } = require('socket.io');
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:5173', 'http://localhost:5174'];

    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
        },
    });

    // ── Socket Auth Middleware ────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication error: No token provided'));

        try {
            const decoded = verifyToken(token);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user?.name})`);
        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error('Socket.IO not initialized. Call initSocket(server) first.');
    return io;
};

module.exports = { initSocket, getIO };
