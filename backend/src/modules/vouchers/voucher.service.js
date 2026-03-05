const Voucher = require('../../models/voucher.model');

const createVoucher = async (data, userId) => {
    return await Voucher.create({ ...data, issuedBy: userId });
};

const getAllVouchers = async (query = {}) => {
    const { status, customerId, voucherNumber } = query;
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (voucherNumber) filter.voucherNumber = new RegExp(voucherNumber, 'i');

    return await Voucher.find(filter)
        .populate('customerId', 'name mobile')
        .populate('issuedBy', 'name')
        .sort({ createdAt: -1 });
};

const getVoucherByNumber = async (voucherNumber) => {
    const voucher = await Voucher.findOne({
        voucherNumber: voucherNumber.toUpperCase(),
        status: 'ACTIVE'
    });
    if (!voucher) throw new Error('Invalid or inactive voucher');

    if (new Date() > voucher.expiryDate) {
        voucher.status = 'EXPIRED';
        await voucher.save();
        throw new Error('Voucher has expired');
    }

    return voucher;
};

const updateVoucher = async (id, data) => {
    return await Voucher.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

module.exports = {
    createVoucher,
    getAllVouchers,
    getVoucherByNumber,
    updateVoucher
};
