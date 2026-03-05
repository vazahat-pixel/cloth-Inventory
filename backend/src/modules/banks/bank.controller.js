const Bank = require('../../models/bank.model');

exports.getAllBanks = async (req, res) => {
    try {
        const banks = await Bank.find({ isActive: true });
        res.status(200).json({ success: true, banks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createBank = async (req, res) => {
    try {
        const bank = await Bank.create(req.body);
        res.status(201).json({ success: true, bank });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateBank = async (req, res) => {
    try {
        const bank = await Bank.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, bank });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteBank = async (req, res) => {
    try {
        await Bank.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Bank deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
