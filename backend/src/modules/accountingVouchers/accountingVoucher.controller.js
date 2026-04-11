const voucherService = require('./accountingVoucher.service');

exports.createVoucher = async (req, res) => {
    try {
        const voucher = await voucherService.createVoucher(req.body, req.user.id);
        res.status(201).json({ success: true, voucher });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAllVouchers = async (req, res) => {
    try {
        const result = await voucherService.getAllVouchers(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getVoucherById = async (req, res) => {
    try {
        const voucher = await voucherService.getVoucherById(req.params.id);
        res.status(200).json({ success: true, voucher });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
