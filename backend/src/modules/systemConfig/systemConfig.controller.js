const systemConfigService = require('./systemConfig.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * Handle GET /config
 */
const get = async (req, res, next) => {
    try {
        const configs = await systemConfigService.getConfigs();
        return sendSuccess(res, { configs }, 'Internal configurations retrieved');
    } catch (error) {
        next(error);
    }
};

/**
 * Handle POST /config
 */
const update = async (req, res, next) => {
    try {
        const { key, value, type, settings } = req.body;
        
        let result;
        if (settings && Array.isArray(settings)) {
            result = await systemConfigService.batchUpdateConfigs(settings, req.user._id);
        } else if (key) {
            result = await systemConfigService.updateConfig(key, value, type, req.user._id);
        } else {
            return sendError(res, 'Must provide either key/value or a settings array', 400);
        }

        return sendSuccess(res, { result }, 'System configurations updated successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    get,
    update
};
