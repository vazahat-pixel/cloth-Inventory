const Size = require('../../models/size.model');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');

class SizeController {
  create = async (req, res) => {
    try {
      const size = await Size.create(req.body);
      return sendCreated(res, { size }, 'Size created successfully');
    } catch (error) {
      if (error.code === 11000) {
        return sendError(res, 'Size code already exists', 400);
      }
      return sendError(res, error.message, 400);
    }
  };

  getAll = async (req, res) => {
    try {
      const sizes = await Size.find().sort({ sequence: 1, code: 1 });
      return sendSuccess(res, { sizes }, 'Sizes fetched successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  getById = async (req, res) => {
    try {
      const size = await Size.findById(req.params.id);
      if (!size) return sendNotFound(res, 'Size not found');
      return sendSuccess(res, { size }, 'Size fetched successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  update = async (req, res) => {
    try {
      const size = await Size.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!size) return sendNotFound(res, 'Size not found');
      return sendSuccess(res, { size }, 'Size updated successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  };

  delete = async (req, res) => {
    try {
      const size = await Size.findByIdAndDelete(req.params.id);
      if (!size) return sendNotFound(res, 'Size not found');
      return sendSuccess(res, {}, 'Size deleted successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  };
}

module.exports = new SizeController();
