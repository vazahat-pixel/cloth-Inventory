const Salesman = require('../../models/salesman.model');

const getAllSalesmen = async (req, res) => {
  try {
    const { storeId } = req.query;
    const filter = {};
    if (storeId) filter.storeId = storeId;
    
    // In many parts of the frontend, 'shopId' is used interchangeably with 'storeId'
    const salesmen = await Salesman.find(filter)
      .populate('storeId', 'name')
      .sort({ name: 1 });
    
    // Add compatibility mappings for the frontend expectations (shopId vs storeId)
    const normalized = salesmen.map(s => {
        const obj = s.toObject({ getters: true });
        return {
            ...obj,
            id: s._id,
            shopId: s.storeId?._id || s.storeId
        };
    });

    res.status(200).json({ success: true, data: normalized });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createSalesman = async (req, res) => {
  try {
    const salesman = new Salesman(req.body);
    await salesman.save();
    res.status(201).json({ success: true, data: salesman });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateSalesman = async (req, res) => {
  try {
    const salesman = await Salesman.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!salesman) throw new Error('Salesman not found');
    res.status(200).json({ success: true, data: salesman });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteSalesman = async (req, res) => {
  try {
    const salesman = await Salesman.findByIdAndDelete(req.params.id);
    if (!salesman) throw new Error('Salesman not found');
    res.status(200).json({ success: true, message: 'Salesman deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllSalesmen,
  createSalesman,
  updateSalesman,
  deleteSalesman
};
