/**
 * Idempotency middleware — replays cached responses and dedupes in-flight writes.
 * Clients send `Idempotency-Key` header on POST/PUT/PATCH.
 */
const TTL_MS = 5 * 60 * 1000;
const cache = new Map();
const inFlight = new Map();

const pruneCache = () => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (now - entry.at > TTL_MS) cache.delete(key);
    }
};

const idempotency = (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();

    const idempotencyKey = req.headers['idempotency-key'];
    if (!idempotencyKey) return next();

    pruneCache();

    const userId = req.user?._id ? String(req.user._id) : 'anon';
    const cacheKey = `${userId}:${req.method}:${req.originalUrl}:${idempotencyKey}`;
    const cached = cache.get(cacheKey);

    if (cached) {
        return res.status(cached.statusCode).json(cached.body);
    }

    if (inFlight.has(cacheKey)) {
        return res.status(409).json({
            success: false,
            message: 'This request is already being processed. Please wait.',
            code: 'IDEMPOTENCY_IN_FLIGHT',
        });
    }

    inFlight.set(cacheKey, Date.now());

    const release = () => {
        inFlight.delete(cacheKey);
    };

    res.on('finish', release);
    res.on('close', release);

    const originalJson = res.json.bind(res);
    res.json = function jsonWithCache(body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            cache.set(cacheKey, { statusCode: res.statusCode, body, at: Date.now() });
        }
        return originalJson(body);
    };

    next();
};

module.exports = { idempotency };
