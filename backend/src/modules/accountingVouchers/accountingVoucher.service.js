const AccountingVoucher = require('../../models/accountingVoucher.model');
const Account = require('../../models/account.model');
const { createJournalEntries } = require('../../services/ledger.service');
const { getNextSequence } = require('../../services/sequence.service');
const { withTransaction } = require('../../services/transaction.service');

/**
 * Generate Voucher Number (VCH-YYYY-XXXXX)
 */
const generateVoucherNumber = async (type, session = null) => {
    const year = new Date().getFullYear();
    const prefix = `${type.substring(0, 3)}-${year}-`;
    const counterName = `VOUCHER_${type}_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(6, '0')}`;
};

const createVoucher = async (voucherData, userId) => {
    console.log('[DEBUG] createVoucher called for user:', userId, 'data:', JSON.stringify(voucherData));
    return await withTransaction(async (session) => {
        const { type, date, entityId, entityModel, entries, totalAmount, narration, referenceId } = voucherData;

        const voucherNumber = await generateVoucherNumber(type, session);

        const voucher = new AccountingVoucher({
            voucherNumber,
            type,
            date,
            entityId,
            entityModel,
            entries,
            totalAmount,
            narration,
            referenceId,
            createdBy: userId,
            status: 'POSTED' // Automatically post for now, or we can implement a draft/post flow later
        });

        await voucher.save({ session });

        // Create Journal Entries for the ledger
        const ledgerEntries = entries.map(entry => ({
            voucherType: type,
            voucherId: voucher._id,
            accountId: entry.accountId,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            narration: entry.narration || narration,
            date: date || new Date(),
            createdBy: userId
        }));

        await createJournalEntries(ledgerEntries, session);

        return await AccountingVoucher.findById(voucher._id)
            .populate('entries.accountId', 'name code')
            .populate('entityId', 'name supplierName customerName');
    });
};

const getAllVouchers = async (query) => {
    console.log('[DEBUG] getAllVouchers called with query:', query);
    const { page = 1, limit = 10, type, status, startDate, endDate } = query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const skip = (page - 1) * limit;
    const [vouchers, total] = await Promise.all([
        AccountingVoucher.find(filter)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('entries.accountId', 'name')
            .populate('entityId', 'name supplierName customerName')
            .populate('createdBy', 'name'),
        AccountingVoucher.countDocuments(filter)
    ]);

    return { vouchers, total, page: parseInt(page), limit: parseInt(limit) };
};

const getVoucherById = async (id) => {
    const voucher = await AccountingVoucher.findById(id)
        .populate('entries.accountId', 'name code')
        .populate('entityId')
        .populate('createdBy', 'name')
        .populate('postedBy', 'name');
    if (!voucher) throw new Error('Voucher not found');
    return voucher;
};

module.exports = {
    createVoucher,
    getAllVouchers,
    getVoucherById
};
