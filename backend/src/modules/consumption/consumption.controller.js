const consumptionService = require('./consumption.service');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');

class ConsumptionController {
    createConsumption = async (req, res) => {
        try {
            const userId = req.user?._id || req.user?.id;
            const consumption = await consumptionService.createConsumption(req.body, userId);
            return sendCreated(res, { consumption }, 'Material consumption logged successfully');
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    };

    getConsumptions = async (req, res) => {
        try {
            const consumptions = await consumptionService.getConsumptions(req.query);
            return sendSuccess(res, { consumptions }, 'Consumption logs fetched successfully');
        } catch (error) {
            return sendError(res, error.message);
        }
    };

    getConsumptionById = async (req, res) => {
        try {
            const consumption = await consumptionService.getConsumptionById(req.params.id);
            if (!consumption) return sendNotFound(res, 'Consumption log not found');
            return sendSuccess(res, { consumption }, 'Consumption log fetched successfully');
        } catch (error) {
            return sendError(res, error.message);
        }
    };
}

module.exports = new ConsumptionController();
