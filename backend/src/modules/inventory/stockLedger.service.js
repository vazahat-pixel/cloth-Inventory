const StockLedger = require('../../models/stockLedger.model');
const Item = require('../../models/item.model');

class StockLedgerService {
  /**
   * Record a stock movement and calculate current balance.
   */
  async recordMovement({ itemId, barcode, type, quantity, source, referenceId, userId, locationId, locationType, batchNo = 'DEFAULT', session = null }) {
    // 1. Get latest balance for this item/barcode/location/batch
    const lastLog = await StockLedger.findOne({ 
      itemId, 
      barcode, 
      locationId, 
      locationType,
      batchNo 
    }).session(session).sort({ createdAt: -1 });
    
    let currentBalance = 0;

    if (lastLog) {
      currentBalance = lastLog.balanceAfter;
    } else {
      // Fallback: If no ledger history exists, try to get the baseline from the real inventory record 
      // first, find the variant ID for this barcode in this item
      const itemDoc = await Item.findById(itemId).session(session);
      const variant = itemDoc?.sizes?.find(sz => (sz.sku === barcode || sz.barcode === barcode || String(sz._id) === String(barcode)));
      const targetProductId = variant ? variant._id : barcode;

      const StoreInventory = require('../../models/storeInventory.model');
      const WarehouseInventory = require('../../models/warehouseInventory.model');
      const invModel = locationType === 'STORE' ? StoreInventory : WarehouseInventory;
      const filter = locationType === 'STORE' ? { storeId: locationId } : { warehouseId: locationId };
      filter.barcode = barcode; // Primary lookup by exact barcode string from ledger

      let currentInv = await invModel.findOne(filter).session(session);
      if (!currentInv && targetProductId) {
          // Fallback to Variant search if barcode didn't match perfectly in current inventory table
          filter.barcode = undefined;
          filter.productId = targetProductId;
          currentInv = await invModel.findOne(filter).session(session);
      }

      if (currentInv) {
        currentBalance = currentInv.quantityAvailable ?? currentInv.quantity ?? 0;
      }
    }
    
    // 2. Calculate new balance
    let newBalance;
    if (type === 'IN') {
      newBalance = currentBalance + quantity;
    } else {
      // Validate negative stock rule
      const systemConfigService = require('../systemConfig/systemConfig.service');
      const allowNegative = await systemConfigService.getConfigByKey('allowNegativeStock', false);

      if (!allowNegative && currentBalance < quantity) {
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
