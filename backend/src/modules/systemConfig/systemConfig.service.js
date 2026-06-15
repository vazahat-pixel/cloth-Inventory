const Settings = require('../../models/settings.model');

const CONFIG_CACHE_TTL_MS = 60 * 1000;
const configCache = new Map();

const getCachedConfig = (key) => {
    const entry = configCache.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.at > CONFIG_CACHE_TTL_MS) {
        configCache.delete(key);
        return undefined;
    }
    return entry.value;
};

const setCachedConfig = (key, value) => {
    configCache.set(key, { value, at: Date.now() });
};

const invalidateConfigCache = (key) => {
    if (key) configCache.delete(key);
    else configCache.clear();
};

/**
 * Get all current configuration settings
 */
const getConfigs = async () => {
    return await Settings.find().sort({ key: 1 });
};

/**
 * Get a specific configuration value by key
 */
const getConfigByKey = async (key, defaultValue = null) => {
    const cached = getCachedConfig(key);
    if (cached !== undefined) return cached;

    const config = await Settings.findOne({ key }).lean();
    const value = config ? config.value : defaultValue;
    setCachedConfig(key, value);
    return value;
};

/**
 * Update or create a single configuration key
 */
const updateConfig = async (key, value, type, userId) => {
    let config = await Settings.findOne({ key });

    if (config) {
        config.value = value;
        config.type = type || config.type;
        config.updatedBy = userId;
        await config.save();
    } else {
        config = new Settings({
            key,
            value,
            type: type || 'STRING',
            updatedBy: userId
        });
        await config.save();
    }

    invalidateConfigCache(key);
    return config;
};

/**
 * Batch update configurations
 * reqBody = { settings: [ { key, value, type }, ... ] }
 */
const batchUpdateConfigs = async (settingsArray, userId) => {
    const results = [];
    for (const item of settingsArray) {
        const { key, value, type } = item;
        const result = await updateConfig(key, value, type, userId);
        results.push(result);
    }
    return results;
};

module.exports = {
    getConfigs,
    getConfigByKey,
    updateConfig,
    batchUpdateConfigs,
    invalidateConfigCache,
};
