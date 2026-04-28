const TaxRule = require('../../models/taxRule.model');

exports.getTaxRules = async (req, res) => {
    try {
        const rules = await TaxRule.find({ isActive: true }).sort({ min: 1 });
        res.status(200).json({ success: true, data: rules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createTaxRule = async (req, res) => {
    try {
        const rule = await TaxRule.create(req.body);
        res.status(201).json({ success: true, data: rule });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateTaxRule = async (req, res) => {
    try {
        const rule = await TaxRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!rule) return res.status(404).json({ success: false, message: 'Tax rule not found' });
        res.status(200).json({ success: true, data: rule });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteTaxRule = async (req, res) => {
    try {
        const rule = await TaxRule.findByIdAndUpdate(req.params.id, { isActive: false });
        if (!rule) return res.status(404).json({ success: false, message: 'Tax rule not found' });
        res.status(200).json({ success: true, message: 'Tax rule deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.seedTaxRules = async (req, res) => {
    try {
        // Clear existing rules if any
        await TaxRule.deleteMany({});
        
        const defaultRules = [
            { name: 'Apparel Low Slab', min: 0, max: 2499, gst: 5, type: 'SLAB' },
            { name: 'Apparel High Slab', min: 2500, max: null, gst: 18, type: 'SLAB' },
            { name: 'Belt Flat', gst: 18, type: 'FLAT', hsnCode: '42033000' }
        ];
        
        const rules = await TaxRule.insertMany(defaultRules);
        res.status(201).json({ success: true, data: rules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
