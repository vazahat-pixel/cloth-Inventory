const salesReturnService = require('./salesReturn.service');
const SalesReturn = require('../../models/salesReturn.model');

const createReturn = async (req, res) => {
  try {
    const returnData = req.body;
    const userId = req.user._id;
    const returnEntry = await salesReturnService.createSalesReturn(returnData, userId);
    res.status(201).json({ success: true, data: returnEntry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllReturns = async (req, res) => {
  try {
    const { type, storeId } = req.query;
    const filter = {};
    if (storeId) filter.storeId = storeId;
    // Note: The model doesn't currently have a 'type' field, but we can filter by other criteria if needed.

    const returns = await SalesReturn.find(filter)
      .populate('saleId')
      .populate('customerId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: returns });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getReturnById = async (req, res) => {
  try {
    const returnEntry = await SalesReturn.findById(req.params.id)
      .populate('saleId')
      .populate('customerId')
      .populate('items.productId');
    
    if (!returnEntry) throw new Error('Return entry not found');
    res.status(200).json({ success: true, data: returnEntry });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReturn,
  getAllReturns,
  getReturnById
};
