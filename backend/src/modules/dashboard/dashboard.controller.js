const dashboardService = require('./dashboard.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const getStats = async (req, res, next) => {
    try {
        const storeId = req.user.role === 'store_staff' ? req.user.shopId : req.query.storeId;
        const stats = await dashboardService.getDashboardStats(storeId);
        return sendSuccess(res, { stats }, 'Dashboard statistics retrieved');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getStats
};
