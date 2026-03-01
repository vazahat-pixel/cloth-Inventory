const dashboardService = require('./dashboard.service');
const { sendSuccess } = require('../../utils/response.handler');

const getAdminDashboard = async (req, res, next) => {
    try {
        const metrics = await dashboardService.getDashboardMetrics();
        const recentSales = await dashboardService.getRecentSales();
        
        return sendSuccess(res, { metrics, recentSales }, 'Admin dashboard data retrieved');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAdminDashboard
};
