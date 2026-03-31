const PurchaseOrder = require('../../models/purchaseOrder.model');
const Purchase = require('../../models/purchase.model'); // Import Purchase model
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const { PurchaseOrderStatus } = require('../../core/enums');

/**
 * Generate unique PO Number (PO-YYYY-XXXXX)
 */
const generatePONumber = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;
    const counterName = `PURCHASE_ORDER_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(6, '0')}`;
};

/**
 * Create PO from an existing Purchase Voucher (Draft/Selection)
 */
const createPOFromPurchase = async (purchaseId, userId) => {
    return await withTransaction(async (session) => {
        const purchase = await Purchase.findById(purchaseId).session(session);
        if (!purchase) throw new Error('Purchase Voucher not found');
        if (purchase.purchaseOrderId) throw new Error('A Purchase Order is already linked to this voucher');

        const poNumber = await generatePONumber(session);
        
        // Map Purchase items to PO items
        const poItems = purchase.products.map(p => ({
            productId: p.productId,
            variantId: p.variantId,
            qty: p.quantity,
            price: p.rate
        }));

        const po = new PurchaseOrder({
            poNumber,
            supplierId: purchase.supplierId,
            storeId: purchase.storeId || purchase.warehouseId,
            items: poItems,
            status: PurchaseOrderStatus.PENDING,
            createdBy: userId,
            notes: `Generated from Voucher: ${purchase.purchaseNumber}. ${purchase.notes || ''}`
        });

        await po.save({ session });

        // Link the PO back to the Purchase document
        purchase.purchaseOrderId = po._id;
        await purchase.save({ session });

        return po;
    });
};

const createPO = async (poData, userId) => {
    return await withTransaction(async (session) => {
        const poNumber = await generatePONumber(session);
        const po = new PurchaseOrder({
            ...poData,
            poNumber,
            createdBy: userId
        });
        await po.save({ session });
        return po;
    });
};

const getAllPOs = async (query) => {
    const { page = 1, limit = 10, supplierId, storeId, status } = query;
    const filter = {};
    if (supplierId) filter.supplierId = supplierId;
    if (storeId) filter.storeId = storeId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
        PurchaseOrder.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('supplierId', 'name')
            .populate('storeId', 'name')
            .populate('createdBy', 'name'),
        PurchaseOrder.countDocuments(filter)
    ]);

    return { orders, total, page: parseInt(page), limit: parseInt(limit) };
};

const getPOById = async (id) => {
    const po = await PurchaseOrder.findById(id)
        .populate('supplierId')
        .populate('storeId')
        .populate('items.productId')
        .populate('createdBy', 'name');
    if (!po) throw new Error('Purchase Order not found');
    return po;
};

const updateStatus = async (id, status, userId) => {
    const po = await PurchaseOrder.findByIdAndUpdate(id, { status }, { new: true });
    if (!po) throw new Error('Purchase Order not found');
    return po;
};

const updatePO = async (id, poData, userId) => {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw new Error('Purchase Order not found');
    if (['RECEIVED', 'CANCELLED'].includes(po.status)) {
        throw new Error('Cannot update PO in current status');
    }

    Object.assign(po, poData);
    await po.save();
    return po;
};

module.exports = {
    createPO,
    getAllPOs,
    getPOById,
    updateStatus,
    updatePO
};
