const DeliveryChallan = require('../../models/deliveryChallan.model');
const Sale = require('../../models/sale.model');
const Warehouse = require('../../models/warehouse.model');
const Store = require('../../models/store.model');
const { withTransaction } = require('../../services/transaction.service');
const challanService = require('../deliveryChallan/deliveryChallan.service');
const salesService = require('../sales/sales.service');
const { DocumentType } = require('../../core/enums');

const Dispatch = require('../../models/dispatch.model');
const Item = require('../../models/item.model');
const { getNextSequence } = require('../../services/sequence.service');

// Correct path — stock.service is in ../../services/
const stockService = require('../../services/stock.service');

/* ─────────────────────────────────────────────
   Helper: Populate item details onto dispatch items array
   Works with both lean objects and Mongoose docs
───────────────────────────────────────────── */
const populateDispatchItemsManual = async (dispatches) => {
    const isSingle = !Array.isArray(dispatches);
    const docs = isSingle ? [dispatches] : dispatches;

    for (const doc of docs) {
        if (!doc.items || doc.items.length === 0) continue;

        const variantIds = doc.items.map(i => {
            const v = i.variantId?._id || i.variantId;
            return v ? String(v) : null;
        }).filter(Boolean);

        const items = await Item.find({ "sizes._id": { $in: variantIds } })
            .populate('brand', 'name brandName')
            .populate('groupIds', 'name groupType groupName')
            .lean();

        doc.items = (doc.items || []).map(di => {
            const vid = String(di.variantId?._id || di.variantId);
            const parentItem = items.find(it => (it.sizes || []).some(sz => String(sz._id) === vid));

            if (parentItem) {
                const variant = (parentItem.sizes || []).find(sz => String(sz._id) === vid);
                return {
                    ...di.toObject ? di.toObject() : di,
                    variantId: {
                        _id: variant._id,
                        itemId: parentItem._id,
                        itemName: parentItem.itemName,
                        itemCode: parentItem.itemCode,
                        sku: variant.sku || parentItem.itemCode,
                        barcode: variant.barcode || variant.sku || parentItem.itemCode,
                        size: variant.size,
                        color: variant.color || parentItem.shade || 'N/A'
                    }
                };
            }
            return di;
        });
    }

    return isSingle ? docs[0] : docs;
};

/* ─────────────────────────────────────────────
   Helper: Resolve barcode + itemId for a variant
   Returns { barcode, itemId, itemDoc, variant }
───────────────────────────────────────────── */
const resolveVariantInfo = async (variantId, session) => {
    const vid = variantId?._id || variantId;
    const itemDoc = await Item.findOne({ "sizes._id": vid }).session(session);
    if (!itemDoc) throw new Error(`Item not found for variantId: ${vid}`);
    const variant = (itemDoc.sizes || []).find(sz => String(sz._id) === String(vid));
    if (!variant) throw new Error(`Variant not found: ${vid}`);
    const barcode = variant.sku || variant.barcode || itemDoc.itemCode;
    return { barcode, itemId: itemDoc._id, itemDoc, variant };
};

/* ─────────────────────────────────────────────
   CREATE DISPATCH
   PENDING → saves as Sale Challan Draft, no stock movement
   SENT    → saves as Sale Bill, deducts warehouse stock, adds in-transit to store
───────────────────────────────────────────── */
const createDispatch = async (dispatchData, userId) => {
    return await withTransaction(async (session) => {
        const { sourceId, sourceWarehouseId, destinationStoreId, products, items, ...rest } = dispatchData;
        const finalSourceId = sourceId || sourceWarehouseId;
        const finalProducts = items || products || [];

        const isDraft = rest.status === 'DRAFT' || rest.status === 'PENDING';

        // 1. Resolve source and destination entities
        const source = await Warehouse.findById(finalSourceId).session(session)
            || await Store.findById(finalSourceId).session(session);
        const destination = await Store.findById(destinationStoreId).session(session);

        if (!source) throw new Error('Source warehouse/store not found');
        if (!destination) throw new Error('Destination store not found');

        const sourceGst = (source.gstNumber || '').trim().toUpperCase();
        const destGst = (destination.gstNumber || '').trim().toUpperCase();
        const isSameEntity = sourceGst === destGst;
        const transferDiscountPct = destination.transferDiscountPct || 0;

        // 2. Prepare Detailed Items (Using Item Master Sizes)
        const { calculateGST } = require('../../services/gst.service');
        const enrichedItems = [];
        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        for (const p of finalProducts) {
            const variantId = p.variantId || p.productId;
            if (!variantId) throw new Error("Item variant ID missing in request");

            const itemDoc = await Item.findOne({ "sizes._id": variantId })
                .populate('hsCodeId')
                .session(session);

            if (!itemDoc) throw new Error(`Item master record not found for variant ID: ${variantId}`);

            const variant = itemDoc.sizes.id(variantId);
            if (!variant) throw new Error(`Variant not found in Item Master: ${variantId}`);

            const baseRate = p.mrp || p.rate || variant.mrp || itemDoc.salePrice || 0;
            const discountedRate = Number((baseRate * (1 - transferDiscountPct / 100)).toFixed(2));
            const lineSubTotal = discountedRate * p.quantity;

            let taxData = { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
            const gstPct = itemDoc.gstPercent || itemDoc.hsCodeId?.gstPercent || 0;

            if (!isSameEntity && !isDraft) {
                if (gstPct > 0) {
                    const isIntraState = (source.location?.state || '').toLowerCase() === (destination.location?.state || '').toLowerCase();
                    taxData = calculateGST(lineSubTotal, gstPct, isIntraState ? 'CGST_SGST' : 'IGST');
                }
            }

            const barcode = variant.sku || variant.barcode || itemDoc.itemCode;

            enrichedItems.push({
                itemId: itemDoc._id,
                variantId: variant._id,
                qty: p.quantity,
                barcode,
                rate: discountedRate,
                mrp: baseRate,
                taxPercentage: isDraft || isSameEntity ? 0 : gstPct,
                taxAmount: taxData.totalTax,
                total: lineSubTotal + taxData.totalTax,
                cgst: taxData.cgst,
                sgst: taxData.sgst,
                igst: taxData.igst,
                sku: barcode
            });

            totalSubTotal += lineSubTotal;
            totalTaxAmount += taxData.totalTax;
            totalCGST += taxData.cgst;
            totalSGST += taxData.sgst;
            totalIGST += taxData.igst;
        }

        // 3. Generate Billing Document ONLY IF DISPATCHED (NOT DRAFT)
        let generatedDoc = null;
        if (!isDraft) {
            if (isSameEntity) {
                const challan = await challanService.createChallan({
                    destinationStoreId,
                    sourceId: finalSourceId,
                    items: enrichedItems.map(ei => ({
                        itemId: ei.itemId,
                        variantId: ei.variantId,
                        barcode: ei.barcode,
                        quantity: ei.qty,
                        rate: ei.rate
                    })),
                    type: 'WAREHOUSE_TO_STORE',
                    totalValue: totalSubTotal,
                    notes: rest.notes || `Stock Transfer to ${destination.name}`
                }, userId, session);
                generatedDoc = { type: 'DeliveryChallan', id: challan._id, number: challan.dcNumber };
            } else {
                const sale = await salesService.createSale({
                    storeId: finalSourceId,
                    destinationStoreId,
                    products: enrichedItems.map(ei => ({
                        barcode: ei.sku,
                        productId: ei.variantId,
                        quantity: ei.qty,
                        rate: ei.rate,
                        mrp: ei.mrp,
                        taxAmount: ei.taxAmount,
                        taxPercentage: ei.taxPercentage,
                        total: ei.total,
                        cgst: ei.cgst, sgst: ei.sgst, igst: ei.igst
                    })),
                    type: 'INTERNAL_SALE',
                    subTotal: totalSubTotal,
                    totalTax: totalTaxAmount,
                    grandTotal: totalSubTotal + totalTaxAmount,
                    paymentMode: 'CREDIT',
                    notes: rest.notes || `Internal Sale Transfer: ${source.name} -> ${destination.name}`
                }, userId, session);
                generatedDoc = { type: 'Sale', id: sale._id, number: sale.saleNumber };
            }
        }

        // 4. Create Dispatch Record
        const sequence = await getNextSequence(`DISPATCH_${new Date().getFullYear()}`, session);
        const prefix = isDraft ? 'SCH' : 'DSP';
        const dispatchNumber = `${prefix}-${new Date().getFullYear()}-${sequence.toString().padStart(5, '0')}`;

        const dispatchMaster = new Dispatch({
            dispatchNumber,
            sourceWarehouseId: finalSourceId,
            destinationStoreId,
            items: enrichedItems,
            status: isDraft ? 'PENDING' : 'DISPATCHED',
            referenceId: generatedDoc?.id,
            referenceType: generatedDoc?.type,
            dispatchedAt: isDraft ? null : new Date(),
            notes: rest.notes,
            createdBy: userId
        });

        await dispatchMaster.save({ session });

        // 5. ⚡ INVENTORY MOVEMENT — Only for DISPATCHED (non-draft)
        //    Deduct from warehouse → add to in-transit at destination store
        if (!isDraft) {
            for (const ei of enrichedItems) {
                const barcode = ei.barcode;
                const itemId = ei.itemId;
                const variantId = ei.variantId;

                // A. Deduct physical stock from source warehouse
                await stockService.removeStock({
                    itemId,
                    barcode,
                    variantId,
                    locationId: finalSourceId,
                    locationType: 'WAREHOUSE',
                    qty: ei.qty,
                    type: 'TRANSFER',
                    referenceId: dispatchMaster._id,
                    referenceType: 'Dispatch',
                    performedBy: userId,
                    session
                });

                // B. Add to in-transit pool at destination store
                await stockService.addInTransit({
                    itemId,
                    barcode,
                    variantId,
                    locationId: destinationStoreId,
                    locationType: 'STORE',
                    qty: ei.qty,
                    session
                });
            }
        }

        return dispatchMaster;
    });
};

/* ─────────────────────────────────────────────
   UPDATE DISPATCH (Draft only)
───────────────────────────────────────────── */
const updateDispatch = async (id, dispatchData, userId) => {
    return await withTransaction(async (session) => {
        const dispatchMaster = await Dispatch.findById(id).session(session);
        if (!dispatchMaster) throw new Error('Dispatch record not found');
        if (dispatchMaster.status !== 'PENDING') throw new Error('Only Draft/Pending dispatches can be updated');

        const { items: newItems, products, notes, sourceId, destinationStoreId } = dispatchData;
        const finalProducts = newItems || products || [];

        // Resolve Entities for GST/Discount check
        const source = await Warehouse.findById(dispatchMaster.sourceWarehouseId).session(session)
            || await Store.findById(dispatchMaster.sourceWarehouseId).session(session);
        const destination = await Store.findById(dispatchMaster.destinationStoreId).session(session);

        if (!source || !destination) throw new Error('Source or destination not found');

        const sourceGst = (source.gstNumber || '').trim().toUpperCase();
        const destGst = (destination.gstNumber || '').trim().toUpperCase();
        const isSameEntity = sourceGst === destGst;
        const transferDiscountPct = destination.transferDiscountPct || 0;

        // Prepare new items with Prices
        const { calculateGST } = require('../../services/gst.service');
        const enrichedItems = [];
        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalCGST = 0, totalSGST = 0, totalIGST = 0;

        for (const p of finalProducts) {
            const variantId = p.variantId || p.productId;
            const itemDoc = await Item.findOne({ "sizes._id": variantId })
                .populate('hsCodeId')
                .session(session);

            if (!itemDoc) throw new Error(`Item master record not found during update for variant ID: ${variantId}`);
            const variant = itemDoc.sizes.id(variantId);

            const baseRate = p.mrp || p.rate || variant.mrp || itemDoc.salePrice || 0;
            const discountedRate = Number((baseRate * (1 - transferDiscountPct / 100)).toFixed(2));
            const qty = (p.quantity || p.qty || 0);
            const lineSubTotal = discountedRate * qty;

            let taxData = { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
            if (!isSameEntity) {
                const gstPct = itemDoc.gstPercent || itemDoc.hsCodeId?.gstPercent || 0;
                if (gstPct > 0) {
                    const isIntraState = (source.location?.state || '').toLowerCase() === (destination.location?.state || '').toLowerCase();
                    taxData = calculateGST(lineSubTotal, gstPct, isIntraState ? 'CGST_SGST' : 'IGST');
                }
            }

            const barcode = variant.sku || variant.barcode || itemDoc.itemCode;

            enrichedItems.push({
                itemId: itemDoc._id,
                variantId: variant._id,
                qty,
                barcode,
                rate: discountedRate,
                mrp: baseRate,
                taxPercentage: isSameEntity ? 0 : (itemDoc.gstPercent || itemDoc.hsCodeId?.gstPercent || 0),
                taxAmount: taxData.totalTax,
                total: lineSubTotal + taxData.totalTax,
                cgst: taxData.cgst, sgst: taxData.sgst, igst: taxData.igst,
                sku: barcode
            });

            totalSubTotal += lineSubTotal;
            totalTaxAmount += taxData.totalTax;
            totalCGST += taxData.cgst;
            totalSGST += taxData.sgst;
            totalIGST += taxData.igst;
        }

        // 3. Update parent Document
        const DeliveryChallan = require('../../models/deliveryChallan.model');
        const Sale = require('../../models/sale.model');

        if (dispatchMaster.referenceType === 'DeliveryChallan') {
            await DeliveryChallan.findByIdAndUpdate(dispatchMaster.referenceId, {
                vehicleNumber: vehicleNumber || dispatchMaster.vehicleNumber,
                driverName: driverName || dispatchMaster.driverName,
                notes: notes,
                items: enrichedItems.map(ei => ({
                    itemId: ei.itemId,
                    variantId: ei.variantId,
                    barcode: ei.barcode,
                    quantity: ei.qty,
                    rate: ei.rate
                })),
                totalValue: totalSubTotal
            }, { session });
        } else if (dispatchMaster.referenceType === 'Sale') {
            await Sale.findByIdAndUpdate(dispatchMaster.referenceId, {
                vehicleNumber: vehicleNumber || dispatchMaster.vehicleNumber,
                driverName: driverName || dispatchMaster.driverName,
                notes: notes,
                items: enrichedItems.map(ei => ({
                    productId: ei.variantId,
                    quantity: ei.qty,
                    barcode: ei.barcode,
                    rate: ei.rate,
                    mrp: ei.mrp,
                    taxAmount: ei.taxAmount,
                    taxPercentage: ei.taxPercentage,
                    total: ei.total,
                    cgst: ei.cgst,
                    sgst: ei.sgst,
                    igst: ei.igst
                })),
                subTotal: totalSubTotal,
                tax: totalTaxAmount,
                totalTax: totalTaxAmount,
                taxBreakup: {
                    cgst: totalCGST,
                    sgst: totalSGST,
                    igst: totalIGST
                },
                grandTotal: totalSubTotal + totalTaxAmount
            }, { session });
        }

        // 4. Update the Dispatch Master itself
        dispatchMaster.items = enrichedItems.map(ei => ({
            itemId: ei.itemId,
            variantId: ei.variantId,
            barcode: ei.barcode,
            qty: ei.qty,
            rate: ei.rate,
            tax: ei.qty > 0 ? (ei.taxAmount / ei.qty) : 0
        }));
        dispatchMaster.notes = notes || dispatchMaster.notes;
        await dispatchMaster.save({ session });

        return dispatchMaster;
    });
};

/* ─────────────────────────────────────────────
   CONFIRM DISPATCH (PENDING → DISPATCHED)
   Deducts warehouse stock, adds in-transit to store
───────────────────────────────────────────── */
const confirmDispatch = async (id, userId) => {
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch record not found');
        if (dispatch.status !== 'PENDING') throw new Error(`Cannot confirm dispatch with status: ${dispatch.status}`);

        // Process each item: deduct from warehouse, add to store in-transit
        for (const item of dispatch.items) {
            // Fallback for legacy dispatches missing itemId/barcode
            let itmId = item.itemId;
            let bcode = item.barcode;

            if (!itmId || !bcode) {
                const Item = require('../../models/item.model');
                const parent = await Item.findOne({ "sizes._id": item.variantId }).session(session);
                if (parent) {
                    itmId = itmId || parent._id;
                    const variant = parent.sizes.id(item.variantId);
                    bcode = bcode || (variant ? (variant.sku || variant.barcode || parent.itemCode) : 'UNKNOWN');
                }
            }

            // First release the logical reservation
            await stockService.releaseStock({
                variantId: item.variantId,
                locationId: dispatch.sourceWarehouseId,
                locationType: 'WAREHOUSE',
                qty: item.qty,
                session
            });

            // A. Deduct physical stock from source warehouse
            await stockService.removeStock({
                itemId: itmId,
                barcode: bcode,
                variantId: item.variantId,
                locationId: dispatch.sourceWarehouseId,
                locationType: 'WAREHOUSE',
                qty: item.qty,
                type: 'TRANSFER',
                referenceId: dispatch._id,
                referenceType: 'Dispatch',
                referenceId: dispatch._id,
                referenceType: 'Dispatch',
                performedBy: userId,
                session
            });

            // B. Add to in-transit pool at destination store
            await stockService.addInTransit({
                itemId: itmId,
                barcode: bcode,
                variantId: item.variantId,
                locationId: dispatch.destinationStoreId,
                locationType: 'STORE',
                qty: item.qty,
                session
            });
        }

        // Update Dispatch Status
        dispatch.status = 'DISPATCHED';
        dispatch.dispatchedAt = new Date();
        await dispatch.save({ session });

        // Update related billing document if exists
        if (dispatch.referenceType === 'DeliveryChallan' && dispatch.referenceId) {
            await DeliveryChallan.findByIdAndUpdate(dispatch.referenceId, { status: 'DISPATCHED' }, { session });
        } else if (dispatch.referenceType === 'Sale' && dispatch.referenceId) {
            await Sale.findByIdAndUpdate(dispatch.referenceId, { deliveryStatus: 'DISPATCHED' }, { session });
        }

        return dispatch;
    });
};

/* ─────────────────────────────────────────────
   CANCEL DISPATCH (PENDING only)
   Releases any reservations if applicable
───────────────────────────────────────────── */
const cancelDispatch = async (id, userId) => {
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch record not found');
        if (dispatch.status !== 'PENDING') throw new Error(`Only PENDING (Draft) dispatches can be cancelled. Current status: ${dispatch.status}`);

        dispatch.status = 'CANCELLED';
        await dispatch.save({ session });

        if (dispatch.referenceType === 'DeliveryChallan' && dispatch.referenceId) {
            await DeliveryChallan.findByIdAndUpdate(dispatch.referenceId, { status: 'CANCELLED' }, { session });
        } else if (dispatch.referenceType === 'Sale' && dispatch.referenceId) {
            await Sale.findByIdAndUpdate(dispatch.referenceId, { status: 'CANCELLED', deliveryStatus: 'CANCELED' }, { session });
        }

        return dispatch;
    });
};

/* ─────────────────────────────────────────────
   GET DISPATCHES (list)
───────────────────────────────────────────── */
const getDispatches = async (query, user) => {
    const { status, sourceId, destinationId } = query;
    const filter = {};

    // Security: Filter by shopId for store-based roles
    const storeRoles = ['store_staff', 'store_manager', 'accountant', 'Staff', 'Manager', 'Accountant'];
    const normalizedRole = (user?.role || '').toLowerCase();
    const isStoreRole = normalizedRole.includes('staff') || normalizedRole.includes('manager') || normalizedRole.includes('accountant');

    if (user && isStoreRole) {
        if (!user.shopId) throw new Error('User is not linked to any store.');
        filter.$or = [
            { sourceWarehouseId: user.shopId },
            { destinationStoreId: user.shopId }
        ];
    }

    if (status) filter.status = status;
    if (sourceId) filter.sourceWarehouseId = sourceId;
    if (destinationId) filter.destinationStoreId = destinationId;

    const dispatches = await Dispatch.find(filter)
        .sort({ createdAt: -1 })
        .populate('sourceWarehouseId', 'name')
        .populate('destinationStoreId', 'name')
        .populate('createdBy', 'name');

    return await populateDispatchItemsManual(dispatches);
};

/* ─────────────────────────────────────────────
   GET DISPATCH BY ID
───────────────────────────────────────────── */
const getDispatchById = async (id) => {
    const dispatch = await Dispatch.findById(id)
        .populate('sourceWarehouseId')
        .populate('destinationStoreId')
        .lean();

    if (!dispatch) return null;
    return await populateDispatchItemsManual(dispatch);
};

/* ─────────────────────────────────────────────
   RECEIVE DISPATCH (DISPATCHED → RECEIVED)
   Clears in-transit, adds physical stock to store
   Accepts optional receivedItems for partial/audited receipts
───────────────────────────────────────────── */
const receiveDispatch = async (id, userId, receivedItems = []) => {
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch not found');
        if (dispatch.status !== 'DISPATCHED') throw new Error('Only dispatched items can be received');

        const itemsToProcess = dispatch.items || [];
        const Item = require('../../models/item.model');
        const Store = require('../../models/store.model');
        const stockService = require('../../services/stock.service');

        for (const item of itemsToProcess) {
            // Fallback for legacy dispatches missing itemId/barcode
            let itmId = item.itemId;
            let bcode = item.barcode;

            if (!itmId || !bcode) {
                const parent = await Item.findOne({ "sizes._id": String(item.variantId) }).session(session);
                if (parent) {
                    itmId = itmId || parent._id;
                    const variant = (parent.sizes || []).find(sz => String(sz._id) === String(item.variantId));
                    bcode = bcode || (variant ? (variant.sku || variant.barcode || parent.itemCode) : 'UNKNOWN');
                } else {
                    // Critical fallback if item is gone or mismatch
                    itmId = itmId || item.variantId;
                    bcode = bcode || 'LEGACY';
                }
            }

            // 1. ALWAYS clear the pool from in-transit (Self-healing strategy)
            try {
                await stockService.removeInTransit({
                    itemId: itmId,
                    barcode: bcode,
                    variantId: item.variantId,
                    locationId: dispatch.destinationStoreId,
                    locationType: 'STORE',
                    qty: item.qty,
                    session
                });
            } catch (err) {
                console.warn(`[RECOVERY] In-transit sync failed for ${bcode}. Error: ${err.message}. Proceeding with physical receipt to avoid system block.`);
            }

            // 2. Add only the RECEIVED quantity to physical inventory
            const verified = (receivedItems || []).find(ri => String(ri.variantId) === String(item.variantId));
            const qtyToReceive = verified ? Number(verified.receivedQty) : item.qty;

            if (qtyToReceive > 0) {
                // Check if relabeling is required
                const systemConfigService = require('../systemConfig/systemConfig.service');
                const relabelOnTransfer = await systemConfigService.getConfigByKey('relabelOnTransfer', false);

                let targetBarcode = bcode;
                if (relabelOnTransfer) {
                    const store = await Store.findById(dispatch.destinationStoreId).session(session);
                    const storeCode = store ? store.storeCode : 'STR';
                    targetBarcode = `${storeCode}-${bcode}`;
                }

                // In receiving, we use total per item instead of individual taxAmount field 
                // as 'taxAmount' wasn't stored per line in early versions.
                const landingCost = (item.rate || 0) + (item.tax || 0);

                await stockService.addStock({
                    itemId: itmId,
                    barcode: targetBarcode,
                    variantId: item.variantId,
                    locationId: dispatch.destinationStoreId,
                    locationType: 'STORE',
                    qty: qtyToReceive,
                    type: 'RECEIVE',
                    purchaseRate: landingCost,
                    referenceId: dispatch._id,
                    referenceType: 'Dispatch',
                    performedBy: userId,
                    session
                });
            }
        }

        // Update Dispatch Status
        dispatch.status = 'RECEIVED';
        dispatch.receivedAt = new Date();
        await dispatch.save({ session });

        return dispatch;
    });
};

module.exports = {
    createDispatch,
    updateDispatch,
    confirmDispatch,
    cancelDispatch,
    getDispatches,
    getDispatchById,
    receiveDispatch,
    processDispatch: createDispatch // for compatibility
};
