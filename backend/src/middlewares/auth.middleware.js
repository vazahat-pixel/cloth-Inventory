const { verifyToken } = require('../utils/jwt.utils');
const User = require('../models/user.model');
const { sendUnauthorized } = require('../utils/response.handler');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }
        if (!token) {
            console.warn('[AUTH] No token provided in header');
            return sendUnauthorized(res, 'No token provided. Access denied.');
        }

        const decoded = verifyToken(token);
        console.log(`[AUTH] Decoded Token - ID: ${decoded.id}, Role: ${decoded.role}`);
        const user = await User.findById(decoded.id);

        if (!user) {
            console.warn(`[AUTH] User not found for ID: ${decoded.id}`);
            return sendUnauthorized(res, 'User not found or deactivated.');
        }

        if (!user.isActive) {
            console.warn(`[AUTH] User deactivated: ${user.email}`);
            return sendUnauthorized(res, 'User not found or deactivated.');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error(`[AUTH] Error verifying token: ${error.message}`);
        if (error.name === 'JsonWebTokenError') return sendUnauthorized(res, 'Invalid token.');
        if (error.name === 'TokenExpiredError') return sendUnauthorized(res, 'Token expired. Please log in again.');
        next(error);
    }
};

module.exports = { protect };
