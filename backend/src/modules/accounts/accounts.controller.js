const accountsService = require('./accounts.service');
const BankTransaction = require('../../models/bankTransaction.model');
const AccountingVoucher = require('../../models/accountingVoucher.model');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response.handler');

// ── Auto-generate voucher number ──────────────────────────────────────────────
const generateVoucherNumber = async (prefix) => {
    const count = await AccountingVoucher.countDocuments({ type: prefix });
    return `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
};

// ── Bank Vouchers (existing) ─────────────────────────────────────────────────

const createBankPayment = async (req, res, next) => {
    try {
        const transaction = await accountsService.createTransaction({ ...req.body, type: 'PAYMENT' }, req.user._id);
        return sendCreated(res, transaction, 'Bank payment recorded');
    } catch (err) {
        next(err);
    }
};

const createBankReceipt = async (req, res, next) => {
    try {
        const transaction = await accountsService.createTransaction({ ...req.body, type: 'RECEIPT' }, req.user._id);
        return sendCreated(res, transaction, 'Bank receipt recorded');
    } catch (err) {
        next(err);
    }
};

const getBankPayments = async (req, res, next) => {
    try {
        const payments = await accountsService.getTransactions({ type: 'PAYMENT' });
        return sendSuccess(res, { payments });
    } catch (err) {
        next(err);
    }
};

const getBankReceipts = async (req, res, next) => {
    try {
        const receipts = await accountsService.getTransactions({ type: 'RECEIPT' });
        return sendSuccess(res, { receipts });
    } catch (err) {
        next(err);
    }
};

// ── Cash Vouchers ─────────────────────────────────────────────────────────────

const createCashReceipt = async (req, res, next) => {
    try {
        const { amount, narration, date, referenceNumber, customerId, entries } = req.body;
        if (!amount || amount <= 0) return sendError(res, 'Amount must be > 0', 400);
        const voucherNumber = await generateVoucherNumber('CASH_RECEIPT');
        const voucher = await AccountingVoucher.create({
            voucherNumber,
            type: 'CASH_RECEIPT',
            entityId: customerId || null,
            entityModel: customerId ? 'Customer' : null,
            amount: Number(amount),
            totalAmount: Number(amount),
            narration,
            date: date || new Date(),
            referenceId: referenceNumber,
            entries: entries || [],
            status: 'POSTED',
            createdBy: req.user._id
        });
        return sendCreated(res, { voucher }, 'Cash receipt voucher created');
    } catch (err) {
        next(err);
    }
};

const createCashPayment = async (req, res, next) => {
    try {
        const { amount, narration, date, referenceNumber, supplierId, entries } = req.body;
        if (!amount || amount <= 0) return sendError(res, 'Amount must be > 0', 400);
        const voucherNumber = await generateVoucherNumber('CASH_PAYMENT');
        const voucher = await AccountingVoucher.create({
            voucherNumber,
            type: 'CASH_PAYMENT',
            entityId: supplierId || null,
            entityModel: supplierId ? 'Supplier' : null,
            amount: Number(amount),
            totalAmount: Number(amount),
            narration,
            date: date || new Date(),
            referenceId: referenceNumber,
            entries: entries || [],
            status: 'POSTED',
            createdBy: req.user._id
        });
        return sendCreated(res, { voucher }, 'Cash payment voucher created');
    } catch (err) {
        next(err);
    }
};

const createJournalEntry = async (req, res, next) => {
    try {
        const { narration, date, referenceNumber, entries } = req.body;
        if (!entries || !Array.isArray(entries) || entries.length < 2) {
            return sendError(res, 'Journal entry requires at least 2 line entries (debit/credit)', 400);
        }
        // Validate balanced journal
        const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
        const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return sendError(res, `Journal entry not balanced: Debit ₹${totalDebit} ≠ Credit ₹${totalCredit}`, 400);
        }
        const voucherNumber = await generateVoucherNumber('JOURNAL');
        const voucher = await AccountingVoucher.create({
            voucherNumber,
            type: 'JOURNAL',
            narration,
            date: date || new Date(),
            referenceId: referenceNumber,
            entries,
            totalAmount: totalDebit,
            status: 'POSTED',
            createdBy: req.user._id
        });
        return sendCreated(res, { voucher }, 'Journal entry created');
    } catch (err) {
        next(err);
    }
};

const getAllVouchers = async (req, res, next) => {
    try {
        const { type, startDate, endDate, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }
        const skip = (page - 1) * limit;
        const [vouchers, total] = await Promise.all([
            AccountingVoucher.find(filter)
                .populate('createdBy', 'name')
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AccountingVoucher.countDocuments(filter)
        ]);
        return sendSuccess(res, { vouchers, total }, 'Vouchers retrieved');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createBankPayment,
    createBankReceipt,
    getBankPayments,
    getBankReceipts,
    createCashReceipt,
    createCashPayment,
    createJournalEntry,
    getAllVouchers
};
