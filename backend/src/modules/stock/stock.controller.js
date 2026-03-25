const StockMovement = require('../../models/stockMovement.model');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * Get all stock movements with filters
 */
const getMovements = async (req, res, next) => {
    try {
        const { variantId, type, fromDate, toDate, page = 1, limit = 100 } = req.query;
        const filter = {};

        if (variantId) filter.variantId = variantId;
        if (type) filter.type = type;
        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const skip = (page - 1) * limit;

        const [movements, total] = await Promise.all([
            StockMovement.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('variantId', 'name sku barcode')
                .populate('performedBy', 'name'),
            StockMovement.countDocuments(filter)
        ]);

        return sendSuccess(res, { movements, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        next(error);
    }
};

/**
 * Get movement history for a specific variant
 */
const getHistoryByVariant = async (req, res, next) => {
    try {
        const { variantId } = req.params;
        const movements = await StockMovement.find({ variantId })
            .sort({ createdAt: -1 })
            .populate('performedBy', 'name');

        return sendSuccess(res, { movements }, 'History retrieved successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMovements,
    getHistoryByVariant
};
