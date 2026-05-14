const StockLedger = require('../../models/stockLedger.model');
const Item = require('../../models/item.model');

class StockLedgerService {
  /**
   * Record a stock movement and calculate current balance.
   */
  async recordMovement({ itemId, variantId, barcode, type, quantity, source, referenceId, userId, locationId, locationType, batchNo = 'DEFAULT', session = null }) {
    const StoreInventory = require('../../models/storeInventory.model');
    const WarehouseInventory = require('../../models/warehouseInventory.model');
    const invModel = locationType === 'STORE' ? StoreInventory : WarehouseInventory;
    const locField = locationType === 'STORE' ? 'storeId' : 'warehouseId';

    let currentInv = await invModel.findOne({
        [locField]: locationId,
        $or: [
            { barcode },
            variantId ? { variantId: String(variantId) } : null
        ].filter(Boolean)
    }).session(session);

    if (!currentInv && itemId) {
        currentInv = await invModel.findOne({
            [locField]: locationId,
            itemId
        }).session(session);
    }

    const balanceAfter = currentInv ? (currentInv.quantity || 0) : 0;

    // Create ledger entry
    const entry = new StockLedger({
      itemId,
      variantId,
      barcode,
      type,
      quantity,
      source,
      referenceId,
      balanceAfter,
      userId,
      locationId,
      locationType,
      batchNo
    });

    return await entry.save({ session });
  }

  /**
   * Fetch ledger history for a specific item.
   */
  async getLedgerByItem(itemId) {
    return await StockLedger.find({ itemId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
  }

  /**
   * Fetch current global stock summary.
   */
  async getStockSummary() {
    // Aggregation to get latest balanceAfter for each unique itemId/barcode
    // Usually easier to query the latest ones per group
    return await StockLedger.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: { itemId: "$itemId", barcode: "$barcode" },
          lastBalance: { $first: "$balanceAfter" }
      }},
      { $group: {
          _id: null,
          totalStock: { $sum: "$lastBalance" }
      }}
    ]);
  }
}

module.exports = new StockLedgerService();
