const PurchaseReturn = require('../../models/purchaseReturn.model');
const Purchase = require('../../models/purchase.model');
const AccountingVoucher = require('../../models/accountingVoucher.model');
const { addStock, removeStock } = require('../../services/stock.service');
const { withTransaction } = require('../../services/transaction.service');

const generatePRNumber = async (session) => {
  const count = await PurchaseReturn.countDocuments({}).session(session);
  const year = new Date().getFullYear();
  return `PR-${year}-${String(count + 1).padStart(6, '0')}`;
};

const createPurchaseReturn = async (returnData, userId) => {
  return await withTransaction(async (session) => {
    const { 
        referenceId, 
        locationId, 
        locationType = 'WAREHOUSE',
        reason,
        items 
    } = returnData;
    
    const purchase = await Purchase.findById(referenceId).session(session);
    if (!purchase) throw new Error('Original Purchase Voucher not found');

    // Calculate totals from items
    let subTotal = 0;
    let taxAmount = 0;
    const processedItems = items.map(item => {
        // Find original item in purchase to get the correct rate/tax
        const rawItems = purchase.items || purchase.products || [];
        const originalItem = rawItems.find(ri => 
            ri.itemId?.toString() === item.itemId || 
            ri.productId?.toString() === item.itemId || 
            ri.variantId === item.variantId
        );
        
        const rate = originalItem?.rate || originalItem?.price || 0;
        const taxPercent = originalItem?.tax || originalItem?.gstPercent || 0;
        const lineSubtotal = item.quantity * rate;
        const lineTax = lineSubtotal * (taxPercent / 100);
        
        subTotal += lineSubtotal;
        taxAmount += lineTax;

        return {
            productId: item.itemId || originalItem?.itemId || originalItem?.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            rate: rate,
            taxPercent: taxPercent,
            taxAmount: lineTax,
            totalAmount: lineSubtotal + lineTax,
            reason: reason
        };
    });

    const netAmount = subTotal + taxAmount;
    const returnNumber = await generatePRNumber(session);

    // 1. Generate Accounting Voucher (Debit Note)
    const voucherCount = await AccountingVoucher.countDocuments({ type: 'DEBIT_NOTE' }).session(session);
    const voucherNumber = `DN-${new Date().getFullYear()}-${String(voucherCount + 1).padStart(5, '0')}`;
    
    const voucher = new AccountingVoucher({
        voucherNumber,
        type: 'DEBIT_NOTE',
        entityId: purchase.supplierId,
        entityModel: 'Supplier',
        amount: netAmount,
        totalAmount: netAmount,
        narration: `Purchase Return against bill ${purchase.invoiceNumber || purchase.purchaseNumber}. Reason: ${reason}`,
        date: new Date(),
        referenceId: purchase._id,
        status: 'POSTED',
        createdBy: userId
    });
    await voucher.save({ session });

    // 2. Save Purchase Return Document
    const purchaseReturn = new PurchaseReturn({
      returnNumber,
      purchaseId: purchase._id,
      supplierId: purchase.supplierId,
      locationId,
      locationType,
      items: processedItems,
      subTotal,
      taxAmount,
      netAmount,
      status: 'COMPLETED',
      voucherId: voucher._id,
      createdBy: userId
    });

    await purchaseReturn.save({ session });

    // 3. Decrease inventory stock
    for (const item of processedItems) {
      await removeStock({
        variantId: item.variantId,
        locationId: locationId,
        locationType: locationType,
        qty: item.quantity,
        type: 'RETURN',
        referenceId: purchaseReturn._id,
        referenceType: 'Return',
        performedBy: userId,
        session
      });
    }

    return purchaseReturn;
  });
};

module.exports = {
  createPurchaseReturn
};
