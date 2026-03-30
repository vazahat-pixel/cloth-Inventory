const SalesReturn = require('../../models/salesReturn.model');
const Sale = require('../../models/sale.model');
const { addStock } = require('../../services/stock.service');
const { withTransaction } = require('../../services/transaction.service');

const createSalesReturn = async (returnData, userId) => {
  return await withTransaction(async (session) => {
    const { saleId, items } = returnData;
    
    const sale = await Sale.findById(saleId).session(session);
    if (!sale) throw new Error('Sale not found');

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const returnNumber = `SRT-${Date.now()}`;

    const salesReturn = new SalesReturn({
      returnNumber,
      saleId,
      customerId: sale.customerId,
      items,
      totalAmount,
      status: 'COMPLETED',
      createdBy: userId
    });

    await salesReturn.save({ session });

    // Increase stock for returned items
    for (const item of items) {
      await addStock({
        variantId: item.productId,
        locationId: sale.storeId, 
        locationType: 'STORE',
        qty: item.quantity,
        type: 'RETURN',
        referenceId: salesReturn._id,
        referenceType: 'SalesReturn',
        performedBy: userId,
        session
      });
    }

    return salesReturn;
  });
};

module.exports = {
  createSalesReturn
};
