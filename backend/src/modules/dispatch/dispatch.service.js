const Dispatch = require('../../models/dispatch.model');
const Store = require('../../models/store.model');
const Product = require('../../models/product.model');
const { DispatchStatus, StockHistoryType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { adjustStock, adjustStoreStock } = require('../../services/stock.service');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getNextSequence } = require('../../services/sequence.service');

/**
 * Generate unique Dispatch Number (DSP-YYYY-XXXXX)
 */
const generateDispatchNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `DSP-${year}-`;
    const counterName = `DISPATCH_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * Create a new Dispatch
 */
const createDispatch = async (dispatchData, userId) => {
    return await withTransaction(async (session) => {
        const { storeId, products } = dispatchData;

        // 1. Validate Store
        const store = await Store.findOne({ _id: storeId, isDeleted: false }).session(session);
        if (!store) throw new Error('Store not found');
        if (!store.isActive) throw new Error('Store is currently inactive');

        // 2. Validate Products and Factory Stock
        for (const item of products) {
            const product = await Product.findOne({ _id: item.productId, isDeleted: false }).session(session);
            if (!product) throw new Error(`Product ${item.productId} not found`);
            if (!product.isActive) throw new Error(`Product ${product.sku} is inactive`);
            if (product.factoryStock < item.quantity) {
                throw new Error(`Insufficient factory stock for ${product.sku}. Available: ${product.factoryStock}, Requested: ${item.quantity}`);
            }
            // Set current price for record
            item.price = product.salePrice;
        }

        // 3. Generate Dispatch Number
        const dispatchNumber = await generateDispatchNumber(session);

        // 4. Create Dispatch Record
        const dispatch = new Dispatch({
            ...dispatchData,
            dispatchNumber,
            createdBy: userId
        });
        await dispatch.save({ session });

        // 5. Update Stock (Factory Out)
        for (const item of products) {
            await adjustStock({
                productId: item.productId,
                quantityChange: -item.quantity,
                type: StockHistoryType.DISPATCH,
                referenceId: dispatch._id,
                referenceModel: 'Dispatch',
                performedBy: userId,
                notes: `Dispatch to ${store.name}`,
                session
            });
        }

        // 6. Audit Log
        await createAuditLog({
            performedBy: userId,
            action: 'CREATE_DISPATCH',
            module: 'DISPATCH',
            targetId: dispatch._id,
            targetModel: 'Dispatch',
            after: dispatch.toObject(),
            session
        });

        return dispatch;
    });
};

/**
 * Update Dispatch Status (SHIPPED / RECEIVED)
 */
const updateStatus = async (id, status, userId) => {
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findOne({ _id: id, isDeleted: false }).session(session);
        if (!dispatch) throw new Error('Dispatch record not found');

        const oldStatus = dispatch.status;
        if (oldStatus === DispatchStatus.RECEIVED) {
            throw new Error('This dispatch has already been received');
        }

        // Handle RECEIVED logic
        if (status === DispatchStatus.RECEIVED && oldStatus !== DispatchStatus.RECEIVED) {
            // Update Store Inventory
            for (const item of dispatch.products) {
                await adjustStoreStock({
                    productId: item.productId,
                    storeId: dispatch.storeId,
                    quantityChange: item.quantity,
                    type: StockHistoryType.IN,
                    referenceId: dispatch._id,
                    referenceModel: 'Dispatch',
                    performedBy: userId,
                    notes: `Received from Dispatch ${dispatch.dispatchNumber}`,
                    session
                });
            }
            dispatch.receivedDate = Date.now();
        }

        dispatch.status = status;
        await dispatch.save({ session });

        // Audit Log
        await createAuditLog({
            performedBy: userId,
            action: 'UPDATE_DISPATCH_STATUS',
            module: 'DISPATCH',
            targetId: dispatch._id,
            targetModel: 'Dispatch',
            before: { status: oldStatus },
            after: { status },
            session
        });

        return dispatch;
    });
};

/**
 * List Dispatches
 */
const getAllDispatches = async (query) => {
    const { page = 1, limit = 10, storeId, status, startDate, endDate } = query;

    const filter = { isDeleted: false };
    if (storeId) filter.storeId = storeId;
    if (status) filter.status = status;

    if (startDate || endDate) {
        filter.dispatchDate = {};
        if (startDate) filter.dispatchDate.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.dispatchDate.$lte = end;
        }
    }

    const skip = (page - 1) * limit;

    const [dispatches, total] = await Promise.all([
        Dispatch.find(filter)
            .sort({ dispatchDate: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('storeId', 'name location')
            .populate('products.productId', 'name sku barcode size color')
            .populate('createdBy', 'name'),
        Dispatch.countDocuments(filter)
    ]);

    return { dispatches, total, page: parseInt(page), limit: parseInt(limit) };
};

const getDispatchById = async (id) => {
    const dispatch = await Dispatch.findOne({ _id: id, isDeleted: false })
        .populate('storeId')
        .populate('products.productId')
        .populate('createdBy', 'name');
    if (!dispatch) throw new Error('Dispatch not found');
    return dispatch;
};

const deleteDispatch = async (id, userId) => {
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findOne({ _id: id, isDeleted: false }).session(session);
        if (!dispatch) throw new Error('Dispatch not found');

        // 1. Restore Factory Stock (always needed since stock decreases on creation)
        for (const item of dispatch.products) {
            await adjustStock({
                productId: item.productId,
                quantityChange: item.quantity,
                type: StockHistoryType.ADJUSTMENT,
                referenceId: dispatch._id,
                referenceModel: 'Dispatch',
                performedBy: userId,
                notes: `System: Stock restored due to dispatch ${dispatch.dispatchNumber} deletion`,
                session
            });
        }

        // 2. If it was already RECEIVED, reduce Store Stock as well
        if (dispatch.status === DispatchStatus.RECEIVED) {
            for (const item of dispatch.products) {
                await adjustStoreStock({
                    productId: item.productId,
                    storeId: dispatch.storeId,
                    quantityChange: -item.quantity,
                    type: StockHistoryType.ADJUSTMENT,
                    referenceId: dispatch._id,
                    referenceModel: 'Dispatch',
                    performedBy: userId,
                    notes: `System: Store stock reduced due to dispatch ${dispatch.dispatchNumber} deletion`,
                    session
                });
            }
        }

        // 3. Mark as deleted
        dispatch.isDeleted = true;
        await dispatch.save({ session });

        // 4. Audit Log
        await createAuditLog({
            performedBy: userId,
            action: 'DELETE_DISPATCH',
            module: 'DISPATCH',
            targetId: dispatch._id,
            targetModel: 'Dispatch',
            before: { isDeleted: false },
            after: { isDeleted: true },
            session
        });

        return dispatch;
    });
};

module.exports = {
    createDispatch,
    updateStatus,
    getAllDispatches,
    getDispatchById,
    deleteDispatch
};
