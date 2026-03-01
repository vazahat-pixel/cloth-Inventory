const { verifyToken } = require('../utils/jwt.utils');
const User = require('../models/user.model');
const { sendUnauthorized } = require('../utils/response.handler');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) return sendUnauthorized(res, 'No token provided. Access denied.');

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) return sendUnauthorized(res, 'User not found or deactivated.');

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') return sendUnauthorized(res, 'Invalid token.');
        if (error.name === 'TokenExpiredError') return sendUnauthorized(res, 'Token expired. Please log in again.');
        next(error);
    }
};

module.exports = { protect };
