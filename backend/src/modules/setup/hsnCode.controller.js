const HsnCode = require('../../models/hsnCode.model');
const { sendSuccess, sendError } = require('../../utils/response.handler');

class HsnCodeController {
  create = async (req, res) => {
    try {
      const payload = { ...req.body };
      if (payload.gstRate !== undefined) payload.gstPercent = payload.gstRate;
      
      const hsn = new HsnCode(payload);
      await hsn.save();
      return sendSuccess(res, { data: hsn }, 'HS Code created successfully');
    } catch (e) {
      return sendError(res, e.message);
    }
  }

  getAll = async (req, res) => {
    try {
      const hsnCodes = await HsnCode.find({ isActive: true }).sort('-createdAt');
      return sendSuccess(res, { data: hsnCodes });
    } catch (e) {
      return sendError(res, e.message);
    }
  }

  update = async (req, res) => {
    try {
      const payload = { ...req.body };
      if (payload.gstRate !== undefined) payload.gstPercent = payload.gstRate;

      const hsn = await HsnCode.findByIdAndUpdate(req.params.id, payload, { new: true });
      return sendSuccess(res, { data: hsn }, 'HS Code updated successfully');
    } catch (e) {
      return sendError(res, e.message);
    }
  }

  delete = async (req, res) => {
    try {
      await HsnCode.findByIdAndUpdate(req.params.id, { isActive: false });
      return sendSuccess(res, { data: null }, 'HS Code deactivated successfully');
    } catch (e) {
      return sendError(res, e.message);
    }
  }
}

module.exports = new HsnCodeController();
