const { verifyToken } = require('../utils/jwt.utils');
const { sendUnauthorized } = require('../utils/response.handler');
const { getCachedUser } = require('./userCache');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }
        if (!token) {
            return sendUnauthorized(res, 'No token provided. Access denied.');
        }

        const decoded = verifyToken(token);
        const user = await getCachedUser(decoded.id);

        if (!user) {
            return sendUnauthorized(res, 'User not found or deactivated.');
        }

        if (!user.isActive) {
            return sendUnauthorized(res, 'User not found or deactivated.');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') return sendUnauthorized(res, 'Invalid token.');
        if (error.name === 'TokenExpiredError') return sendUnauthorized(res, 'Token expired. Please log in again.');
        next(error);
    }
};

module.exports = { protect };
