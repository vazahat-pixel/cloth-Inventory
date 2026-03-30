const PurchaseReturn = require('../../models/purchaseReturn.model');
const Purchase = require('../../models/purchase.model');
const { addStock, removeStock } = require('../../services/stock.service');
const { withTransaction } = require('../../services/transaction.service');

const createPurchaseReturn = async (returnData, userId) => {
  return await withTransaction(async (session) => {
    const { purchaseId, items } = returnData;
    
    const purchase = await Purchase.findById(purchaseId).session(session);
    if (!purchase) throw new Error('Purchase not found');

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const returnNumber = `PRT-${Date.now()}`;

    const purchaseReturn = new PurchaseReturn({
      returnNumber,
      purchaseId,
      supplierId: purchase.supplierId,
      items,
      totalAmount,
      status: 'COMPLETED',
      createdBy: userId
    });

    await purchaseReturn.save({ session });

    // Decrease stock for returned items
    for (const item of items) {
      await removeStock({
        variantId: item.productId,
        locationId: purchase.storeId, // assuming storeId is where stock was added
        locationType: 'STORE',
        qty: item.quantity,
        type: 'RETURN',
        referenceId: purchaseReturn._id,
        referenceType: 'PurchaseReturn',
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
