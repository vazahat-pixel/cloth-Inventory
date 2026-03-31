const Season = require('../../models/season.model');
const { sendSuccess, sendError } = require('../../utils/response.handler');

exports.getAllSeasons = async (req, res, next) => {
    try {
        const seasons = await Season.find().sort({ year: -1, name: 1 });
        return sendSuccess(res, { seasons }, 'Seasons retrieved successfully');
    } catch (err) {
        next(err);
    }
};

exports.createSeason = async (req, res, next) => {
    try {
        const { name } = req.body;
        const existing = await Season.findOne({ name });
        if (existing) return sendError(res, 'Season with this name already exists', 400);

        const season = await Season.create(req.body);
        return sendSuccess(res, { season }, 'Season created successfully', 201);
    } catch (err) {
        next(err);
    }
};

exports.updateSeason = async (req, res, next) => {
    try {
        const season = await Season.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!season) return sendError(res, 'Season not found', 404);
        return sendSuccess(res, { season }, 'Season updated successfully');
    } catch (err) {
        next(err);
    }
};

exports.deleteSeason = async (req, res, next) => {
    try {
        const season = await Season.findByIdAndDelete(req.params.id);
        if (!season) return sendError(res, 'Season not found', 404);
        return sendSuccess(res, null, 'Season deleted successfully');
    } catch (err) {
        next(err);
    }
};
