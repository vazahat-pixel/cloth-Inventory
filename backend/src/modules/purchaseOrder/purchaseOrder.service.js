const PurchaseOrder = require('../../models/purchaseOrder.model');
const { getNextSequence } = require('../../services/sequence.service');
const { PurchaseOrderStatus } = require('../../core/enums');

/**
 * Generate unique PO Number (PO-YYYY-XXXXX)
 */
const generatePoNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;
    const counterName = `PO_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * CREATE: No inventory or ledger impact
 */
const createPO = async (poData, userId) => {
    const poNumber = await generatePoNumber();
    const po = new PurchaseOrder({
        ...poData,
        poNumber,
        createdBy: userId,
        status: PurchaseOrderStatus.DRAFT
    });
    
    await po.save();
    return po;
};

/**
 * UPDATE STATUS: State control only
 */
const updateStatus = async (id, status, userId) => {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw new Error('Purchase Order not found');
    
    po.status = status;
    await po.save();
    return po;
};

const getPOs = async (filter = {}) => {
    return await PurchaseOrder.find(filter)
        .populate('supplierId', 'name')
        .populate('items.itemId', 'itemName itemCode shade');
};

const getPOById = async (id) => {
    return await PurchaseOrder.findById(id)
        .populate('supplierId')
        .populate('items.itemId');
};

module.exports = {
    createPO,
    updateStatus,
    getPOs,
    getPOById
};
