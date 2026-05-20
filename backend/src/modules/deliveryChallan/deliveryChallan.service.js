const DeliveryChallan = require('../../models/deliveryChallan.model');
const { removeStock } = require('../../services/stock.service');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const workflowService = require('../workflow/workflow.service.js');
const { DocumentType, StockMovementType } = require('../../core/enums');

const generateChallanNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `DC-${year}-`;
    const counterName = `DELIVERY_CHALLAN_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * CREATE DELIVERY CHALLAN
 * Reduces inventory from source (Warehouse) and marks as SENT
 */
const createChallan = async (challanData, userId, sessionOuter = null) => {
    const handle = async (session) => {
        const dcNumber = await generateChallanNumber(session);

        const challan = new DeliveryChallan({
            ...challanData,
            dcNumber,
            status: 'SENT',
            createdBy: userId
        });

        await challan.save({ session });

        // 1. DEDUCT PHYSICAL STOCK FROM SOURCE (Warehouse) in parallel
        const stockService = require('../../services/stock.service');
        await Promise.all(challanData.items.map(async (item) => {
            await stockService.removeStock({
                itemId: item.itemId,
                barcode: item.barcode,
                variantId: item.variantId,
                locationId: challan.sourceId,
                locationType: 'WAREHOUSE',
                qty: item.quantity,
                type: 'TRANSFER',
                referenceId: challan._id,
                referenceType: 'DeliveryChallan',
                performedBy: userId,
                session
            });
        }));
        
        return challan;
    };

    if (sessionOuter) return await handle(sessionOuter);
    return await withTransaction(handle);
};

const getChallans = async (filter = {}) => {
    const challans = await DeliveryChallan.find(filter)
        .sort({ createdAt: -1 })
        .populate('sourceId', 'name')
        .populate('destinationStoreId', 'name')
        .populate({
            path: 'items.itemId',
            select: 'itemName itemCode shade sizes categoryId hsCodeId hsnCode brandName brand',
            populate: [
                { path: 'categoryId', select: 'name' },
                { path: 'hsCodeId', select: 'code gstPercent' }
            ]
        });
    challans.forEach(challan => {
        if (challan.items) {
            challan.items.forEach(item => {
                const hsn = item.hsnCode || item.itemId?.hsCodeId?.code || item.itemId?.hsnCode;
                if (!hsn) {
                    console.warn(`[HSN_VALIDATION_WARNING] Challan item "${item.itemId?.itemName || 'Item'}" (ID: ${item.itemId?._id || item.itemId}) is missing HSN code configuration.`);
                }
            });
        }
    });
    return challans;
};

const receiveChallan = async (challanId, userId) => {
    return await withTransaction(async (session) => {
        const challan = await DeliveryChallan.findById(challanId).session(session);
        if (!challan) throw new Error('Challan not found');
        if (challan.status !== 'SENT') throw new Error(`Cannot receive challan in ${challan.status} status`);

        const stockService = require('../../services/stock.service');
        
        // 1. ADD PHYSICAL STOCK TO DESTINATION (Store)
        for (const item of challan.items) {
            await stockService.addStock({
                itemId: item.itemId,
                barcode: item.barcode,
                variantId: item.variantId,
                locationId: challan.destinationStoreId,
                locationType: 'STORE',
                qty: item.quantity,
                type: 'TRANSFER',
                referenceId: challan._id,
                referenceType: 'DeliveryChallan',
                performedBy: userId,
                session
            });
        }

        challan.status = 'RECEIVED';
        challan.receivedAt = Date.now();
        await challan.save({ session });

        return challan;
    });
};

const getChallanById = async (id) => {
    const challan = await DeliveryChallan.findById(id)
        .populate('sourceId', 'name')
        .populate('destinationStoreId', 'name')
        .populate({
            path: 'items.itemId',
            select: 'itemName itemCode shade sizes categoryId hsCodeId hsnCode brandName brand',
            populate: [
                { path: 'categoryId', select: 'name' },
                { path: 'hsCodeId', select: 'code gstPercent' }
            ]
        });
    if (challan && challan.items) {
        challan.items.forEach(item => {
            const hsn = item.hsnCode || item.itemId?.hsCodeId?.code || item.itemId?.hsnCode;
            if (!hsn) {
                console.warn(`[HSN_VALIDATION_WARNING] Challan item "${item.itemId?.itemName || 'Item'}" (ID: ${item.itemId?._id || item.itemId}) is missing HSN code configuration.`);
            }
        });
    }
    return challan;
};

module.exports = {
    createChallan,
    getChallans,
    getChallanById,
    receiveChallan
};
