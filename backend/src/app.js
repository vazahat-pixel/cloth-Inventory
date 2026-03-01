const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const registerRoutes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Security Middlewares ──────────────────────────────────────────
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests from this IP' }
});
// app.use('/api/', limiter); // Disable limiter temporarily for verification

// ── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'http://localhost:3000'
    ];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// ── Body Parsers ──────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Health Check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'OK', message: 'Cloth Inventory API is running', timestamp: new Date() });
});

// ── Module Routes ─────────────────────────────────────────────────
registerRoutes(app);

// ── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
