const DeliveryChallan = require('../../models/deliveryChallan.model');
const { removeStock } = require('../../services/stock.service');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const workflowService = require('../workflow/workflow.service');
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
 * Reduces inventory but does NO ledger impact (Standard ERP)
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

        // 1. REDUCE PHYSICAL STOCK FROM SOURCE
        for (const item of challanData.items) {
            await removeStock({
                variantId: item.productId,
                locationId: challanData.sourceId || challanData.storeId,
                locationType: 'STORE',
                qty: item.quantity,
                type: StockMovementType.TRANSFER,
                referenceId: challan._id,
                referenceType: 'DeliveryChallan',
                performedBy: userId,
                session
            });
        }
        
        // Update workflow
        await workflowService.updateStatus(challan._id, DocumentType.SALE, null, 'SENT', userId, `Challan ${dcNumber} issued for shipment`);

        return challan;
    };

    if (sessionOuter) return await handle(sessionOuter);
    return await withTransaction(handle);
};

const getChallans = async (filter = {}) => {
    return await DeliveryChallan.find(filter)
        .sort({ createdAt: -1 })
        .populate('customerId', 'name')
        .populate('storeId', 'name')
        .populate('items.productId', 'name sku');
};

const getChallanById = async (id) => {
    return await DeliveryChallan.findById(id)
        .populate('customerId')
        .populate('storeId')
        .populate('items.productId');
};

module.exports = {
    createChallan,
    getChallans,
    getChallanById
};
