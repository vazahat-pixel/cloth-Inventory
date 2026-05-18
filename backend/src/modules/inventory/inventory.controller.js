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
      const items = await Item.find({
        $or: [
          { "sizes._id": { $in: variantIds } },
          { "_id": { $in: variantIds } }
        ]
      })
        .populate('brand', 'name brandName')
        .populate('groupIds', 'name groupType level parentId isActive')
        .populate('hsCodeId', 'code hsnCode gstRate gstPercent')
        .lean();

      // 4. Fetch the real-time Ledger Balances for these variants
      // This ensures we show exactly what the validation engine (StockLedgerService) sees.
      const mongoose = require('mongoose');
      const warehouseObjectId = new mongoose.Types.ObjectId(warehouseId);
      const StockLedger = require('../../models/stockLedger.model');

      const ledgerBalances = await StockLedger.aggregate([
        { $match: { locationId: warehouseObjectId, locationType: 'WAREHOUSE' } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$barcode",
            balance: { $first: "$balanceAfter" }
          }
        }
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

      const enrichedResults = [];
      const usedVariantIds = new Set();

      items.forEach(item => {
        let finalSizes = [];
        const baseIdStr = item._id.toString();

        // 1. Process sizes that have stock linked to them
        if (item.sizes && item.sizes.length > 0) {
          item.sizes.forEach(sz => {
            const vid = sz._id.toString();
            const ledgerBalance = sz.sku ? ledgerMap.get(sz.sku) : undefined;
            const physical = physicalMap.get(vid);

            if (ledgerBalance !== undefined || physical !== undefined) {
              usedVariantIds.add(vid);
              const stockVal = ledgerBalance !== undefined ? ledgerBalance : (physical || 0);
              const reserved = reservedMap.get(vid) || 0;

              finalSizes.push({
                ...sz,
                physicalStock: stockVal,
                reservedStock: reserved,
                availableStock: Math.max(0, stockVal - reserved),
                stock: Math.max(0, stockVal - reserved)
              });
            }
          });
        }

        // 2. Process stock linked to the base Item ID (for non-variant items)
        const baseLedger = ledgerMap.get(item.itemCode);
        const basePhysical = physicalMap.get(baseIdStr);

        if (baseLedger !== undefined || basePhysical !== undefined) {
          if (!usedVariantIds.has(baseIdStr)) {
            const stockVal = baseLedger !== undefined ? baseLedger : (basePhysical || 0);
            const reserved = reservedMap.get(baseIdStr) || 0;

            finalSizes.push({
              _id: item._id,
              size: item.accessorySize || item.width || 'Universal',
              color: item.composition || item.shadeNo || 'N/A',
              sku: item.itemCode,
              physicalStock: stockVal,
              reservedStock: reserved,
              availableStock: Math.max(0, stockVal - reserved),
              stock: Math.max(0, stockVal - reserved)
            });
          }
        }

        if (finalSizes.length > 0) {
          enrichedResults.push({ ...item, sizes: finalSizes });
        }
      });

      return sendSuccess(res, { items: enrichedResults }, 'Items fetched successfully');
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
      const Item = require('../../models/item.model');

      const code = barcode.trim();
      console.log(`[SCAN] warehouseId=${warehouseId}, code="${code}"`);

      // Case-insensitive regex
      const codeRegex = new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

      // ─── STRATEGY 1: Exact match on WarehouseInventory barcode (most common case) ───
      let stock = await WarehouseInventory.findOne({
        warehouseId,
        barcode: codeRegex
      }).populate({ path: 'itemId', populate: { path: 'hsCodeId' } });

      if (stock) {
        const item = stock.itemId;
        const variant = item?.sizes?.find(sz =>
          (sz.barcode && sz.barcode.toLowerCase() === code.toLowerCase()) ||
          (sz.sku && sz.sku.toLowerCase() === code.toLowerCase()) ||
          sz._id.toString() === stock.variantId
        );
        console.log(`[SCAN] STRATEGY 1 matched: barcode=${stock.barcode}, qty=${stock.quantity}`);
        return sendSuccess(res, {
          ...stock.toObject(),
          itemName: item?.itemName || 'Unknown',
          itemCode: item?.itemCode || '',
          type: item?.type || 'GARMENT',
          sku: variant?.sku || variant?.barcode || code,
          size: variant?.size || '-',
          color: variant?.color || item?.shade || '-',
          rate: variant?.mrp || item?.mrp || item?.salePrice || 0,
          mrp: variant?.mrp || item?.mrp || item?.salePrice || 0,
          gstPercent: item?.gstPercent || item?.hsCodeId?.gstPercent || 0,
          hsnCode: item?.hsCodeId?.code || item?.hsnCode || ''
        }, 'Item scanned successfully');
      }

      // ─── STRATEGY 2: Match on sizes.sku or sizes.barcode in Item, then find stock ───
      let item = await Item.findOne({
        $or: [
          { "sizes.barcode": codeRegex },
          { "sizes.sku": codeRegex }
        ]
      }).populate('hsCodeId');

      if (item) {
        const variant = item.sizes.find(sz =>
          (sz.barcode && sz.barcode.toLowerCase() === code.toLowerCase()) ||
          (sz.sku && sz.sku.toLowerCase() === code.toLowerCase())
        );
        const variantId = variant?._id?.toString();

        stock = await WarehouseInventory.findOne({
          warehouseId,
          $or: [
            ...(variantId ? [{ variantId }] : []),
            { barcode: codeRegex }
          ]
        }).populate({ path: 'itemId', populate: { path: 'hsCodeId' } });

        if (stock) {
          console.log(`[SCAN] STRATEGY 2 matched via Item sizes: qty=${stock.quantity}`);
          return sendSuccess(res, {
            ...stock.toObject(),
            itemName: item.itemName,
            itemCode: item.itemCode,
            type: item.type,
            sku: variant?.sku || variant?.barcode || code,
            size: variant?.size || '-',
            color: variant?.color || item.shade || '-',
            rate: variant?.mrp || item.mrp || item.salePrice || 0,
            mrp: variant?.mrp || item.mrp || item.salePrice || 0,
            gstPercent: item.gstPercent || item.hsCodeId?.gstPercent || 0,
            hsnCode: item.hsCodeId?.code || item.hsnCode || ''
          }, 'Item scanned successfully');
        }
      }

      // ─── STRATEGY 3: itemCode only (no size specified) — return first available variant ───
      item = await Item.findOne({ itemCode: codeRegex }).populate('hsCodeId');
      console.log(`[SCAN] STRATEGY 3 (itemCode scan): item=${item ? item.itemName : 'NOT FOUND'}`);

      if (item) {
        // Get all warehouse stock records for this item
        const allStocks = await WarehouseInventory.find({
          warehouseId,
          itemId: item._id
        }).lean();

        console.log(`[SCAN] Found ${allStocks.length} stock records for item ${item.itemCode}`);

        if (allStocks.length === 0) {
          return sendNotFound(res, `Item "${code}" hai lekin is warehouse mein stock nahi hai.`);
        }

        // Pick the first available stock
        const firstStock = allStocks[0];
        const variant = item.sizes?.find(sz =>
          sz._id.toString() === firstStock.variantId ||
          (sz.barcode && sz.barcode === firstStock.barcode) ||
          (sz.sku && sz.sku === firstStock.barcode)
        );

        return sendSuccess(res, {
          ...firstStock,
          itemId: item,
          itemName: item.itemName,
          itemCode: item.itemCode,
          type: item.type,
          sku: variant?.sku || firstStock.barcode,
          size: variant?.size || '-',
          color: variant?.color || item.shade || '-',
          rate: variant?.mrp || item.mrp || item.salePrice || 0,
          mrp: variant?.mrp || item.mrp || item.salePrice || 0,
          gstPercent: item.gstPercent || item.hsCodeId?.gstPercent || 0,
          hsnCode: item.hsCodeId?.code || item.hsnCode || ''
        }, 'Item scanned successfully');
      }

      // ─── Not found anywhere ───
      console.log(`[SCAN] NOT FOUND: code="${code}", warehouseId=${warehouseId}`);
      return sendNotFound(res, `Item "${code}" warehouse mein nahi mila. Sahi barcode scan karein.`);

    } catch (e) {
      console.error('[SCAN ERROR]', e);
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
