const AccountingVoucher = require('../../models/accountingVoucher.model');
const Ledger = require('../../models/ledger.model');
const { createJournalEntries } = require('../../services/ledger.service');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');

const generateVoucherNumber = async (type, session = null) => {
    const year = new Date().getFullYear();
    const prefixes = {
        'JOURNAL': 'JV',
        'CREDIT_NOTE': 'CN',
        'DEBIT_NOTE': 'DN',
        'BANK_RECEIPT': 'BR',
        'BANK_PAYMENT': 'BP',
        'CASH_RECEIPT': 'CR',
        'CASH_PAYMENT': 'CP'
    };
    const prefix = `${prefixes[type] || 'VO'}-${year}-`;
    const counterName = `ACCOUNTING_VOUCHER_${type}_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * Create a new Accounting Voucher
 * @param {Object} voucherData - { type, date, entries: [{ accountId, debit, credit, narration }], narration, totalAmount }
 * @param {String} userId - Auditor/Staff ID
 */
const createVoucher = async (voucherData, userId) => {
    return await withTransaction(async (session) => {
        const voucherNumber = await generateVoucherNumber(voucherData.type, session);
        
        // 1. Validate entries balance (Double-Entry check)
        let totalDebit = 0;
        let totalCredit = 0;
        voucherData.entries.forEach(e => {
            totalDebit += Number(e.debit || 0);
            totalCredit += Number(e.credit || 0);
        });

        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new Error(`Accounting Voucher not balanced (Debit: ${totalDebit}, Credit: ${totalCredit}). Every fiscal event must balance.`);
        }

        const voucher = new AccountingVoucher({
            ...voucherData,
            voucherNumber,
            createdBy: userId,
            status: 'DRAFT'
        });

        await voucher.save({ session });
        return voucher;
    });
};

/**
 * Post Voucher to General Ledger (Transitions from DRAFT to POSTED)
 */
const postVoucher = async (id, userId) => {
    return await withTransaction(async (session) => {
        const voucher = await AccountingVoucher.findById(id).session(session);
        if (!voucher) throw new Error('Accounting voucher not found');
        if (voucher.status === 'POSTED') throw new Error('Voucher is already posted to General Ledger');

        // 1. Prepare journal entries for the ledger
        const ledgerEntries = voucher.entries.map(e => ({
            voucherType: voucher.type,
            voucherId: voucher._id,
            accountId: e.accountId,
            debit: e.debit,
            credit: e.credit,
            date: voucher.date,
            narration: e.narration || voucher.narration,
            createdBy: userId
        }));

        // 2. Commit to GL
        await createJournalEntries(ledgerEntries, session);

        // 3. Update Voucher Status
        voucher.status = 'POSTED';
        voucher.postedBy = userId;
        await voucher.save({ session });

        return voucher;
    });
};

const getVouchers = async (filter = {}) => {
    return await AccountingVoucher.find(filter)
        .sort({ date: -1 })
        .populate('createdBy', 'name')
        .populate('postedBy', 'name')
        .populate('entries.accountId', 'name type code');
};

const getVoucherById = async (id) => {
    return await AccountingVoucher.findById(id)
        .populate('entries.accountId')
        .populate('createdBy', 'name')
        .populate('postedBy', 'name');
};

module.exports = {
    createVoucher,
    postVoucher,
    getVouchers,
    getVoucherById
};
