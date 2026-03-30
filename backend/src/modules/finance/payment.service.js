const Payment = require('../../models/payment.model');
const Purchase = require('../../models/purchase.model');
const Sale = require('../../models/sale.model');
const { createJournalEntries } = require('../../services/ledger.service');
const { withTransaction } = require('../../services/transaction.service');
const { createAuditLog } = require('../../middlewares/audit.middleware');

const Account = require('../../models/account.model');
const { getNextSequence } = require('../../services/sequence.service');

const processPayment = async (paymentData, userId) => {
  return await withTransaction(async (session) => {
    const { type, referenceId, referenceModel, amount, paymentMethod, partyId } = paymentData;
    
    const year = new Date().getFullYear();
    const seq = await getNextSequence(`PAYMENT_${year}`, session);
    const paymentNumber = `PAY-${year}-${seq.toString().padStart(6, '0')}`;

    const payment = new Payment({
      paymentNumber,
      type,
      referenceId,
      referenceModel,
      partyId,
      amount: Number(amount),
      paymentMethod,
      status: 'SUCCESS',
      createdBy: userId,
      paymentDate: paymentData.paymentDate || Date.now()
    });

    await payment.save({ session });

    // --- Accounting Entry ---
    const bankAccount = await Account.findOne({ name: 'Bank Account' }).session(session);
    const cashAccount = await Account.findOne({ name: 'Cash Account' }).session(session);
    const payableAccount = await Account.findOne({ name: 'Accounts Payable' }).session(session);
    const receivableAccount = await Account.findOne({ name: 'Accounts Receivable' }).session(session);

    let fromAcc, toAcc;

    if (type === 'PAYABLE') {
        // Outgoing: Dr Payable (Liability -), Cr Cash/Bank (Asset -)
        fromAcc = (paymentMethod === 'CASH') ? cashAccount : bankAccount;
        toAcc = payableAccount;
        
        if (fromAcc && toAcc) {
            await createJournalEntries([
                {
                    voucherType: 'PAYMENT',
                    voucherId: payment._id,
                    accountId: toAcc._id,
                    debit: payment.amount,
                    credit: 0,
                    narration: `Payment ${payment.paymentNumber} to ${referenceModel} ${referenceId}`,
                    createdBy: userId
                },
                {
                    voucherType: 'PAYMENT',
                    voucherId: payment._id,
                    accountId: fromAcc._id,
                    debit: 0,
                    credit: payment.amount,
                    narration: `Payment ${payment.paymentNumber} to ${referenceModel} ${referenceId}`,
                    createdBy: userId
                }
            ], session);
        }
    } else if (type === 'RECEIVABLE') {
        // Incoming: Dr Cash/Bank (Asset +), Cr Receivable (Asset -)
        fromAcc = receivableAccount;
        toAcc = (paymentMethod === 'CASH') ? cashAccount : bankAccount;

        if (fromAcc && toAcc) {
            await createJournalEntries([
                {
                    voucherType: 'RECEIPT',
                    voucherId: payment._id,
                    accountId: toAcc._id,
                    debit: payment.amount,
                    credit: 0,
                    narration: `Receipt ${payment.paymentNumber} from ${referenceModel} ${referenceId}`,
                    createdBy: userId
                },
                {
                    voucherType: 'RECEIPT',
                    voucherId: payment._id,
                    accountId: fromAcc._id,
                    debit: 0,
                    credit: payment.amount,
                    narration: `Receipt ${payment.paymentNumber} from ${referenceModel} ${referenceId}`,
                    createdBy: userId
                }
            ], session);
        }
    }

    await createAuditLog({
        action: 'PAYMENT_RECORDED',
        module: 'Accounting',
        performedBy: userId,
        details: { paymentNumber: payment.paymentNumber, type, amount, referenceId },
        session
    });

    return payment;
  });
};

module.exports = {
  processPayment
};
