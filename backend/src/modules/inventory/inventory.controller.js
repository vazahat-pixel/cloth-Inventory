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
      // The productId field in WarehouseInventory effectively stores the Variant _id.
      // We need to find the parent Items that own these variant IDs.
      const variantIds = stockRecords.map(s => s.productId);
      
      // 3. Fetch full Item details for these variants
      const items = await Item.find({ "sizes._id": { $in: variantIds } })
        .populate('brand', 'name brandName')
        .populate('groupIds', 'name groupType level parentId isActive')
        .populate('hsCodeId', 'code hsnCode gstRate gstPercent')
        .populate('session', 'name seasonName')
        .lean();

      // 4. Update the stock field in each size variant of the items with real-time Warehouse balance
      // Create a lookup for variant stock balances
      const stockMap = new Map();
      stockRecords.forEach(s => stockMap.set(s.productId.toString(), s.quantity));

      const enrichedItems = items.map(item => {
        // Deep copy the sizes and update them with the warehouse-specific stock
        const sizesWithStock = item.sizes.map(sz => {
          const variantIdStr = sz._id.toString();
          return {
            ...sz,
            stock: stockMap.has(variantIdStr) ? stockMap.get(variantIdStr) : 0
          };
        });

        return {
          ...item,
          sizes: sizesWithStock
        };
      });

      console.log(`[WAREHOUSE-STOCK-FULL] Returning ${enrichedItems.length} Master Items for Warehouse: ${warehouseId}`);
      return sendSuccess(res, { items: enrichedItems }, 'Items fetched successfully');
    } catch (e) {
      console.error('[WAREHOUSE-STOCK-ERROR]', e);
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
