const hsnCodeService = require("./hsnCode.service");
const { sendSuccess, sendError } = require("../../utils/response.handler");

const createHsnCode = async (req, res, next) => {
    try {
        const hsn = await hsnCodeService.createHsnCode(req.body);
        return sendSuccess(res, { hsn }, "HSN Code created successfully", 201);
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const getAllHsnCodes = async (req, res, next) => {
    try {
        const hsns = await hsnCodeService.getAllHsnCodes(req.query);
        return sendSuccess(res, { hsns }, "HSN Codes retrieved");
    } catch (err) {
        next(err);
    }
};

const getHsnCodeById = async (req, res, next) => {
    try {
        const hsn = await hsnCodeService.getHsnCodeById(req.params.id);
        return sendSuccess(res, { hsn }, "HSN details retrieved");
    } catch (err) {
        next(err);
    }
};

const updateHsnCode = async (req, res, next) => {
    try {
        const hsn = await hsnCodeService.updateHsnCode(req.params.id, req.body);
        return sendSuccess(res, { hsn }, "HSN Code updated");
    } catch (err) {
        next(err);
    }
};

const deleteHsnCode = async (req, res, next) => {
    try {
        await hsnCodeService.deleteHsnCode(req.params.id);
        return sendSuccess(res, {}, "HSN Code deleted");
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createHsnCode,
    getAllHsnCodes,
    getHsnCodeById,
    updateHsnCode,
    deleteHsnCode
};
