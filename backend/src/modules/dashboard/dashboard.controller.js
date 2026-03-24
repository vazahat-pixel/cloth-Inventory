const dashboardService = require('./dashboard.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * Handle GET /dashboard/summary
 */
const getSummary = async (req, res, next) => {
    try {
        const summary = await dashboardService.getSummary();
        return sendSuccess(res, { summary }, 'Dashboard summary retrieved');
    } catch (error) {
        next(error);
    }
};

/**
 * Handle GET /dashboard/top-products
 */
const getTopProducts = async (req, res, next) => {
    try {
        const topProducts = await dashboardService.getTopProducts(req.query.limit);
        return sendSuccess(res, { topProducts }, 'Top selling products retrieved');
    } catch (error) {
        next(error);
    }
};

/**
 * Handle GET /dashboard/alerts
 */
const getAlerts = async (req, res, next) => {
    try {
        const alerts = await dashboardService.getAlerts();
        return sendSuccess(res, { alerts }, 'Dashboard alerts retrieved');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSummary,
    getTopProducts,
    getAlerts
};
