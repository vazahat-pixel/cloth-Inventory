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
    if (!dispatches) return dispatches;
    const isSingle = !Array.isArray(dispatches);
    const docs = isSingle ? [dispatches] : dispatches;
    const plainDocs = [];

    const allVariantIds = new Set();
    const allItemIds = new Set();
    const allBarcodes = new Set();

    for (const doc of docs) {
        if (!doc) continue;
        const plainDoc = doc.toObject ? doc.toObject() : JSON.parse(JSON.stringify(doc));
        plainDocs.push(plainDoc);

        (plainDoc.items || []).forEach((di) => {
            const vid = di.variantId?._id || di.variantId;
            if (vid) allVariantIds.add(String(vid));
            const iid = di.itemId?._id || di.itemId;
            if (iid) allItemIds.add(String(iid));
            if (di.barcode) allBarcodes.add(String(di.barcode).trim());
        });
    }

    const variantIds = [...allVariantIds];
    const itemIds = [...allItemIds];
    const barcodes = [...allBarcodes];

    let itemMasterList = [];
    if (variantIds.length || itemIds.length || barcodes.length) {
        itemMasterList = await Item.find({
            $or: [
                { "sizes._id": { $in: variantIds } },
                { "_id": { $in: itemIds } },
                { "sizes.barcode": { $in: barcodes } },
                { "sizes.sku": { $in: barcodes } }
            ]
        })
            .populate('brand', 'name brandName')
            .populate('hsCodeId')
            .populate('categoryId', 'name')
            .populate('groupIds', 'name groupType groupName')
            .lean();
    }

    const enrichLineItem = (di) => {
        const vid = String(di.variantId?._id || di.variantId);
        const iid = String(di.itemId?._id || di.itemId || '');
        let parentItem = itemMasterList.find(it => (it.sizes || []).some(sz => String(sz._id) === vid));
        if (!parentItem && iid) {
            parentItem = itemMasterList.find(it => String(it._id) === iid);
        }
        if (!parentItem && di.barcode) {
            parentItem = itemMasterList.find(it => (it.sizes || []).some(sz =>
                String(sz.barcode || '').toLowerCase() === String(di.barcode || '').toLowerCase() ||
                String(sz.sku || '').toLowerCase() === String(di.barcode || '').toLowerCase()
            ));
        }
        if (parentItem) {
            const variant = (parentItem.sizes || []).find(sz => String(sz._id) === vid);
            const finalCategory = parentItem.categoryName || parentItem.category || (parentItem.categoryId && (parentItem.categoryId.name || parentItem.categoryId.itemName)) || 'OTHERS';
            const finalHsn = parentItem.hsCodeId?.code || parentItem.hsnCode || '';
            return {
                ...di,
                category: finalCategory,
                hsnCode: finalHsn,
                brand: parentItem.brandName || (parentItem.brand && (parentItem.brand.name || parentItem.brand.brandName)) || '',
                variantId: {
                    _id: variant?._id || (di.variantId?._id || di.variantId),
                    itemId: parentItem._id,
                    itemName: parentItem.itemName,
                    itemCode: parentItem.itemCode,
                    sku: variant?.sku || di.barcode || parentItem.itemCode,
                    barcode: variant?.barcode || variant?.sku || di.barcode || parentItem.itemCode,
                    size: variant?.size || 'N/A',
                    color: variant?.color || parentItem.shade || 'N/A'
                }
            };
        }
        return di;
    };

    for (const plainDoc of plainDocs) {
        if (!plainDoc.items || plainDoc.items.length === 0) continue;
        plainDoc.items = (plainDoc.items || []).map(enrichLineItem);
    }

    return isSingle ? plainDocs[0] : plainDocs;
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
   Helper: Rebuild dispatch items from reference document
   Used for legacy/partial records where dispatch.items is empty
───────────────────────────────────────────── */
const buildItemsFromReference = async (dispatch, session) => {
    if (!dispatch?.referenceId || !dispatch?.referenceType) return [];

    if (dispatch.referenceType === 'Sale') {
        const sale = await Sale.findById(dispatch.referenceId).session(session);
        if (!sale || !Array.isArray(sale.items)) return [];

        return sale.items.map((si) => {
            const qty = Number(si.quantity || 0);
            const totalTax = Number(si.taxAmount || 0);
            return {
                itemId: si.itemId,
                variantId: si.productId || si.variantId,
                barcode: si.barcode,
                qty,
                rate: Number(si.rate || 0),
                mrp: Number(si.mrp || si.rate || 0),
                discountPercent: Number(si.discount || 0),
                taxPercentage: Number(si.taxPercentage || 0),
                tax: qty > 0 ? totalTax / qty : 0,
                total: Number(si.total || 0)
            };
        }).filter((it) => it.variantId && it.qty > 0);
    }

    if (dispatch.referenceType === 'DeliveryChallan') {
        const challan = await DeliveryChallan.findById(dispatch.referenceId).session(session);
        if (!challan || !Array.isArray(challan.items)) return [];

        return challan.items.map((ci) => ({
            itemId: ci.itemId,
            variantId: ci.variantId,
            barcode: ci.barcode,
            qty: Number(ci.quantity || 0),
            rate: Number(ci.rate || 0),
            mrp: Number(ci.rate || 0),
            discountPercent: 0,
            taxPercentage: 0,
            tax: 0,
            total: Number(ci.rate || 0) * Number(ci.quantity || 0)
        })).filter((it) => it.variantId && it.qty > 0);
    }

    return [];
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
        const isSameEntity = sourceGst !== '' && sourceGst === destGst;
        const transferDiscountPct = destination.transferDiscountPct || 0;

        // 2. Prepare Detailed Items (Using Item Master Sizes) — batch item lookup
        const { calculateGST } = require('../../services/gst.service');
        const enrichedItems = [];
        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        const variantIds = finalProducts.map(p => p.variantId || p.productId).filter(Boolean);
        const itemDocs = await Item.find({ "sizes._id": { $in: variantIds } })
            .populate('hsCodeId')
            .session(session);
        const itemByVariant = new Map();
        itemDocs.forEach((doc) => {
            (doc.sizes || []).forEach((sz) => itemByVariant.set(String(sz._id), doc));
        });

        for (const p of finalProducts) {
            const variantId = p.variantId || p.productId;
            if (!variantId) throw new Error("Item variant ID missing in request");

            const itemDoc = itemByVariant.get(String(variantId));
            if (!itemDoc) throw new Error(`Item master record not found for variant ID: ${variantId}`);

            const variant = itemDoc.sizes.id(variantId);
            if (!variant) throw new Error(`Variant not found in Item Master: ${variantId}`);

            const baseRate = Number(p.mrp || p.baseRate || p.rate || variant.mrp || itemDoc.salePrice || 0);
            const discountPct = Number(p.discountPercent ?? transferDiscountPct ?? 0);
            const discountedRate = Number((p.rate ?? (baseRate * (1 - discountPct / 100))).toFixed(2));
            const lineSubTotal = discountedRate * p.quantity;

            let taxData = { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
            const gstPct = Number(p.gstPercent ?? p.taxPercentage ?? itemDoc.gstPercent ?? itemDoc.hsCodeId?.gstPercent ?? 0);

            if (!isSameEntity && !isDraft) {
                if (gstPct > 0) {
                    const isIntraState = (source.location?.state || '').toLowerCase() === (destination.location?.state || '').toLowerCase();
                    taxData = calculateGST(lineSubTotal, gstPct, isIntraState ? 'CGST_SGST' : 'IGST');
                }
            }

            const barcode = variant.sku || variant.barcode || itemDoc.itemCode;
            const finalHsn = itemDoc.hsCodeId?.code || itemDoc.hsnCode || '';
            if (!finalHsn) {
                console.warn(`[HSN_VALIDATION_WARNING] Item "${itemDoc.itemName}" (ID: ${itemDoc._id}) is missing HSN code configuration.`);
            }

            enrichedItems.push({
                itemId: itemDoc._id,
                variantId: variant._id,
                qty: p.quantity,
                barcode,
                rate: discountedRate,
                mrp: baseRate,
                discountPercent: discountPct,
                taxPercentage: isDraft || isSameEntity ? 0 : gstPct,
                taxAmount: taxData.totalTax,
                total: lineSubTotal + taxData.totalTax,
                cgst: taxData.cgst,
                sgst: taxData.sgst,
                igst: taxData.igst,
                sku: barcode,
                hsnCode: finalHsn
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
                        rate: ei.rate,
                        hsnCode: ei.hsnCode
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
                    subTotal: Number(totalSubTotal || 0),
                    totalTax: Number(totalTaxAmount || 0),
                    grandTotal: Number((totalSubTotal + totalTaxAmount) || 0),
                    amountPaid: 0,
                    dueAmount: Number((totalSubTotal + totalTaxAmount) || 0),
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
        //    Billing doc (Sale / DeliveryChallan) already deducted warehouse stock above.
        //    Only add to in-transit at destination store — never double-deduct warehouse.
        if (!isDraft) {
            for (const ei of enrichedItems) {
                const barcode = ei.barcode;
                const itemId = ei.itemId;
                const variantId = ei.variantId;

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
        if (dispatchData.status && dispatchData.status !== dispatchMaster.status) {
            const currentStatus = dispatchMaster.status;
            const newStatus = dispatchData.status;
            if (currentStatus === 'PENDING' && !['PACKED', 'DISPATCHED'].includes(newStatus)) {
                throw new Error('Invalid status transition. Status must progress from Pending to In-Transit (Dispatched).');
            }
            if (currentStatus === 'DISPATCHED' && newStatus !== 'RECEIVED') {
                throw new Error('Invalid status transition. Status must progress from In-Transit (Dispatched) to Completed (Received).');
            }
            if (currentStatus === 'RECEIVED') {
                throw new Error('Cannot update status of an already completed dispatch.');
            }
        }
        if (!['PENDING', 'PACKED'].includes(dispatchMaster.status)) throw new Error('Only pending or packed challans can be updated');

        const { items: newItems, products, notes, sourceId, destinationStoreId, vehicleNumber, driverName } = dispatchData;
        const finalProducts = newItems || products || [];

        // Resolve Entities for GST/Discount check
        const source = await Warehouse.findById(dispatchMaster.sourceWarehouseId).session(session)
            || await Store.findById(dispatchMaster.sourceWarehouseId).session(session);
        const destination = await Store.findById(dispatchMaster.destinationStoreId).session(session);

        if (!source || !destination) throw new Error('Source or destination not found');

        const sourceGst = (source.gstNumber || '').trim().toUpperCase();
        const destGst = (destination.gstNumber || '').trim().toUpperCase();
        const isSameEntity = sourceGst !== '' && sourceGst === destGst;
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

            const baseRate = Number(p.mrp || p.baseRate || p.rate || variant.mrp || itemDoc.salePrice || 0);
            const discountPct = Number(p.discountPercent ?? transferDiscountPct ?? 0);
            const discountedRate = Number((p.rate ?? (baseRate * (1 - discountPct / 100))).toFixed(2));
            const qty = (p.quantity || p.qty || 0);
            const lineSubTotal = discountedRate * qty;

            let taxData = { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
            if (!isSameEntity) {
                const gstPct = Number(p.gstPercent ?? p.taxPercentage ?? itemDoc.gstPercent ?? itemDoc.hsCodeId?.gstPercent ?? 0);
                if (gstPct > 0) {
                    const isIntraState = (source.location?.state || '').toLowerCase() === (destination.location?.state || '').toLowerCase();
                    taxData = calculateGST(lineSubTotal, gstPct, isIntraState ? 'CGST_SGST' : 'IGST');
                }
            }

            const barcode = variant.sku || variant.barcode || itemDoc.itemCode;
            const finalHsn = itemDoc.hsCodeId?.code || itemDoc.hsnCode || '';
            if (!finalHsn) {
                console.warn(`[HSN_VALIDATION_WARNING] Item "${itemDoc.itemName}" (ID: ${itemDoc._id}) is missing HSN code configuration.`);
            }

            enrichedItems.push({
                itemId: itemDoc._id,
                variantId: variant._id,
                qty,
                barcode,
                rate: discountedRate,
                mrp: baseRate,
                discountPercent: discountPct,
                taxPercentage: isSameEntity ? 0 : Number(p.gstPercent ?? p.taxPercentage ?? itemDoc.gstPercent ?? itemDoc.hsCodeId?.gstPercent ?? 0),
                taxAmount: taxData.totalTax,
                total: lineSubTotal + taxData.totalTax,
                cgst: taxData.cgst, sgst: taxData.sgst, igst: taxData.igst,
                sku: barcode,
                hsnCode: finalHsn
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
            mrp: ei.mrp,
            discountPercent: ei.discountPercent || 0,
            taxPercentage: ei.taxPercentage || 0,
            tax: ei.qty > 0 ? (ei.taxAmount / ei.qty) : 0,
            total: ei.total || 0
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
const packDispatch = async (id, userId) => {
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findOneAndUpdate(
            { _id: id, status: 'PENDING' },
            { $set: { status: 'PACKED' } },
            { new: true, session }
        );
        if (!dispatch) {
            const existing = await Dispatch.findById(id).session(session);
            if (existing?.status === 'PACKED') return existing;
            throw new Error(`Only Sale Challan drafts can be packed. Current status: ${existing?.status || 'unknown'}`);
        }

        return dispatch;
    });
};

const confirmDispatch = async (id, userId) => {
    return await withTransaction(async (session) => {
        // Normalize PENDING → PACKED before atomic claim
        await Dispatch.updateOne(
            { _id: id, status: 'PENDING' },
            { $set: { status: 'PACKED' } },
            { session }
        );

        const dispatch = await Dispatch.findOneAndUpdate(
            { _id: id, status: 'PACKED' },
            { $set: { status: 'DISPATCHED', dispatchedAt: new Date() } },
            { new: false, session }
        );

        if (!dispatch) {
            const existing = await Dispatch.findById(id).session(session);
            if (existing?.status === 'DISPATCHED') return existing;
            throw new Error(`Only pending or packed challans can be dispatched. Current status: ${existing?.status || 'unknown'}`);
        }

        const hadBillingBefore = !!(dispatch.referenceId && dispatch.referenceType);
        let billingCreatedInThisRun = false;

        const source = await Warehouse.findById(dispatch.sourceWarehouseId).session(session)
            || await Store.findById(dispatch.sourceWarehouseId).session(session);
        const destination = await Store.findById(dispatch.destinationStoreId).session(session);

        if (!source) throw new Error('Source warehouse/store not found');
        if (!destination) throw new Error('Destination store not found');

        const sourceGst = (source.gstNumber || '').trim().toUpperCase();
        const destGst = (destination.gstNumber || '').trim().toUpperCase();
        const isSameEntity = sourceGst !== '' && sourceGst === destGst;

        if (!hadBillingBefore) {
            billingCreatedInThisRun = true;
            const detailedItems = [];
            let totalSubTotal = 0;
            let totalTaxAmount = 0;
            let totalCGST = 0;
            let totalSGST = 0;
            let totalIGST = 0;
            const { calculateGST } = require('../../services/gst.service');

            const confirmItemIds = (dispatch.items || []).map(i => i.itemId).filter(Boolean);
            const confirmItemDocs = await Item.find({ _id: { $in: confirmItemIds } })
                .populate('hsCodeId')
                .populate('categoryId')
                .session(session);
            const confirmItemMap = new Map(confirmItemDocs.map(doc => [String(doc._id), doc]));

            for (const item of dispatch.items) {
                const itemDoc = confirmItemMap.get(String(item.itemId));
                if (!itemDoc) throw new Error(`Item not found: ${item.itemId}`);

                const variant = itemDoc.sizes.id(item.variantId);
                if (!variant) throw new Error(`Variant not found in item master: ${item.variantId}`);

                const qty = Number(item.qty || 0);
                const rate = Number(item.rate || variant.mrp || itemDoc.mrp || 0);
                const baseMrp = Number(item.mrp || variant.mrp || rate);
                const lineSubTotal = rate * qty;
                const gstPct = Number(item.taxPercentage ?? itemDoc.gstPercent ?? itemDoc.hsCodeId?.gstPercent ?? 0);

                let taxData = { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
                if (!isSameEntity && gstPct > 0) {
                    const isIntraState = (source.location?.state || source.state || '').toLowerCase() === (destination.location?.state || destination.state || '').toLowerCase();
                    taxData = calculateGST(lineSubTotal, gstPct, isIntraState ? 'CGST_SGST' : 'IGST');
                }

                detailedItems.push({
                    itemId: itemDoc._id,
                    variantId: variant._id,
                    barcode: item.barcode || variant.sku || variant.barcode || itemDoc.itemCode,
                    qty,
                    rate,
                    mrp: baseMrp,
                    discountPercent: Number(item.discountPercent || 0),
                    taxPercentage: isSameEntity ? 0 : gstPct,
                    taxAmount: taxData.totalTax,
                    total: lineSubTotal + taxData.totalTax,
                    cgst: taxData.cgst,
                    sgst: taxData.sgst,
                    igst: taxData.igst,
                    sku: item.barcode || variant.sku || variant.barcode || itemDoc.itemCode,
                    category: itemDoc.categoryId?.name || itemDoc.categoryName || itemDoc.category || 'OTHERS',
                    brand: itemDoc.brandName || itemDoc.brand || '',
                    hsnCode: itemDoc.hsCodeId?.code || itemDoc.hsnCode || ''
                });

                totalSubTotal += lineSubTotal;
                totalTaxAmount += taxData.totalTax;
                totalCGST += taxData.cgst;
                totalSGST += taxData.sgst;
                totalIGST += taxData.igst;
            }

            if (isSameEntity) {
                const challan = await challanService.createChallan({
                    destinationStoreId: dispatch.destinationStoreId,
                    sourceId: dispatch.sourceWarehouseId,
                    items: detailedItems.map((ei) => ({
                        itemId: ei.itemId,
                        variantId: ei.variantId,
                        barcode: ei.barcode,
                        quantity: ei.qty,
                        rate: ei.rate,
                        hsnCode: ei.hsnCode
                    })),
                    type: 'WAREHOUSE_TO_STORE',
                    totalValue: totalSubTotal,
                    notes: dispatch.notes || `Stock Transfer to ${destination.name}`
                }, userId, session);

                dispatch.referenceId = challan._id;
                dispatch.referenceType = 'DeliveryChallan';
            } else {
                const sale = await salesService.createSale({
                    storeId: dispatch.sourceWarehouseId,
                    destinationStoreId: dispatch.destinationStoreId,
                    products: detailedItems.map((ei) => ({
                        barcode: ei.sku,
                        productId: ei.variantId,
                        itemId: ei.itemId,
                        quantity: ei.qty,
                        rate: ei.rate,
                        mrp: ei.mrp,
                        taxAmount: ei.taxAmount,
                        taxPercentage: ei.taxPercentage,
                        total: ei.total,
                        cgst: ei.cgst,
                        sgst: ei.sgst,
                        igst: ei.igst,
                        category: ei.category,
                        brand: ei.brand,
                        hsnCode: ei.hsnCode
                    })),
                    type: 'INTERNAL_SALE',
                    subTotal: Number(totalSubTotal || 0),
                    totalTax: Number(totalTaxAmount || 0),
                    grandTotal: Number((totalSubTotal + totalTaxAmount) || 0),
                    amountPaid: 0,
                    dueAmount: Number((totalSubTotal + totalTaxAmount) || 0),
                    paymentMode: 'CREDIT',
                    notes: dispatch.notes || `Internal Sale Transfer: ${source.name} -> ${destination.name}`
                }, userId, session);

                dispatch.referenceId = sale._id;
                dispatch.referenceType = 'Sale';
            }

            await Dispatch.updateOne(
                { _id: dispatch._id },
                {
                    $set: {
                        referenceId: dispatch.referenceId,
                        referenceType: dispatch.referenceType,
                    },
                },
                { session }
            );
        }

        // Process each item: move stock to destination in-transit.
        // Billing doc creation (Sale / DeliveryChallan) already deducted warehouse stock in this transaction.
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

            if (!billingCreatedInThisRun) {
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
                    performedBy: userId,
                    session
                });
            }

            // Add to in-transit pool at destination store
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

        // Status already set to DISPATCHED via atomic claim at start
        dispatch.status = 'DISPATCHED';
        dispatch.dispatchedAt = dispatch.dispatchedAt || new Date();

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
const combineAndConfirmDispatch = async ({ dispatchIds, notes, date, vehicleNumber, driverName }, userId) => {
    return await withTransaction(async (session) => {
        if (!Array.isArray(dispatchIds) || dispatchIds.length < 2) {
            throw new Error('Please select at least two dispatches to combine');
        }

        // 1. Atomically claim source dispatches (prevents concurrent double-combine)
        const dispatches = [];
        for (const id of dispatchIds) {
            const claimed = await Dispatch.findOneAndUpdate(
                { _id: id, status: { $in: ['PENDING', 'PACKED'] } },
                { $set: { status: 'DISPATCHED', dispatchedAt: new Date() } },
                { new: false, session }
            );
            if (!claimed) {
                const existing = await Dispatch.findById(id).session(session);
                if (!existing) throw new Error(`Dispatch record not found: ${id}`);
                throw new Error(`Only pending or packed dispatches can be combined. Dispatch ${existing.dispatchNumber} is ${existing.status}`);
            }
            dispatches.push(claimed);
        }

        // 2. Validate same source and destination
        const firstDisp = dispatches[0];
        const sourceWarehouseId = firstDisp.sourceWarehouseId.toString();
        const destinationStoreId = firstDisp.destinationStoreId.toString();

        for (const disp of dispatches) {
            if (disp.sourceWarehouseId.toString() !== sourceWarehouseId) {
                throw new Error('All selected dispatches must have the same source warehouse/store');
            }
            if (disp.destinationStoreId.toString() !== destinationStoreId) {
                throw new Error('All selected dispatches must have the same destination store');
            }
        }

        const source = await Warehouse.findById(sourceWarehouseId).session(session)
            || await Store.findById(sourceWarehouseId).session(session);
        const destination = await Store.findById(destinationStoreId).session(session);

        if (!source) throw new Error('Source warehouse/store not found');
        if (!destination) throw new Error('Destination store not found');

        const sourceGst = (source.gstNumber || '').trim().toUpperCase();
        const destGst = (destination.gstNumber || '').trim().toUpperCase();
        const isSameEntity = sourceGst !== '' && sourceGst === destGst;

        // 3. Group and merge items
        const itemMap = new Map(); // key: variantId
        for (const disp of dispatches) {
            for (const item of disp.items) {
                const varIdStr = item.variantId.toString();
                if (itemMap.has(varIdStr)) {
                    const existing = itemMap.get(varIdStr);
                    existing.qty += Number(item.qty || 0);
                } else {
                    itemMap.set(varIdStr, {
                        itemId: item.itemId,
                        variantId: item.variantId,
                        barcode: item.barcode,
                        qty: Number(item.qty || 0),
                        rate: Number(item.rate || 0),
                        mrp: Number(item.mrp || 0),
                        discountPercent: Number(item.discountPercent || 0),
                        taxPercentage: Number(item.taxPercentage || 0)
                    });
                }
            }
        }

        const mergedItems = Array.from(itemMap.values());
        if (mergedItems.length === 0) {
            throw new Error('No items found in selected dispatches to combine');
        }

        // 4. Calculate detailed items and totals
        const detailedItems = [];
        let totalSubTotal = 0;
        let totalTaxAmount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        const { calculateGST } = require('../../services/gst.service');

        // Fetch all item docs in bulk to avoid serial findById queries inside the loop
        const itemIds = [...new Set(mergedItems.map(i => i.itemId).filter(Boolean))];
        const itemDocs = await Item.find({ _id: { $in: itemIds } }).populate('categoryId').populate('hsCodeId').session(session);
        const itemDocsMap = new Map(itemDocs.map(doc => [doc._id.toString(), doc]));

        for (const item of mergedItems) {
            const itemDoc = itemDocsMap.get(item.itemId.toString());
            if (!itemDoc) throw new Error(`Item not found: ${item.itemId}`);

            const variant = itemDoc.sizes.id(item.variantId);
            if (!variant) throw new Error(`Variant not found in item master: ${item.variantId}`);

            const qty = item.qty;
            const rate = Number(item.rate || variant.mrp || itemDoc.mrp || 0);
            const baseMrp = Number(item.mrp || variant.mrp || rate);
            const lineSubTotal = rate * qty;
            const gstPct = Number(item.taxPercentage ?? itemDoc.gstPercent ?? itemDoc.hsCodeId?.gstPercent ?? 0);

            let taxData = { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
            if (!isSameEntity && gstPct > 0) {
                const isIntraState = (source.location?.state || source.state || '').toLowerCase() === (destination.location?.state || destination.state || '').toLowerCase();
                taxData = calculateGST(lineSubTotal, gstPct, isIntraState ? 'CGST_SGST' : 'IGST');
            }

            detailedItems.push({
                itemId: itemDoc._id,
                variantId: variant._id,
                barcode: item.barcode || variant.sku || variant.barcode || itemDoc.itemCode,
                qty,
                rate,
                mrp: baseMrp,
                discountPercent: Number(item.discountPercent || 0),
                taxPercentage: isSameEntity ? 0 : gstPct,
                taxAmount: taxData.totalTax,
                total: lineSubTotal + taxData.totalTax,
                cgst: taxData.cgst,
                sgst: taxData.sgst,
                igst: taxData.igst,
                sku: item.barcode || variant.sku || variant.barcode || itemDoc.itemCode,
                category: itemDoc.categoryId?.name || itemDoc.categoryName || itemDoc.category || 'OTHERS',
                brand: itemDoc.brandName || itemDoc.brand || '',
                hsnCode: itemDoc.hsCodeId?.code || itemDoc.hsnCode || ''
            });

            totalSubTotal += lineSubTotal;
            totalTaxAmount += taxData.totalTax;
            totalCGST += taxData.cgst;
            totalSGST += taxData.sgst;
            totalIGST += taxData.igst;
        }

        // 5. Generate Billing Document
        let referenceId;
        let referenceType;

        const combinedNotes = notes || `Combined dispatch of dispatches: ${dispatches.map(d => d.dispatchNumber).join(', ')}`;

        if (isSameEntity) {
            const challan = await challanService.createChallan({
                destinationStoreId,
                sourceId: sourceWarehouseId,
                items: detailedItems.map((ei) => ({
                    itemId: ei.itemId,
                    variantId: ei.variantId,
                    barcode: ei.barcode,
                    quantity: ei.qty,
                    rate: ei.rate,
                    hsnCode: ei.hsnCode
                })),
                type: 'WAREHOUSE_TO_STORE',
                totalValue: totalSubTotal,
                notes: combinedNotes,
                vehicleNumber,
                driverName
            }, userId, session);

            referenceId = challan._id;
            referenceType = 'DeliveryChallan';
        } else {
            const sale = await salesService.createSale({
                storeId: sourceWarehouseId,
                destinationStoreId,
                products: detailedItems.map((ei) => ({
                    barcode: ei.sku,
                    productId: ei.variantId,
                    itemId: ei.itemId,
                    quantity: ei.qty,
                    rate: ei.rate,
                    mrp: ei.mrp,
                    taxAmount: ei.taxAmount,
                    taxPercentage: ei.taxPercentage,
                    total: ei.total,
                    cgst: ei.cgst,
                    sgst: ei.sgst,
                    igst: ei.igst,
                    category: ei.category,
                    brand: ei.brand,
                    hsnCode: ei.hsnCode
                })),
                type: 'INTERNAL_SALE',
                subTotal: Number(totalSubTotal || 0),
                totalTax: Number(totalTaxAmount || 0),
                grandTotal: Number((totalSubTotal + totalTaxAmount) || 0),
                amountPaid: 0,
                dueAmount: Number((totalSubTotal + totalTaxAmount) || 0),
                paymentMode: 'CREDIT',
                notes: combinedNotes,
                vehicleNumber,
                driverName
            }, userId, session);

            referenceId = sale._id;
            referenceType = 'Sale';
        }

        // 6. Generate the Master Combined Dispatch record
        const nextSeqNum = await getNextSequence('DSP', session);
        const finalDspNumber = `DSP-${nextSeqNum.toString().padStart(5, '0')}`;

        const combinedDispatch = new Dispatch({
            dispatchNumber: finalDspNumber,
            sourceWarehouseId,
            destinationStoreId,
            items: detailedItems,
            status: 'DISPATCHED',
            referenceId,
            referenceType,
            dispatchedAt: new Date(),
            notes: combinedNotes,
            vehicleNumber,
            driverName,
            createdBy: userId
        });
        await combinedDispatch.save({ session });

        // 7. Link original dispatches to combined billing (status already claimed in step 1)
        await Promise.all(dispatches.map(async (disp) => {
            await Dispatch.updateOne(
                { _id: disp._id },
                {
                    $set: {
                        referenceId,
                        referenceType,
                        notes: `${disp.notes || ''} [Combined into ${finalDspNumber}]`.trim(),
                    },
                },
                { session }
            );
        }));

        // 8. Billing document (Sale / DeliveryChallan) already deducted warehouse stock above.
        // Only move merged quantities to destination in-transit here.

        // 9. Add all merged items to the in-transit pool at destination store in parallel
        await Promise.all(detailedItems.map(async (item) => {
            await stockService.addInTransit({
                itemId: item.itemId,
                barcode: item.barcode,
                variantId: item.variantId,
                locationId: destinationStoreId,
                locationType: 'STORE',
                qty: item.qty,
                session
            });
        }));

        // 9. Update related billing document if exists
        if (referenceType === 'DeliveryChallan') {
            await DeliveryChallan.findByIdAndUpdate(referenceId, { status: 'DISPATCHED' }, { session });
        } else if (referenceType === 'Sale') {
            await Sale.findByIdAndUpdate(referenceId, { deliveryStatus: 'DISPATCHED' }, { session });
        }

        return combinedDispatch;
    });
};

const cancelDispatch = async (id, userId) => {
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch record not found');
        if (!['PENDING', 'PACKED'].includes(dispatch.status)) throw new Error(`Only pending or packed dispatches can be cancelled. Current status: ${dispatch.status}`);

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
   Helper: Attach billing document metadata for unified lists
───────────────────────────────────────────── */
const enrichDispatchesWithBillingMeta = async (plainDocs) => {
    if (!plainDocs || plainDocs.length === 0) return plainDocs;

    const saleIds = [];
    const dcIds = [];
    for (const d of plainDocs) {
        const refId = d.referenceId?._id || d.referenceId;
        if (!refId) continue;
        if (d.referenceType === 'Sale') saleIds.push(refId);
        else if (d.referenceType === 'DeliveryChallan') dcIds.push(refId);
    }

    const [sales, challans] = await Promise.all([
        saleIds.length
            ? Sale.find({ _id: { $in: saleIds } }).select('saleNumber grandTotal').lean()
            : [],
        dcIds.length
            ? DeliveryChallan.find({ _id: { $in: dcIds } }).select('dcNumber totalValue').lean()
            : [],
    ]);

    const saleMap = new Map(sales.map((s) => [String(s._id), s]));
    const dcMap = new Map(challans.map((c) => [String(c._id), c]));

    return plainDocs.map((d) => {
        const refId = d.referenceId?._id || d.referenceId;
        const notes = String(d.notes || '');
        const dispatchNumber = String(d.dispatchNumber || '');
        const isCombinedChild = notes.includes('[Combined into');
        const isCombinedMaster = dispatchNumber.startsWith('DSP-');

        let billingDocType = null;
        let billingDocNumber = null;

        if (d.referenceType === 'Sale' && refId) {
            billingDocType = 'TAX_INVOICE';
            billingDocNumber = saleMap.get(String(refId))?.saleNumber || null;
        } else if (d.referenceType === 'DeliveryChallan' && refId) {
            billingDocType = 'TRANSFER_BILL';
            billingDocNumber = dcMap.get(String(refId))?.dcNumber || null;
        } else if (d.sourceWarehouseId && d.destinationStoreId && ['DISPATCHED', 'RECEIVED'].includes(d.status)) {
            const sourceGst = (d.sourceWarehouseId.gstNumber || '').trim().toUpperCase();
            const destGst = (d.destinationStoreId.gstNumber || '').trim().toUpperCase();
            if (sourceGst && sourceGst === destGst) billingDocType = 'TRANSFER_BILL';
            else billingDocType = 'TAX_INVOICE';
        }

        return {
            ...d,
            billingDocType,
            billingDocNumber,
            isCombinedChild,
            isCombinedMaster,
        };
    });
};

/* ─────────────────────────────────────────────
   GET DISPATCHES (list)
───────────────────────────────────────────── */
const getDispatches = async (query, user) => {
    const { status, sourceId, destinationId, search, isTransferBill } = query;
    const { getPagination, buildPaginationMeta, getSort } = require('../../utils/pagination.helper');
    const { page, limit, skip } = getPagination(query);
    const filter = {};

    const normalizedRole = (user?.role || '').toLowerCase();
    const isStoreRole = normalizedRole.includes('staff') || normalizedRole.includes('manager') || normalizedRole.includes('accountant');

    if (user && isStoreRole) {
        if (!user.shopId) throw new Error('User is not linked to any store.');
        filter.$or = [
            { sourceWarehouseId: user.shopId },
            { destinationStoreId: user.shopId },
        ];
    }

    if (status) filter.status = status;
    if (sourceId) filter.sourceWarehouseId = sourceId;
    if (destinationId) filter.destinationStoreId = destinationId;

    if (isTransferBill === 'true') {
        filter.dispatchNumber = { $regex: /^DSP-/i };
    } else if (isTransferBill === 'false') {
        filter.dispatchNumber = { $not: { $regex: /^DSP-/i } };
    }

    if (search) {
        const searchOr = [
            { dispatchNumber: { $regex: search, $options: 'i' } },
            { challanNumber: { $regex: search, $options: 'i' } },
        ];
        if (filter.$or) {
            filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
            delete filter.$or;
        } else {
            filter.$or = searchOr;
        }
    }

    const sort = getSort(query, {
        createdAt: 'createdAt',
        dispatchNumber: 'dispatchNumber',
        status: 'status',
    }, { createdAt: -1 });

    const [dispatches, total] = await Promise.all([
        Dispatch.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('sourceWarehouseId')
            .populate('destinationStoreId')
            .populate('createdBy', 'name'),
        Dispatch.countDocuments(filter),
    ]);

    const populated = await populateDispatchItemsManual(dispatches);
    const plainList = Array.isArray(populated) ? populated : [];
    const enriched = await enrichDispatchesWithBillingMeta(plainList);
    return { dispatches: enriched, pagination: buildPaginationMeta(total, page, limit) };
};

/* ─────────────────────────────────────────────
   GET DISPATCH BY ID
───────────────────────────────────────────── */
const getDispatchById = async (id) => {
    const dispatch = await Dispatch.findById(id)
        .populate('sourceWarehouseId')
        .populate('destinationStoreId')
        .populate('items.itemId', 'itemName itemCode shade sizes');

    if (!dispatch) return null;

    if ((!dispatch.items || dispatch.items.length === 0) && dispatch.referenceId && dispatch.referenceType) {
        const rebuiltItems = await buildItemsFromReference(dispatch, null);
        if (rebuiltItems.length > 0) {
            dispatch.items = rebuiltItems;
        }
    }

    const plainDispatch = await populateDispatchItemsManual(dispatch);

    if (plainDispatch && plainDispatch.referenceId && plainDispatch.referenceType) {
        if (plainDispatch.referenceType === 'Sale') {
            const Sale = require('../../models/sale.model');
            const sale = await Sale.findById(plainDispatch.referenceId).populate('storeId').populate('destinationStoreId').lean();
            if (sale) {
                plainDispatch.referenceId = sale;
            }
        } else if (plainDispatch.referenceType === 'DeliveryChallan') {
            const DeliveryChallan = require('../../models/deliveryChallan.model');
            const challan = await DeliveryChallan.findById(plainDispatch.referenceId).populate('sourceId').populate('destinationStoreId').lean();
            if (challan) {
                plainDispatch.referenceId = challan;
            }
        }
    }

    return plainDispatch;
};

/* ─────────────────────────────────────────────
   RECEIVE DISPATCH (DISPATCHED → RECEIVED)
   Clears in-transit, adds physical stock to store
   Accepts optional receivedItems for partial/audited receipts
───────────────────────────────────────────── */
const receiveDispatch = async (id, userId, receivedItems = []) => {
    return await withTransaction(async (session) => {
        let dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch not found');

        if (dispatch.status === 'RECEIVED') return dispatch;

        if ((!dispatch.items || dispatch.items.length === 0) && dispatch.referenceId && dispatch.referenceType) {
            const rebuiltItems = await buildItemsFromReference(dispatch, session);
            if (rebuiltItems.length === 0) {
                throw new Error('No dispatch items found for this shipment. Please contact HO/admin.');
            }
            dispatch.items = rebuiltItems;
            await dispatch.save({ session });
        }

        // STRICT VALIDATION FOR QUANTITY MISMATCH (before atomic claim)
        if (receivedItems && receivedItems.length > 0) {
            for (const item of dispatch.items) {
                const verified = receivedItems.find(ri => String(ri.variantId) === String(item.variantId));
                const receivedQty = verified ? Number(verified.receivedQty || 0) : 0;

                if (receivedQty !== Number(item.qty)) {
                    throw new Error(`Quantity Mismatch: Item (${item.barcode || 'N/A'}) was dispatched with quantity ${item.qty}, but store entered ${receivedQty}. You must receive exact dispatched quantity.`);
                }
            }

            for (const ri of receivedItems) {
                const isDispatched = dispatch.items.find(item => String(item.variantId) === String(ri.variantId));
                if (!isDispatched && Number(ri.receivedQty) > 0) {
                    throw new Error(`Mismatch Alert: Attempting to receive an item that was not dispatched.`);
                }
            }
        }

        dispatch = await Dispatch.findOneAndUpdate(
            { _id: id, status: 'DISPATCHED' },
            { $set: { status: 'RECEIVED', receivedAt: new Date() } },
            { new: true, session }
        );

        if (!dispatch) {
            const existing = await Dispatch.findById(id).session(session);
            if (existing?.status === 'RECEIVED') return existing;
            throw new Error('Only dispatched items can be received');
        }

        const itemsToProcess = dispatch.items || [];
        const Item = require('../../models/item.model');
        const Store = require('../../models/store.model');
        const stockService = require('../../services/stock.service');
        const systemConfigService = require('../systemConfig/systemConfig.service');
        const relabelOnTransfer = await systemConfigService.getConfigByKey('relabelOnTransfer', false);
        let destinationStore = null;
        if (relabelOnTransfer) {
            destinationStore = await Store.findById(dispatch.destinationStoreId).session(session);
        }

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
                let targetBarcode = bcode;
                if (relabelOnTransfer) {
                    const storeCode = destinationStore ? destinationStore.storeCode : 'STR';
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

        return dispatch;
    });
};

/* ─────────────────────────────────────────────
   DELETE DISPATCH (Full Reversal)
   Reverses stock movements based on status
───────────────────────────────────────────── */
const deleteDispatch = async (id, userId) => {
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch record not found');

        const status = dispatch.status;
        const items = dispatch.items || [];

        // 1. REVERSE STOCK MOVEMENTS
        if (status === 'RECEIVED') {
            // Reverse Store Addition & Warehouse Deduction
            for (const item of items) {
                const info = await resolveVariantInfo(item.variantId, session);
                
                // Remove from Store
                await stockService.removeStock({
                    itemId: info.itemId,
                    barcode: item.barcode || info.barcode,
                    variantId: item.variantId,
                    locationId: dispatch.destinationStoreId,
                    locationType: 'STORE',
                    qty: item.qty,
                    type: 'ADJUSTMENT',
                    referenceId: dispatch._id,
                    referenceType: 'Dispatch',
                    performedBy: userId,
                    session
                });

                // Add back to Warehouse
                await stockService.addStock({
                    itemId: info.itemId,
                    barcode: info.barcode,
                    variantId: item.variantId,
                    locationId: dispatch.sourceWarehouseId,
                    locationType: 'WAREHOUSE',
                    qty: item.qty,
                    type: 'ADJUSTMENT',
                    referenceId: dispatch._id,
                    referenceType: 'Dispatch',
                    performedBy: userId,
                    session
                });
            }
        } else if (status === 'DISPATCHED') {
            // Reverse Warehouse Deduction
            for (const item of items) {
                const info = await resolveVariantInfo(item.variantId, session);
                
                // Remove from In-Transit (if applicable)
                try {
                    await stockService.removeInTransit({
                        itemId: info.itemId,
                        barcode: info.barcode,
                        variantId: item.variantId,
                        locationId: dispatch.destinationStoreId,
                        locationType: 'STORE',
                        qty: item.qty,
                        session
                    });
                } catch (e) { console.warn('In-transit reversal failed during deletion:', e.message); }

                // Add back to Warehouse
                await stockService.addStock({
                    itemId: info.itemId,
                    barcode: info.barcode,
                    variantId: item.variantId,
                    locationId: dispatch.sourceWarehouseId,
                    locationType: 'WAREHOUSE',
                    qty: item.qty,
                    type: 'ADJUSTMENT',
                    referenceId: dispatch._id,
                    referenceType: 'Dispatch',
                    performedBy: userId,
                    session
                });
            }
        }

        // 2. DELETE RELATED DOCUMENTS
        if (dispatch.referenceType === 'DeliveryChallan' && dispatch.referenceId) {
            await DeliveryChallan.findByIdAndDelete(dispatch.referenceId).session(session);
        } else if (dispatch.referenceType === 'Sale' && dispatch.referenceId) {
            // Maybe don't delete sales, just mark as cancelled? 
            // User asked for full CRUD, so we delete if it's a mistake.
            await Sale.findByIdAndDelete(dispatch.referenceId).session(session);
        }

        // 3. DELETE DISPATCH
        await Dispatch.findByIdAndDelete(id).session(session);

        return { success: true, message: `Dispatch ${dispatch.challanNumber || id} deleted and stock reversed.` };
    });
};

module.exports = {
    createDispatch,
    updateDispatch,
    deleteDispatch,
    packDispatch,
    confirmDispatch,
    cancelDispatch,
    combineAndConfirmDispatch,
    getDispatches,
    getDispatchById,
    receiveDispatch,
    processDispatch: createDispatch // for compatibility
};
