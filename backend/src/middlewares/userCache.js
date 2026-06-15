const User = require('../models/user.model');

const USER_CACHE_TTL_MS = 60 * 1000;
const userCache = new Map();

const getCachedUser = async (userId) => {
    const key = String(userId);
    const entry = userCache.get(key);
    if (entry && Date.now() - entry.at < USER_CACHE_TTL_MS) {
        return entry.user;
    }

    const user = await User.findById(userId);
    if (user) {
        userCache.set(key, { user, at: Date.now() });
    }
    return user;
};

const invalidateUserCache = (userId) => {
    if (userId) userCache.delete(String(userId));
    else userCache.clear();
};

module.exports = { getCachedUser, invalidateUserCache };
