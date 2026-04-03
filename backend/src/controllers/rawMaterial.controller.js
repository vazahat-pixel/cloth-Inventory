const RawMaterial = require('../models/rawMaterial.model');

// Create New Raw Material
exports.createRawMaterial = async (req, res) => {
  try {
    const rawMaterial = new RawMaterial(req.body);
    await rawMaterial.save();
    res.status(201).json({ success: true, data: rawMaterial });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Material Code already exists.' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Raw Materials
exports.getAllRawMaterials = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    let query = {};
    
    if (type && type !== 'all') query.materialType = type;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { shadeNo: { $regex: search, $options: 'i' } }
      ];
    }

    const materials = await RawMaterial.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Raw Material
exports.getRawMaterial = async (req, res) => {
  try {
    const rawMaterial = await RawMaterial.findById(req.params.id);
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    res.status(200).json({ success: true, data: rawMaterial });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update Raw Material
exports.updateRawMaterial = async (req, res) => {
  try {
    const rawMaterial = await RawMaterial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    res.status(200).json({ success: true, data: rawMaterial });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Raw Material
exports.deleteRawMaterial = async (req, res) => {
  try {
    const rawMaterial = await RawMaterial.findByIdAndDelete(req.params.id);
    if (!rawMaterial) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    res.status(200).json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
