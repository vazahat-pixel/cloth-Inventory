const PurchaseOrder = require('../../models/purchaseOrder.model');
const { PurchaseOrderStatus } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');

const createPurchaseOrder = async (poData, userId) => {
    return await withTransaction(async (session) => {
        const year = new Date().getFullYear();
        const seq = await getNextSequence(`PO_${year}`, session);
        const poNumber = `PO-${year}-${seq.toString().padStart(6, '0')}`;

        const po = new PurchaseOrder({
            ...poData,
            poNumber,
            status: PurchaseOrderStatus.PENDING,
            createdBy: userId
        });

        await po.save({ session });
        return po;
    });
};

const getPOById = async (id) => {
    return await PurchaseOrder.findById(id).populate('supplierId items.productId');
};

const listPOs = async (query) => {
    const { supplierId, status } = query;
    const filter = {};
    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.status = status;
    return await PurchaseOrder.find(filter).sort({ createdAt: -1 }).populate('supplierId');
};

module.exports = {
    createPurchaseOrder,
    getPOById,
    listPOs
};
