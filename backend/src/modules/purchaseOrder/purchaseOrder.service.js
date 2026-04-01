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
        .populate('warehouseId', 'name')
        .populate('items.itemId', 'itemName itemCode shade');
};

const getPOById = async (id) => {
    return await PurchaseOrder.findById(id)
        .populate('supplierId')
        .populate('warehouseId')
        .populate('items.itemId');
};

/**
 * SYNC PO STATUS: Triggers after GRN approval to check if PO is partially or fully received.
 */
const syncPoStatus = async (id, session = null) => {
    const GRN = require('../../models/grn.model');
    const { GrnStatus } = require('../../core/enums');

    const po = await PurchaseOrder.findById(id).session(session);
    if (!po) return;

    const grns = await GRN.find({ purchaseOrderId: id, status: GrnStatus.APPROVED, isDeleted: false }).session(session);
    
    const receivedMap = new Map();
    grns.forEach(g => {
        g.items.forEach(item => {
            const key = item.variantId.toString();
            receivedMap.set(key, (receivedMap.get(key) || 0) + item.receivedQty);
        });
    });

    let anyReceived = false;
    let allReceived = true;

    po.items.forEach(item => {
        const variantId = item.variantId.toString();
        const received = receivedMap.get(variantId) || 0;
        const ordered = item.qty || 0;

        if (received > 0) anyReceived = true;
        if (received < ordered) allReceived = false;
    });

    let newStatus = po.status;
    if (allReceived) {
        newStatus = PurchaseOrderStatus.COMPLETED;
    } else if (anyReceived) {
        newStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
    }

    if (newStatus !== po.status) {
        po.status = newStatus;
        await po.save({ session });
    }
};

module.exports = {
    createPO,
    updateStatus,
    getPOs,
    getPOById,
    syncPoStatus
};
