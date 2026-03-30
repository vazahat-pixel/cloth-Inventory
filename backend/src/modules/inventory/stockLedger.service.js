const StockLedger = require('../../models/stockLedger.model');
const Item = require('../../models/item.model');

class StockLedgerService {
  /**
   * Record a stock movement and calculate current balance.
   */
  async recordMovement({ itemId, barcode, type, quantity, source, referenceId, userId, locationId, locationType, batchNo = 'DEFAULT' }) {
    // 1. Get latest balance for this item/barcode/location/batch
    const lastLog = await StockLedger.findOne({ 
      itemId, 
      barcode, 
      locationId, 
      locationType,
      batchNo 
    }).sort({ createdAt: -1 });
    
    const currentBalance = lastLog ? lastLog.balanceAfter : 0;
    
    // 2. Calculate new balance
    let newBalance;
    if (type === 'IN') {
      newBalance = currentBalance + quantity;
    } else {
      // Validate negative stock rule (Location specific)
      if (currentBalance < quantity) {
        throw new Error(`Insufficient stock for Barcode ${barcode} at ${locationType} ${locationId} (Batch: ${batchNo}). Available: ${currentBalance}`);
      }
      newBalance = currentBalance - quantity;
    }

    // 3. Create ledger entry
    const entry = new StockLedger({
      itemId,
      barcode,
      type,
      quantity,
      source,
      referenceId,
      balanceAfter: newBalance,
      userId,
      locationId,
      locationType,
      batchNo
    });

    return await entry.save();
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
