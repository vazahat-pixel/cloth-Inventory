const PromotionType = require('../../models/promotionType.model');
const { sendSuccess, sendError, sendCreated } = require('../../utils/response.handler');

class PromotionTypeController {
    /**
     * READ PROMOTION TYPES
     */
    getPromotionTypes = async (req, res) => {
        try {
            const types = await PromotionType.find({ isActive: true }).sort({ createdAt: -1 });
            return sendSuccess(res, { types }, 'Promotion types retrieved successfully.');
        } catch (error) {
            return sendError(res, error.message);
        }
    };

    /**
     * CREATE PROMOTION TYPE
     */
    createPromotionType = async (req, res) => {
        try {
            const { name, baseLogic, description, isActive } = req.body;
            const existing = await PromotionType.findOne({ name });
            if (existing) return sendError(res, 'Promotion Type already exists.', 400);

            const type = await PromotionType.create({ name, baseLogic, description, isActive, createdBy: req.user._id });
            return sendCreated(res, { type }, 'Promotion type created successfully.');
        } catch (error) {
            return sendError(res, error.message);
        }
    };

    /**
     * DELETE PROMOTION TYPE
     */
    deletePromotionType = async (req, res) => {
        try {
            const type = await PromotionType.findByIdAndDelete(req.params.id);
            if (!type) return sendError(res, 'Promotion Type not found.', 404);
            return sendSuccess(res, null, 'Promotion type deleted successfully.');
        } catch (error) {
            return sendError(res, error.message);
        }
    };
}

module.exports = new PromotionTypeController();
