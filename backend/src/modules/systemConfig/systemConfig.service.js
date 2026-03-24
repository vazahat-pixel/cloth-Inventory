const Settings = require('../../models/settings.model');

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
    const config = await Settings.findOne({ key });
    return config ? config.value : defaultValue;
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
    batchUpdateConfigs
};
