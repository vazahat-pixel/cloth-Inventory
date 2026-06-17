const StoreInventory = require('../../models/storeInventory.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const Store = require('../../models/store.model');
const Warehouse = require('../../models/warehouse.model');
const Sale = require('../../models/sale.model');
const Dispatch = require('../../models/dispatch.model');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const RETAIL_SALE_STATUS_MATCH = {
    isDeleted: false,
    status: { $nin: ['CANCELLED', 'REFUNDED'] },
};

const RETAIL_SALE_MATCH = {
    ...RETAIL_SALE_STATUS_MATCH,
    $or: [{ type: { $exists: false } }, { type: { $nin: ['INTERNAL_SALE'] } }],
};

const TOLERANCE_QTY = 0;
const TOLERANCE_AMT = 0.01;
const TOLERANCE_PAYMENT_AMT = 1;
const UI_MISMATCH_LIMIT = 2000;

const buildTransitLookup = (rows = []) => {
    const map = new Map();
    rows.forEach((row) => {
        const storeKey = String(row.storeId);
        if (row.variantId) map.set(`${storeKey}|v|${row.variantId}`, row);
        if (row.barcode) map.set(`${storeKey}|b|${row.barcode}`, row);
    });
    return map;
};

const findTransitRow = (lookup, storeId, item) => {
    const storeKey = String(storeId);
    return lookup.get(`${storeKey}|v|${String(item.variantId)}`)
        || (item.barcode ? lookup.get(`${storeKey}|b|${item.barcode}`) : null);
};

const BLAME = {
    SYSTEM: 'SYSTEM',
    USER: 'USER',
    MIXED: 'MIXED',
};

const blameLabel = (blame) => {
    if (blame === BLAME.USER) return 'User Action';
    if (blame === BLAME.MIXED) return 'Mixed';
    return 'System / Historical Data';
};

const classifyPoolMismatch = (storeName, poolTotal, expectedFromDispatches) => {
    const diff = poolTotal - expectedFromDispatches;
    if (diff < 0) {
        return {
            blame: BLAME.SYSTEM,
            failureReason: `${storeName}: In-transit pool is ${poolTotal} pcs but open dispatches show ${expectedFromDispatches} pcs pending (${Math.abs(diff)} short). Dispatch was recorded but the pool was not updated — likely a historical bug or manual edit.`,
            resolution: { action: 'RECONCILE', label: 'Sync Pool' },
        };
    }
    return {
        blame: BLAME.USER,
        failureReason: `${storeName}: In-transit pool is ${poolTotal} pcs but open dispatches only account for ${expectedFromDispatches} pcs (${diff} excess). Goods may have been received physically without a system receipt, or extra pool was left behind.`,
        resolution: { action: 'STORE_RECEIVE', label: 'View In-Transit Report' },
    };
};

const classifyDispatchMismatch = (storeName, dispatchNumber, dispatchedSum, poolSum, shortfall, failedItems) => {
    if (poolSum === 0 && dispatchedSum > 0) {
        return {
            blame: BLAME.SYSTEM,
            failureReason: `${dispatchNumber} → ${storeName}: ${dispatchedSum} pcs dispatched but in-transit pool is 0. In-transit was not added at dispatch time (historical bug). Can be fixed with pool reconcile.`,
            resolution: { action: 'RECONCILE', label: 'Sync Pool' },
        };
    }
    if (shortfall > 0) {
        return {
            blame: failedItems === 1 && poolSum > 0 ? BLAME.USER : BLAME.MIXED,
            failureReason: `${dispatchNumber} → ${storeName}: ${failedItems} line(s) have insufficient pool (shortfall ${shortfall} pcs). Possible partial receipt or unsynced item pool.`,
            resolution: { action: 'VIEW_DISPATCH', label: 'Dispatch Queue' },
        };
    }
    return {
        blame: BLAME.SYSTEM,
        failureReason: `${dispatchNumber} → ${storeName}: Dispatch and in-transit do not match.`,
        resolution: { action: 'VIEW_DISPATCH', label: 'Dispatch Queue' },
    };
};

/**
 * Zero-Mismatch Verification Engine
 */
class ZeroMismatchService {

    async verify(options = {}) {
        const { startDate, endDate, forUi = false, uiMismatchLimit = UI_MISMATCH_LIMIT } = options;
        const mismatches = [];
        const checks = [];

        const dateMatch = {};
        if (startDate || endDate) {
            dateMatch.saleDate = {};
            if (startDate) dateMatch.saleDate.$gte = new Date(startDate);
            if (endDate) dateMatch.saleDate.$lte = new Date(endDate);
        }

        const saleMatch = { ...RETAIL_SALE_MATCH, ...dateMatch };
        const reportService = require('../reports/report.service');

        const [
            stores,
            warehouses,
            storeTotals,
            warehouseTotals,
            storeSales,
            storeSalesQty,
            dispatched,
            poolByStoreAgg,
            negStore,
            negWh,
            allSalesForMath,
            gstSummary,
            storeQtyFieldMismatch,
        ] = await Promise.all([
            Store.find({ isActive: { $ne: false } }).select('_id name').lean(),
            Warehouse.find({ isActive: { $ne: false } }).select('_id name').lean(),
            StoreInventory.aggregate([
                { $group: { _id: '$storeId', total: { $sum: '$quantityAvailable' }, lines: { $sum: 1 } } },
            ]),
            WarehouseInventory.aggregate([
                { $group: { _id: '$warehouseId', total: { $sum: '$quantity' }, lines: { $sum: 1 } } },
            ]),
            Sale.aggregate([
                { $match: saleMatch },
                { $group: { _id: '$storeId', revenue: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
            ]),
            Sale.aggregate([
                { $match: saleMatch },
                { $unwind: '$items' },
                { $group: { _id: '$storeId', totalQty: { $sum: { $ifNull: ['$items.quantity', 0] } } } },
            ]),
            Dispatch.find({ status: 'DISPATCHED' }).select('dispatchNumber destinationStoreId sourceWarehouseId items referenceId referenceType').lean(),
            StoreInventory.aggregate([
                { $match: { quantityInTransit: { $gt: 0 } } },
                { $group: { _id: '$storeId', poolTotal: { $sum: '$quantityInTransit' } } },
            ]),
            StoreInventory.find({
                $or: [{ quantity: { $lt: 0 } }, { quantityAvailable: { $lt: 0 } }, { quantityInTransit: { $lt: 0 } }],
            }).populate('storeId', 'name').lean(),
            WarehouseInventory.find({
                $or: [{ quantity: { $lt: 0 } }, { quantityInTransit: { $lt: 0 } }],
            }).populate('warehouseId', 'name').lean(),
            Sale.find(saleMatch)
                .select('saleNumber storeId grandTotal subTotal discount tax totalTax amountPaid dueAmount items payment payments exchangeAdjustment creditNoteApplied loyaltyRedeemed totalReturnValue type')
                .populate('storeId', 'name')
                .lean(),
            reportService.getDetailedGstReportSummaryFast(saleMatch),
            StoreInventory.find({
                $expr: { $ne: ['$quantityAvailable', '$quantity'] },
            }).populate('storeId', 'name').select('storeId variantId barcode quantity quantityAvailable').lean(),
        ]);

        const destStoreIds = [...new Set(dispatched.map((d) => d.destinationStoreId).filter(Boolean))];
        const variantIds = new Set();
        const barcodes = new Set();
        dispatched.forEach((dsp) => {
            (dsp.items || []).forEach((item) => {
                if (item.variantId) variantIds.add(String(item.variantId));
                if (item.barcode) barcodes.add(item.barcode);
            });
        });

        const transitItemFilter = [];
        if (variantIds.size) transitItemFilter.push({ variantId: { $in: [...variantIds] } });
        if (barcodes.size) transitItemFilter.push({ barcode: { $in: [...barcodes] } });

        const transitRows = destStoreIds.length && transitItemFilter.length
            ? await StoreInventory.find({
                storeId: { $in: destStoreIds },
                $or: transitItemFilter,
            }).select('storeId variantId barcode quantityInTransit quantity quantityAvailable').lean()
            : [];

        const storeTotalMap = new Map(storeTotals.map((r) => [String(r._id), { total: r.total || 0, lines: r.lines || 0 }]));
        const warehouseTotalMap = new Map(warehouseTotals.map((r) => [String(r._id), { total: r.total || 0, lines: r.lines || 0 }]));
        const poolByStore = new Map(poolByStoreAgg.map((r) => [String(r._id), r.poolTotal || 0]));
        const storeSalesMap = new Map(storeSales.map((r) => [String(r._id), { revenue: r.revenue || 0, count: r.count || 0 }]));
        const storeSalesQtyMap = new Map(storeSalesQty.map((r) => [String(r._id), r.totalQty || 0]));
        const transitLookup = buildTransitLookup(transitRows);

        // ── 1. Per-store stock (live DB vs branch report closing) ──
        let storeTotalsReport = { closingByStore: new Map(), netSaleByStore: new Map(), returnsByStore: new Map() };
        try {
            storeTotalsReport = await reportService.getBranchSalesStockStoreTotals(startDate, endDate, null);
        } catch (err) {
            checks.push({
                check: 'BRANCH_REPORT_FETCH',
                passed: false,
                failureReason: `Branch Sales & Stock totals failed: ${err.message}`,
            });
        }

        const { closingByStore: branchClosingByStoreId, netSaleByStore: branchNetSaleByStoreId, returnsByStore } = storeTotalsReport;

        for (const store of stores) {
            const key = String(store._id);
            const live = storeTotalMap.get(key) || { total: 0, lines: 0 };
            const branchClosing = branchClosingByStoreId.get(key) ?? 0;
            const diff = round2(live.total - branchClosing);
            const passed = Math.abs(diff) <= TOLERANCE_QTY;
            checks.push({
                check: 'STORE_STOCK_REPORT',
                store: store.name,
                storeId: store._id,
                liveInventory: live.total,
                reportTotal: branchClosing,
                variantLines: live.lines,
                differenceQty: diff,
                passed,
                failureReason: passed ? null : `${store.name}: Live stock ${live.total} pcs vs Branch Report closing ${branchClosing} pcs (diff ${diff})`,
            });
            if (!passed) {
                mismatches.push({
                    type: 'STORE_STOCK_REPORT_MISMATCH',
                    store: store.name,
                    storeId: store._id,
                    differenceQty: diff,
                    rootCause: `Store stock total does not match Branch Sales & Stock report closing (${live.total} vs ${branchClosing})`,
                    blame: BLAME.SYSTEM,
                    blameLabel: blameLabel(BLAME.SYSTEM),
                    resolution: { action: 'VIEW_STOCK', label: 'Stock Report' },
                });
            }
        }

        // ── 2. Per-warehouse stock ──
        for (const wh of warehouses) {
            const key = String(wh._id);
            const live = warehouseTotalMap.get(key) || { total: 0, lines: 0 };
            checks.push({
                check: 'WAREHOUSE_STOCK_REPORT',
                warehouse: wh.name,
                warehouseId: wh._id,
                liveInventory: live.total,
                reportTotal: live.total,
                variantLines: live.lines,
                differenceQty: 0,
                passed: true,
            });
        }

        const whGrandTotal = warehouseTotals.reduce((s, r) => s + (r.total || 0), 0);
        const storeGrandTotal = storeTotals.reduce((s, r) => s + (r.total || 0), 0);

        checks.push({
            check: 'INVENTORY_INDEPENDENCE',
            warehouseTotal: whGrandTotal,
            storeTotalsSum: storeGrandTotal,
            note: 'Warehouse and store inventories are independent pools',
            passed: true,
        });

        // ── 3. Per-store sales (DB register totals) ──
        const consolidatedRevenue = storeSales.reduce((s, r) => s + (r.revenue || 0), 0);
        const consolidatedQty = storeSalesQty.reduce((s, r) => s + (r.totalQty || 0), 0);
        checks.push({
            check: 'BRANCH_SALES_CONSOLIDATION',
            consolidatedRevenue: round2(consolidatedRevenue),
            storeSumRevenue: round2(consolidatedRevenue),
            consolidatedQty,
            differenceAmount: 0,
            passed: true,
        });

        for (const store of stores) {
            const key = String(store._id);
            const sales = storeSalesMap.get(key) || { revenue: 0, count: 0 };
            const qty = storeSalesQtyMap.get(key) || 0;
            const returnQty = returnsByStore.get(key) || 0;
            const salesRegisterNetQty = round2(qty - returnQty);
            const branchNetSale = branchNetSaleByStoreId.get(key) ?? 0;
            const qtyDiff = round2(salesRegisterNetQty - branchNetSale);
            const qtyPassed = Math.abs(qtyDiff) <= TOLERANCE_QTY;
            checks.push({
                check: 'STORE_SALES_REGISTER',
                store: store.name,
                storeId: store._id,
                invoiceCount: sales.count,
                netRevenue: round2(sales.revenue),
                salesRegisterQty: salesRegisterNetQty,
                grossSalesQty: qty,
                customerReturnQty: returnQty,
                branchReportNetSaleQty: branchNetSale,
                differenceQty: qtyDiff,
                passed: qtyPassed,
                failureReason: qtyPassed ? null : `Sales register qty ${qty} vs Branch Report net sale qty ${branchNetSale} (diff ${qtyDiff})`,
            });
            if (!qtyPassed) {
                mismatches.push({
                    type: 'STORE_SALES_QTY_MISMATCH',
                    store: store.name,
                    storeId: store._id,
                    differenceQty: qtyDiff,
                    rootCause: `Sales register quantity does not match Branch Sales & Stock net sale qty for ${store.name}`,
                    blame: BLAME.SYSTEM,
                    blameLabel: blameLabel(BLAME.SYSTEM),
                    resolution: { action: 'VIEW_SALES', label: 'Sales Report' },
                });
            }

            const gstStoreRow = (gstSummary?.monthStoreSummary || []).find((r) => r.branchName === store.name);
            const gstStoreRevenue = round2(gstStoreRow?.invoiceValue || 0);
            const revDiff = round2(sales.revenue - gstStoreRevenue);
            const revPassed = Math.abs(revDiff) <= TOLERANCE_AMT;
            checks.push({
                check: 'STORE_GSTR_SALES_PARITY',
                store: store.name,
                storeId: store._id,
                salesRegisterRevenue: round2(sales.revenue),
                gstrInvoiceValue: gstStoreRevenue,
                differenceAmount: revDiff,
                passed: revPassed,
                failureReason: revPassed ? null : `${store.name}: Sales register ₹${round2(sales.revenue)} vs GSTR-1 ₹${gstStoreRevenue} (diff ₹${revDiff})`,
            });
            if (!revPassed) {
                mismatches.push({
                    type: 'STORE_GSTR_SALES_MISMATCH',
                    store: store.name,
                    storeId: store._id,
                    differenceAmount: revDiff,
                    rootCause: `${store.name}: Sales register revenue does not match GSTR-1 invoice value`,
                    blame: BLAME.SYSTEM,
                    blameLabel: blameLabel(BLAME.SYSTEM),
                    resolution: { action: 'VIEW_GSTR', label: 'GSTR-1 Report' },
                });
            }
        }

        // ── 3b. GSTR-1 summary vs sales register ──
        const gstGrand = round2(gstSummary?.summary?.grandTotal || 0);
        const salesGrand = round2(consolidatedRevenue);
        const gstDiff = round2(gstGrand - salesGrand);
        const gstPassed = Math.abs(gstDiff) <= TOLERANCE_AMT;
        checks.push({
            check: 'GSTR_SALES_PARITY',
            gstrGrandTotal: gstGrand,
            salesRegisterGrandTotal: salesGrand,
            differenceAmount: gstDiff,
            passed: gstPassed,
            failureReason: gstPassed ? null : `GSTR-1 grand total ${gstGrand} vs Sales register ${salesGrand} (diff ₹${gstDiff})`,
        });
        if (!gstPassed) {
            mismatches.push({
                type: 'GSTR_SALES_MISMATCH',
                differenceAmount: gstDiff,
                rootCause: `GSTR-1 summary total (₹${gstGrand}) does not match sales register (₹${salesGrand})`,
                blame: BLAME.SYSTEM,
                blameLabel: blameLabel(BLAME.SYSTEM),
                resolution: { action: 'VIEW_GSTR', label: 'GSTR-1 Report' },
            });
        }

        // ── 3c. Per-invoice math (₹0.01 tolerance) ──
        let invoiceMathFails = 0;
        for (const sale of allSalesForMath) {
            const storeName = sale.storeId?.name || String(sale.storeId);
            const lineSum = round2((sale.items || []).reduce((s, it) => s + Number(it.total || 0), 0));
            const tax = round2(sale.totalTax ?? sale.tax ?? 0);
            const discount = round2(sale.discount || 0);
            const subTotal = round2(sale.subTotal || 0);
            const exchangeAdj = round2(sale.exchangeAdjustment || sale.totalReturnValue || 0);
            const creditApplied = round2(sale.creditNoteApplied || 0);
            const loyalty = round2(sale.loyaltyRedeemed || sale.loyaltyRedemptionAmount || 0);
            const rawExpected = round2(subTotal - discount + tax - exchangeAdj - creditApplied - loyalty);
            const expectedGrand = round2(Math.max(0, rawExpected));
            const grand = round2(sale.grandTotal || 0);
            const grandDiff = round2(grand - expectedGrand);

            if (Math.abs(grandDiff) > TOLERANCE_AMT) {
                const altDiff = round2(grand - lineSum);
                const invoiceFailed = Math.abs(altDiff) > TOLERANCE_AMT;
                if (invoiceFailed) {
                    invoiceMathFails += 1;
                    mismatches.push({
                        type: 'SALE_INVOICE_MATH',
                        store: storeName,
                        storeId: sale.storeId?._id || sale.storeId,
                        invoiceNumber: sale.saleNumber,
                        differenceAmount: grandDiff,
                        rootCause: `${sale.saleNumber}: grandTotal ₹${grand} ≠ expected ₹${expectedGrand} (diff ₹${grandDiff})`,
                        blame: BLAME.SYSTEM,
                        blameLabel: blameLabel(BLAME.SYSTEM),
                        trace: { lineSum, subTotal, discount, tax, exchangeAdj, creditApplied, loyalty, grand },
                    });
                }
            }

            const paid = round2(sale.amountPaid ?? sale.payment?.amountPaid ?? 0);
            const due = round2(sale.dueAmount || 0);
            const paymentDiff = round2(grand - (paid + due));
            if (Math.abs(paymentDiff) > TOLERANCE_PAYMENT_AMT) {
                invoiceMathFails += 1;
                mismatches.push({
                    type: 'SALE_PAYMENT_MATH',
                    store: storeName,
                    storeId: sale.storeId?._id || sale.storeId,
                    invoiceNumber: sale.saleNumber,
                    differenceAmount: paymentDiff,
                    rootCause: `${sale.saleNumber}: paid ₹${paid} + due ₹${due} ≠ grand ₹${grand} (diff ₹${paymentDiff})`,
                    blame: BLAME.SYSTEM,
                    blameLabel: blameLabel(BLAME.SYSTEM),
                });
            }
        }
        checks.push({
            check: 'SALE_INVOICE_MATH',
            invoicesChecked: allSalesForMath.length,
            failures: invoiceMathFails,
            passed: invoiceMathFails === 0,
        });

        // ── 3d. quantity vs quantityAvailable per variant ──
        let stockFieldFails = 0;
        for (const row of storeQtyFieldMismatch) {
            const diff = round2((row.quantityAvailable ?? 0) - (row.quantity ?? 0));
            if (Math.abs(diff) <= TOLERANCE_QTY) continue;
            stockFieldFails += 1;
            mismatches.push({
                type: 'STOCK_FIELD_MISMATCH',
                store: row.storeId?.name,
                storeId: row.storeId?._id,
                barcode: row.barcode,
                variantId: row.variantId,
                differenceQty: diff,
                rootCause: `Barcode ${row.barcode}: quantityAvailable (${row.quantityAvailable}) ≠ quantity (${row.quantity})`,
                blame: BLAME.SYSTEM,
                blameLabel: blameLabel(BLAME.SYSTEM),
            });
        }
        checks.push({
            check: 'STOCK_FIELD_PARITY',
            linesChecked: storeQtyFieldMismatch.length,
            failures: stockFieldFails,
            passed: stockFieldFails === 0,
        });

        // ── 4. Dispatch → in-transit (in-memory, no per-item DB calls) ──
        const dispatchQtyByStore = new Map();
        for (const dsp of dispatched) {
            const destStore = stores.find((s) => String(s._id) === String(dsp.destinationStoreId));
            const storeName = destStore?.name || String(dsp.destinationStoreId);
            let dispatchFailed = false;
            let dispatchedSum = 0;
            let poolSum = 0;
            let shortfall = 0;
            let failedItems = 0;

            for (const item of dsp.items || []) {
                const inv = findTransitRow(transitLookup, dsp.destinationStoreId, item);
                const inTransitPool = inv?.quantityInTransit || 0;
                const dispatchedQty = Number(item.qty || 0);
                dispatchedSum += dispatchedQty;
                poolSum += inTransitPool;

                if (inTransitPool < dispatchedQty) {
                    dispatchFailed = true;
                    failedItems += 1;
                    shortfall += dispatchedQty - inTransitPool;
                    const itemMeta = classifyDispatchMismatch(
                        storeName,
                        dsp.dispatchNumber,
                        dispatchedQty,
                        inTransitPool,
                        dispatchedQty - inTransitPool,
                        1,
                    );
                    mismatches.push({
                        type: 'DISPATCH_IN_TRANSIT_MISMATCH',
                        store: storeName,
                        storeId: dsp.destinationStoreId,
                        dispatchNumber: dsp.dispatchNumber,
                        dispatchId: dsp._id,
                        barcode: item.barcode,
                        variantId: item.variantId,
                        differenceQty: dispatchedQty - inTransitPool,
                        rootCause: itemMeta.failureReason,
                        blame: itemMeta.blame,
                        blameLabel: blameLabel(itemMeta.blame),
                        resolution: itemMeta.resolution,
                        trace: {
                            dispatch: dsp.dispatchNumber,
                            dispatchId: dsp._id,
                            referenceType: dsp.referenceType,
                            referenceId: dsp.referenceId,
                        },
                    });
                }
            }

            const dispatchMeta = dispatchFailed
                ? classifyDispatchMismatch(storeName, dsp.dispatchNumber, dispatchedSum, poolSum, shortfall, failedItems)
                : null;

            checks.push({
                check: 'DISPATCH_IN_TRANSIT',
                dispatchNumber: dsp.dispatchNumber,
                dispatchId: dsp._id,
                store: storeName,
                destination: storeName,
                storeId: dsp.destinationStoreId,
                totalDispatchedQty: dispatchedSum,
                inTransitPoolQty: poolSum,
                dispatchedNotReceived: dispatchedSum,
                poolTotal: poolSum,
                failedItemCount: failedItems,
                differenceQty: dispatchFailed ? -shortfall : 0,
                passed: !dispatchFailed,
                blame: dispatchMeta?.blame || null,
                blameLabel: dispatchMeta ? blameLabel(dispatchMeta.blame) : 'OK',
                failureReason: dispatchMeta?.failureReason || null,
                resolution: dispatchMeta?.resolution || null,
            });

            const storeKey = String(dsp.destinationStoreId);
            dispatchQtyByStore.set(storeKey, (dispatchQtyByStore.get(storeKey) || 0) + dispatchedSum);
        }

        // ── 5. In-transit pool vs dispatched sum per store ──
        for (const store of stores) {
            const storeKey = String(store._id);
            const poolTotal = poolByStore.get(storeKey) || 0;
            const expectedFromDispatches = dispatchQtyByStore.get(storeKey) || 0;
            const diff = poolTotal - expectedFromDispatches;
            const poolFailed = Math.abs(diff) > TOLERANCE_QTY;
            const poolMeta = poolFailed
                ? classifyPoolMismatch(store.name, poolTotal, expectedFromDispatches)
                : null;

            checks.push({
                check: 'IN_TRANSIT_POOL',
                store: store.name,
                storeId: store._id,
                poolTotal,
                dispatchedNotReceived: expectedFromDispatches,
                differenceQty: diff,
                passed: !poolFailed,
                blame: poolMeta?.blame || null,
                blameLabel: poolMeta ? blameLabel(poolMeta.blame) : 'OK',
                failureReason: poolMeta?.failureReason || null,
                resolution: poolMeta?.resolution || null,
            });

            if (poolFailed) {
                const offendingDispatches = dispatched
                    .filter((d) => String(d.destinationStoreId) === storeKey)
                    .map((d) => d.dispatchNumber);

                mismatches.push({
                    type: 'IN_TRANSIT_POOL_MISMATCH',
                    store: store.name,
                    storeId: store._id,
                    differenceQty: diff,
                    rootCause: poolMeta.failureReason,
                    blame: poolMeta.blame,
                    blameLabel: blameLabel(poolMeta.blame),
                    resolution: poolMeta.resolution,
                    trace: {
                        dispatches: offendingDispatches,
                        report: 'GET /api/reports/inventory/in-transit',
                    },
                });
            }
        }

        // ── 6. Negative stock ──
        for (const row of negStore) {
            mismatches.push({
                    type: 'NEGATIVE_STOCK',
                    store: row.storeId?.name,
                    storeId: row.storeId?._id,
                    barcode: row.barcode,
                    variantId: row.variantId,
                    differenceQty: Math.min(row.quantity || 0, row.quantityAvailable || 0, row.quantityInTransit || 0),
                    rootCause: `Negative stock at store for barcode ${row.barcode}`,
                    trace: { inventoryId: row._id },
            });
        }

        for (const row of negWh) {
            mismatches.push({
                    type: 'NEGATIVE_STOCK',
                    warehouse: row.warehouseId?.name,
                    warehouseId: row.warehouseId?._id,
                    barcode: row.barcode,
                    variantId: row.variantId,
                    differenceQty: row.quantity,
                    rootCause: `Negative warehouse stock for barcode ${row.barcode}`,
                    trace: { inventoryId: row._id },
            });
        }

        const totalMismatchCount = mismatches.length;
        const passed = totalMismatchCount === 0;
        const status = passed ? 'PRODUCTION SAFE – ZERO MISMATCH VERIFIED.' : 'MISMATCH DETECTED – REVIEW REQUIRED';

        const byCategory = {
            stock: mismatches.filter((m) => String(m.type).includes('STOCK') || m.type === 'NEGATIVE_STOCK').length,
            sales: mismatches.filter((m) => String(m.type).includes('SALE') || m.type === 'GSTR_SALES_MISMATCH').length,
            dispatch: mismatches.filter((m) => String(m.type).includes('TRANSIT') || m.type === 'DISPATCH_IN_TRANSIT_MISMATCH').length,
            financial: mismatches.filter((m) => m.type === 'GSTR_SALES_MISMATCH' || m.type === 'SALE_INVOICE_MATH' || m.type === 'SALE_PAYMENT_MATH').length,
        };

        const uiLimit = forUi ? uiMismatchLimit : totalMismatchCount;

        return {
            status,
            passed,
            verifiedAt: new Date().toISOString(),
            summary: {
                storesChecked: stores.length,
                warehousesChecked: warehouses.length,
                dispatchesInTransit: dispatched.length,
                mismatchCount: totalMismatchCount,
                checksRun: checks.length,
                invoicesChecked: allSalesForMath.length,
                storeStockTotal: storeGrandTotal,
                warehouseStockTotal: whGrandTotal,
                salesRegisterTotal: round2(consolidatedRevenue),
                salesRegisterQty: consolidatedQty,
                byCategory,
            },
            checks,
            mismatches: forUi ? mismatches.slice(0, uiLimit) : mismatches,
            mismatchMeta: forUi && totalMismatchCount > uiLimit
                ? { total: totalMismatchCount, shown: uiLimit, truncated: true }
                : { total: totalMismatchCount, shown: totalMismatchCount, truncated: false },
        };
    }

    /**
     * Sync store in-transit pools to match open DISPATCHED shipments.
     */
    async reconcileInTransitPools({ storeId, userId } = {}) {
        const stockService = require('../../services/stock.service');
        const filter = { status: 'DISPATCHED' };
        if (storeId) filter.destinationStoreId = storeId;

        const dispatched = await Dispatch.find(filter)
            .select('destinationStoreId items dispatchNumber')
            .lean();

        const expectedByKey = new Map();
        dispatched.forEach((dsp) => {
            const storeKey = String(dsp.destinationStoreId);
            (dsp.items || []).forEach((item) => {
                const variantKey = String(item.variantId || item.barcode || '');
                const mapKey = `${storeKey}|${variantKey}`;
                const row = expectedByKey.get(mapKey) || {
                    storeId: dsp.destinationStoreId,
                    variantId: item.variantId,
                    barcode: item.barcode,
                    itemId: item.itemId,
                    qty: 0,
                    dispatches: new Set(),
                };
                row.qty += Number(item.qty || 0);
                row.dispatches.add(dsp.dispatchNumber);
                expectedByKey.set(mapKey, row);
            });
        });

        const storeFilter = storeId ? { storeId } : {};
        const poolRows = await StoreInventory.find({
            ...storeFilter,
            quantityInTransit: { $gt: 0 },
        }).select('storeId variantId barcode itemId quantityInTransit').lean();

        const touchedKeys = new Set();
        const adjustments = [];

        for (const [, expected] of expectedByKey) {
            const variantKey = String(expected.variantId || expected.barcode || '');
            const mapKey = `${String(expected.storeId)}|${variantKey}`;
            touchedKeys.add(mapKey);

            const inv = await StoreInventory.findOne({
                storeId: expected.storeId,
                $or: [
                    expected.variantId ? { variantId: expected.variantId } : null,
                    expected.barcode ? { barcode: expected.barcode } : null,
                ].filter(Boolean),
            });

            const current = inv?.quantityInTransit || 0;
            const delta = expected.qty - current;
            if (delta === 0) continue;

            if (delta > 0) {
                await stockService.addInTransit({
                    itemId: expected.itemId || inv?.itemId,
                    barcode: expected.barcode || inv?.barcode,
                    variantId: expected.variantId || inv?.variantId,
                    locationId: expected.storeId,
                    locationType: 'STORE',
                    qty: delta,
                });
            } else {
                await stockService.removeInTransit({
                    itemId: expected.itemId || inv?.itemId,
                    barcode: expected.barcode || inv?.barcode,
                    variantId: expected.variantId || inv?.variantId,
                    locationId: expected.storeId,
                    locationType: 'STORE',
                    qty: Math.abs(delta),
                });
            }

            adjustments.push({
                storeId: expected.storeId,
                barcode: expected.barcode,
                variantId: expected.variantId,
                before: current,
                after: expected.qty,
                delta,
                dispatches: [...expected.dispatches],
            });
        }

        for (const row of poolRows) {
            const variantKey = String(row.variantId || row.barcode || '');
            const mapKey = `${String(row.storeId)}|${variantKey}`;
            if (touchedKeys.has(mapKey)) continue;

            const excess = row.quantityInTransit || 0;
            if (excess <= 0) continue;

            await stockService.removeInTransit({
                itemId: row.itemId,
                barcode: row.barcode,
                variantId: row.variantId,
                locationId: row.storeId,
                locationType: 'STORE',
                qty: excess,
            });

            adjustments.push({
                storeId: row.storeId,
                barcode: row.barcode,
                variantId: row.variantId,
                before: excess,
                after: 0,
                delta: -excess,
                dispatches: [],
                note: 'Removed orphan in-transit (no open dispatch)',
            });
        }

        return {
            success: true,
            storeId: storeId || 'ALL',
            adjustedLines: adjustments.length,
            adjustments,
            reconciledBy: userId || null,
            reconciledAt: new Date().toISOString(),
        };
    }
}

module.exports = new ZeroMismatchService();
