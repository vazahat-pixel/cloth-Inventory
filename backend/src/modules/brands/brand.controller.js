const Brand = require('../../models/brand.model');

exports.getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.find({ isActive: true });
        res.status(200).json({ success: true, brands });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createBrand = async (req, res) => {
    try {
        const brand = await Brand.create(req.body);
        res.status(201).json({ success: true, brand });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateBrand = async (req, res) => {
    try {
        const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, brand });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteBrand = async (req, res) => {
    try {
        await Brand.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Brand deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
