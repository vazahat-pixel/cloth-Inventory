const dashboardService = require('./dashboard.service');
const { sendSuccess } = require('../../utils/response.handler');

const getDailyDashboard = async (req, res, next) => {
    try {
        const summary = await dashboardService.getDailyDashSummary(req.user);
        return sendSuccess(res, { summary }, 'Daily dashboard summary retrieved');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDailyDashboard
};
