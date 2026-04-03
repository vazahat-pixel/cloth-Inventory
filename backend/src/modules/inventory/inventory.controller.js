const stockService = require('./stockLedger.service');
const auditService = require('./audit.service');
const SystemLog = require('../../models/systemLog.model');
const ErrorLog = require('../../models/errorLog.model');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/response.handler');

class InventoryController {
  
  /**
   * Fetch stock ledger for a specific item.
   */
  getLedgerByItem = async (req, res) => {
    try {
      const { itemId } = req.params;
      const history = await stockService.getLedgerByItem(itemId);
      return sendSuccess(res, { history }, 'Stock ledger retrieved successfully');
    } catch (e) {
      return sendError(res, e.message);
    }
  };

  /**
   * Global Dashboard summary of activity, logs, and errors.
   */
  getDashboardSummary = async (req, res) => {
    try {
      // Parallel fetch for speed
      const [stockSum, recentLogs, recentErrors] = await Promise.all([
        stockService.getStockSummary(),
        SystemLog.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name'),
        ErrorLog.find().sort({ createdAt: -1 }).limit(5)
      ]);

      return sendSuccess(res, {
        totalStock: stockSum[0]?.totalStock || 0,
        recentActivity: recentLogs,
        recentErrors: recentErrors
      });
    } catch (e) {
      return sendError(res, e.message);
    }
  };

  /**
   * Universal logs route for Monitoring Page.
   */
  getSystemLogs = async (req, res) => {
    try {
      const logs = await SystemLog.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('userId', 'name');
      return sendSuccess(res, { logs });
    } catch (e) {
      return sendError(res, e.message);
    }
  };

  /**
   * Universal errors route for Developer/QA Monitor.
   */
  getErrorLogs = async (req, res) => {
    try {
      const errors = await ErrorLog.find().sort({ createdAt: -1 }).limit(50);
      return sendSuccess(res, { errors });
    } catch (e) {
      return sendError(res, e.message);
    }
  };

  /**
   * ITEM JOURNEY LIFECYCLE (Timeline)
   */
  getItemJourney = async (req, res) => {
    try {
      const journey = await auditService.getItemJourney(req.params.itemId);
      return sendSuccess(res, journey);
    } catch (e) {
      return sendError(res, e.message);
    }
  };

  /**
   * SYSTEM HEALTH / VALIDATION CHECKS
   */
  getValidationReport = async (req, res) => {
    try {
      const report = await auditService.getValidationReport();
      return sendSuccess(res, report);
    } catch (e) {
      return sendError(res, e.message);
    }
  };

  /**
   * Fetch live inventory from a specific Warehouse (For Dispatch/Transfers)
   */
  getWarehouseStock = async (req, res) => {
    try {
      const { warehouseId } = req.params;
      const WarehouseInventory = require('../../models/warehouseInventory.model');
      const Item = require('../../models/item.model');
      
      // 1. Fetch all stock records for the warehouse
      const stockRecords = await WarehouseInventory.find({ warehouseId }).lean();

      if (!stockRecords || stockRecords.length === 0) {
        return sendSuccess(res, { items: [] }, 'No warehouse stock found');
      }

      // 2. Identify unique parent Item IDs. 
      // The variantId field in WarehouseInventory effectively stores the Variant _id.
      // We need to find the parent Items that own these variant IDs.
      const variantIds = stockRecords.map(s => s.variantId);
      
      // 3. Fetch full Item details for these variants
      const items = await Item.find({ "sizes._id": { $in: variantIds } })
        .populate('brand', 'name brandName')
        .populate('groupIds', 'name groupType level parentId isActive')
        .populate('hsCodeId', 'code hsnCode gstRate gstPercent')
        .populate('session', 'name seasonName')
        .lean();

      // 4. Fetch the real-time Ledger Balances for these variants
      // This ensures we show exactly what the validation engine (StockLedgerService) sees.
      const mongoose = require('mongoose');
      const warehouseObjectId = new mongoose.Types.ObjectId(warehouseId);
      const StockLedger = require('../../models/stockLedger.model');
      
      const ledgerBalances = await StockLedger.aggregate([
          { $match: { locationId: warehouseObjectId, locationType: 'WAREHOUSE' } },
          { $sort: { createdAt: -1 } },
          { $group: {
              _id: "$barcode",
              balance: { $first: "$balanceAfter" }
          }}
      ]);

      const ledgerMap = new Map();
      ledgerBalances.forEach(lb => {
          if (lb && lb._id) {
              ledgerMap.set(lb._id.toString(), lb.balance || 0);
          }
      });

      // 5. Fetch Physical Fallback (WarehouseInventory)
      // This is crucial if Stock Ledger is not yet initialized for some items.
      const physicalMap = new Map();
      const reservedMap = new Map();
      stockRecords.forEach(s => {
          physicalMap.set(s.variantId.toString(), s.quantity || 0);
          reservedMap.set(s.variantId.toString(), s.reservedQuantity || 0);
      });

      const enrichedItems = items.map(item => {
        const sizesWithStock = item.sizes.map(sz => {
            const variantIdStr = sz._id.toString();
            
            // PRIORITY 1: Stock Ledger (Audit Trail) - tracked via SKUs/Barcodes
            const ledgerBalance = sz.sku ? ledgerMap.get(sz.sku) : undefined;
            
            // PRIORITY 2: Physical Table (Fallback)
            const physical = ledgerBalance !== undefined ? ledgerBalance : (physicalMap.get(variantIdStr) || 0);
            const reserved = reservedMap.get(variantIdStr) || 0;
            const netAvailable = Math.max(0, physical - reserved);
            
            return {
                ...sz,
                physicalStock: physical,
                reservedStock: reserved,
                availableStock: netAvailable,
                stock: netAvailable 
            };
        });

        return { ...item, sizes: sizesWithStock };
      });

      return sendSuccess(res, { items: enrichedItems }, 'Items fetched successfully');
    } catch (e) {
      console.error('[WAREHOUSE-STOCK-ERROR]', e);
      return sendError(res, e.message);
    }
  };

  /**
   * SCAN Warehouse Item (For DC/Dispatch)
   * Scans a barcode and returns variant info + stock level
   */
  scanWarehouseItem = async (req, res) => {
    try {
      const { warehouseId, barcode } = req.params;
      const WarehouseInventory = require('../../models/warehouseInventory.model');
      
      const stock = await WarehouseInventory.findOne({ warehouseId, barcode })
        .populate('itemId', 'itemName itemCode itemRole shade gstTax');

      if (!stock) {
        return sendNotFound(res, 'Item not found in this warehouse stock');
      }

      return sendSuccess(res, stock, 'Item scanned successfully');
    } catch (e) {
      return sendError(res, e.message);
    }
  };

  /**
   * CLIENT DEMO DASHBOARD High-Level Stats
   */
  getClientDemoMetrics = async (req, res) => {
    try {
      const metrics = await auditService.getClientDemoMetrics();
      return sendSuccess(res, metrics);
    } catch (e) {
      return sendError(res, e.message);
    }
  };
}

module.exports = new InventoryController();
