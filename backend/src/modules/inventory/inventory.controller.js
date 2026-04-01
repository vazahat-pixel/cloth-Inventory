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
      const Product = require('../../models/product.model');
      const Item = require('../../models/item.model');
      
      const stock = await WarehouseInventory.find({ warehouseId })
        .populate({
          path: 'productId',
          select: 'name sku barcode size color category brand salePrice'
        })
        .sort({ lastUpdated: -1 });

      const normalized = [];
      for (const s of stock) {
        let entry = null;

        if (s.productId) {
          // Scenario 1: Linked to a standard Product
          entry = {
            id: s._id,
            productId: s.productId._id,
            variantId: s.productId._id,
            itemName: s.productId.name || 'Unknown Product',
            sku: s.productId.sku || 'N/A',
            barcode: s.productId.barcode || '',
            size: s.productId.size || '-',
            color: s.productId.color || '-',
            quantity: s.quantity,
            price: s.productId.salePrice || 0
          };
        } else {
          // Scenario 2: Orphaned from Product, check Master Item table (Historical/Sync data)
          // The productId field in WarehouseInventory might effectively be an ItemId in some flows
          const masterItem = await Item.findById(s.productId || s.id).populate('brand');
          if (masterItem) {
            entry = {
              id: s._id,
              productId: masterItem._id,
              variantId: masterItem._id,
              itemName: masterItem.itemName || 'Master Item',
              sku: masterItem.itemCode || 'N/A',
              barcode: masterItem.barcode || '',
              size: (masterItem.sizes && masterItem.sizes[0]?.size) || '-',
              color: masterItem.shade || '-',
              quantity: s.quantity,
              price: (masterItem.sizes && masterItem.sizes[0]?.salePrice) || 0
            };
          } else {
             // Scenario 3: Absolute orphan, keep raw data but fix labels
             entry = {
               id: s._id,
               productId: s.productId || s._id,
               variantId: s.productId || s._id,
               itemName: `Legacy Item (${s._id.toString().slice(-4)})`,
               sku: 'LOG-N/A',
               barcode: '',
               size: '-',
               color: '-',
               quantity: s.quantity,
               price: 0
             };
          }
        }
        normalized.push(entry);
      }

      return sendSuccess(res, { data: normalized }, 'Warehouse stock retrieved');
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
