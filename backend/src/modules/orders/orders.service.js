const mongoose = require('mongoose');
const SaleOrder = require('../../models/saleOrder.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const StockMovement = require('../../models/stockMovement.model');

const generateOrderNumber = async () => {
    const count = await SaleOrder.countDocuments();
    return `SO-${String(count + 1).padStart(6, '0')}`;
};

const getAllSaleOrders = async (query = {}) => {
    const { page = 1, limit = 50, status, storeId } = query;
    const filter = {};
    if (status) filter.status = status;
    if (storeId) filter.storeId = storeId;
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
        SaleOrder.find(filter)
            .populate('customerId', 'name phone')
            .populate('storeId', 'name')
            .populate('items.productId', 'name sku size color')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        SaleOrder.countDocuments(filter)
    ]);
    return { orders, total, page: parseInt(page), limit: parseInt(limit) };
};

const getSaleOrderById = async (id) => {
    const order = await SaleOrder.findById(id)
        .populate('customerId', 'name phone email')
        .populate('storeId', 'name')
        .populate('items.productId', 'name sku size color salePrice')
        .populate('createdBy', 'name');
    if (!order) throw new Error('Sale order not found');
    return order;
};

const createSaleOrder = async (data, userId) => {
    const orderNumber = await generateOrderNumber();
    const items = data.items || [];
    const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.rate * (1 - (item.discount || 0) / 100)), 0);
    const grandTotal = subTotal - (data.discount || 0);

    const order = await SaleOrder.create({
        ...data,
        orderNumber,
        subTotal: Number(subTotal.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        createdBy: userId
    });
    return order.populate('customerId storeId');
};

const updateSaleOrder = async (id, updates, userId) => {
    if (updates.items) {
        const subTotal = updates.items.reduce((sum, item) => sum + (item.quantity * item.rate * (1 - (item.discount || 0) / 100)), 0);
        updates.subTotal = Number(subTotal.toFixed(2));
        updates.grandTotal = Number((subTotal - (updates.discount || 0)).toFixed(2));
    }
    const order = await SaleOrder.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })
        .populate('customerId', 'name phone')
        .populate('storeId', 'name');
    if (!order) throw new Error('Sale order not found');
    return order;
};

const createPackingSlip = async (data, userId) => {
    const { orderId, packedBy, notes, reserveStock, warehouseId } = data;
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await SaleOrder.findById(orderId).session(session);
        if (!order) throw new Error('Sale order not found');

        let isStockReserved = false;
        
        // Optional stock reservation
        if (reserveStock && warehouseId) {
            for (const item of order.items) {
                // Upsert reserved quantity in warehouse inventory
                await WarehouseInventory.findOneAndUpdate(
                    { warehouseId, productId: item.productId },
                    { $inc: { reservedQuantity: item.quantity } },
                    { new: true, upsert: true, session }
                );
            }
            isStockReserved = true;
            order.warehouseId = warehouseId;
        }

        order.status = 'DISPATCHED';
        order.isStockReserved = isStockReserved;
        if (notes) order.notes = order.notes ? `${order.notes}\nPacking Slip: ${notes}` : `Packing Slip: ${notes}`;
        
        await order.save({ session });
        
        await session.commitTransaction();
        session.endSession();
        return { orderId, packedBy, notes, items: order.items, reserveStock, warehouseId, status: 'DISPATCHED', order };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};

const createDeliveryOrder = async (data, userId) => {
    const { orderId, deliveredBy, notes, warehouseId } = data;
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await SaleOrder.findById(orderId).session(session);
        if (!order) throw new Error('Sale order not found');

        // Determine which warehouse to deduct from
        const fulfillmentWarehouseId = warehouseId || order.warehouseId;
        
        if (fulfillmentWarehouseId) {
            // Deduct physical quantity and clear reserved quantity (if previously reserved)
            for (const item of order.items) {
                const updateQuery = { $inc: { quantity: -item.quantity } };
                if (order.isStockReserved) {
                    updateQuery.$inc.reservedQuantity = -item.quantity;
                }
                
                const inv = await WarehouseInventory.findOneAndUpdate(
                    { warehouseId: fulfillmentWarehouseId, productId: item.productId },
                    updateQuery,
                    { new: true, session }
                );

                if (!inv || inv.quantity < 0) {
                    throw new Error(`Insufficient physical stock for product ${item.productId} in warehouse ${fulfillmentWarehouseId}`);
                }

                // Create stock movement record
                await StockMovement.create([{
                    variantId: item.productId,
                    qty: item.quantity,
                    type: 'SALE',
                    referenceId: order._id,
                    referenceType: 'Sale',
                    fromLocation: fulfillmentWarehouseId,
                    performedBy: userId
                }], { session });
            }
        } else {
            console.warn(`Delivery order completed for SO ${order.orderNumber} without warehouse mapping.`);
        }

        order.status = 'DELIVERED';
        if (notes) order.notes = order.notes ? `${order.notes}\nDelivery Order: ${notes}` : `Delivery Order: ${notes}`;
        
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();
        return { orderId, deliveredBy, notes, status: 'DELIVERED', order };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};

module.exports = {
    getAllSaleOrders,
    getSaleOrderById,
    createSaleOrder,
    updateSaleOrder,
    createPackingSlip,
    createDeliveryOrder
};
