const stockService = require('./stockLedger.service');
const auditService = require('./audit.service');
const zeroMismatchService = require('./zeroMismatch.service');
const physicalStockService = require('./physicalStock.service');
const { saveDailyReport, notifyAdmins, writeSystemLog } = require('../../jobs/dailyZeroMismatch.job');
const logger = require('../../config/logger');
const SystemLog = require('../../models/systemLog.model');
const ErrorLog = require('../../models/errorLog.model');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/response.handler');

class InventoryController {
  _handleError(res, e, fallbackStatus = 400) {
    let statusCode = e.statusCode || fallbackStatus;
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('not found') || msg.includes('nahi mila')) statusCode = 404;
    return sendError(res, e.message || 'Request failed', statusCode);
  }

  /**
   * Fetch stock ledger for a specific item.
   */
  getLedgerByItem = async (req, res) => {
    try {
      const { itemId } = req.params;
      const history = await stockService.getLedgerByItem(itemId);
      return sendSuccess(res, { history }, 'Stock ledger retrieved successfully');
    } catch (e) {
      return this._handleError(res, e);
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
      return this._handleError(res, e);
    }
  };

  /**
   * Universal logs route for Monitoring Page.
   */
  getSystemLogs = async (req, res) => {
    try {
      const { getPagination, buildPaginationMeta, getSort } = require('../../utils/pagination.helper');
      const { page, limit, skip } = getPagination(req.query);
      const { search, module, action, dateFrom, dateTo } = req.query;
      const filter = {};
      if (module && module !== 'all') filter.module = module;
      if (action && action !== 'all') filter.action = action;
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
      if (search) {
        filter.$or = [
          { action: { $regex: search, $options: 'i' } },
          { module: { $regex: search, $options: 'i' } },
        ];
      }
      const sort = getSort(req.query, { createdAt: 'createdAt', module: 'module', action: 'action' }, { createdAt: -1 });
      const [logs, total] = await Promise.all([
        SystemLog.find(filter).sort(sort).skip(skip).limit(limit).populate('userId', 'name'),
        SystemLog.countDocuments(filter),
      ]);
      const meta = buildPaginationMeta(total, page, limit);
      return sendSuccess(res, { logs, meta });
    } catch (e) {
      return this._handleError(res, e);
    }
  };

  getErrorLogs = async (req, res) => {
    try {
      const { getPagination, buildPaginationMeta } = require('../../utils/pagination.helper');
      const { page, limit, skip } = getPagination(req.query);
      const { search } = req.query;
      const filter = {};
      if (search) {
        filter.$or = [
          { message: { $regex: search, $options: 'i' } },
          { module: { $regex: search, $options: 'i' } },
        ];
      }
      const [errors, total] = await Promise.all([
        ErrorLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        ErrorLog.countDocuments(filter),
      ]);
      const meta = buildPaginationMeta(total, page, limit);
      return sendSuccess(res, { errors, meta });
    } catch (e) {
      return this._handleError(res, e);
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
      return this._handleError(res, e);
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
      return this._handleError(res, e);
    }
  };

  /**
   * ZERO-MISMATCH VERIFICATION — full inventory architecture audit
   */
  getZeroMismatchVerification = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await zeroMismatchService.verify({ startDate, endDate, forUi: true });
      return sendSuccess(res, report, report.status);
    } catch (e) {
      return this._handleError(res, e);
    }
  };

  runZeroMismatchVerification = async (req, res) => {
    try {
      const report = await zeroMismatchService.verify();
      const total = report.mismatches?.length || 0;
      const UI_LIMIT = 150;
      const uiReport = {
        status: report.status,
        passed: report.passed,
        verifiedAt: report.verifiedAt,
        summary: report.summary,
        checks: report.checks,
        mismatches: (report.mismatches || []).slice(0, UI_LIMIT),
        mismatchMeta: {
          total,
          shown: Math.min(total, UI_LIMIT),
          truncated: total > UI_LIMIT,
        },
      };

      sendSuccess(res, uiReport, uiReport.status);

      setImmediate(() => {
        Promise.resolve()
          .then(() => saveDailyReport(report))
          .then(() => notifyAdmins(report))
          .then(() => writeSystemLog(report))
          .catch((err) => {
            logger.error(`[DailyVerify] Post-response save/notify failed: ${err.message}`);
          });
      });
    } catch (e) {
      logger.error(`[DailyVerify] Run failed: ${e.message}`, { stack: e.stack });
      return this._handleError(res, e);
    }
  };

  reconcileInTransitPools = async (req, res) => {
    try {
      const { storeId } = req.body || {};
      const result = await zeroMismatchService.reconcileInTransitPools({
        storeId,
        userId: req.user?._id,
      });
      return sendSuccess(res, result, `In-transit pool synced (${result.adjustedLines} line(s) adjusted)`);
    } catch (e) {
      logger.error(`[DailyVerify] Reconcile failed: ${e.message}`, { stack: e.stack });
      return this._handleError(res, e);
    }
  };

  getPhysicalVsActualStock = async (req, res) => {
    try {
      const { warehouseId, search, page, limit } = req.query;
      if (!warehouseId) {
        return sendError(res, 'warehouseId is required', 400);
      }
      const report = await physicalStockService.getWarehousePhysicalReport(warehouseId, {
        search,
        page,
        limit,
      });
      return sendSuccess(res, report, 'Physical vs actual stock report loaded');
    } catch (e) {
      return this._handleError(res, e);
    }
  };

  applyPhysicalVsActualStock = async (req, res) => {
    try {
      const { warehouseId, items } = req.body || {};
      if (!warehouseId || !Array.isArray(items)) {
        return sendError(res, 'warehouseId and items array are required', 400);
      }
      const changedItems = items.filter((item) => Number(item.physicalQty) !== Number(item.systemQty));
      if (!changedItems.length) {
        return sendSuccess(res, { adjustedLines: 0, adjustments: [] }, 'No changes to apply');
      }
      const result = await physicalStockService.applyWarehousePhysicalStock(
        warehouseId,
        changedItems,
        req.user?._id,
      );
      return sendSuccess(res, result, `Warehouse stock updated (${result.adjustedLines} line(s))`);
    } catch (e) {
      logger.error(`[PhysicalStock] Apply failed: ${e.message}`, { stack: e.stack });
      return this._handleError(res, e);
    }
  };

  getLatestDailyVerification = async (req, res) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const latestPath = path.join(__dirname, '../../../reports/daily/latest.json');
      if (!fs.existsSync(latestPath)) {
        return sendSuccess(res, { report: null }, 'No daily verification run yet');
      }
      const report = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
      return sendSuccess(res, { report }, 'Latest daily verification loaded');
    } catch (e) {
      return this._handleError(res, e);
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
      return this._handleError(res, e);
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
      return this._handleError(res, e);
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
      return this._handleError(res, e);
    }
  };
}

module.exports = new InventoryController();
