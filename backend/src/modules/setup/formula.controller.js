const Formula = require('../../models/formula.model');
const { sendSuccess, sendError } = require('../../utils/response.handler');

class FormulaController {
  create = async (req, res) => {
    try {
      const formula = new Formula(req.body);
      await formula.save();
      return sendSuccess(res, { data: formula }, 'Formula created successfully');
    } catch (e) {
      return sendError(res, e.message);
    }
  }

  getAll = async (req, res) => {
    try {
      const formulas = await Formula.find({ isActive: true });
      return sendSuccess(res, { data: formulas });
    } catch (e) {
      return sendError(res, e.message);
    }
  }

  update = async (req, res) => {
    try {
      const formula = await Formula.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return sendSuccess(res, { data: formula }, 'Formula updated successfully');
    } catch (e) {
      return sendError(res, e.message);
    }
  }

  delete = async (req, res) => {
    try {
      await Formula.findByIdAndUpdate(req.params.id, { isActive: false });
      return sendSuccess(res, { data: null }, 'Formula deactivated successfully');
    } catch (e) {
      return sendError(res, e.message);
    }
  }
}

module.exports = new FormulaController();
