const PromotionGroup = require('../../models/promotionGroup.model');
const { sendSuccess, sendError, sendCreated } = require('../../utils/response.handler');

class PromotionGroupController {
    getAll = async (req, res) => {
        try {
            const groups = await PromotionGroup.find()
                .populate('applicableCategories')
                .populate('applicableBrands')
                .populate('applicableProducts')
                .sort({ createdAt: -1 });
            return sendSuccess(res, { groups }, 'Promotion groups fetched successfully');
        } catch (error) {
            return sendError(res, error.message);
        }
    };

    create = async (req, res) => {
        try {
            const group = await PromotionGroup.create({
                ...req.body,
                createdBy: req.user?._id
            });
            return sendCreated(res, { group }, 'Promotion group created successfully');
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    };

    update = async (req, res) => {
        try {
            const group = await PromotionGroup.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!group) return sendError(res, 'Promotion group not found', 404);
            return sendSuccess(res, { group }, 'Promotion group updated successfully');
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    };

    delete = async (req, res) => {
        try {
            const group = await PromotionGroup.findByIdAndDelete(req.params.id);
            if (!group) return sendError(res, 'Promotion group not found', 404);
            return sendSuccess(res, null, 'Promotion group deleted successfully');
        } catch (error) {
            return sendError(res, error.message);
        }
    };
}

module.exports = new PromotionGroupController();
