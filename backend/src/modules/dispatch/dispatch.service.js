const Dispatch = require('../../models/dispatch.model');
const { DispatchStatus, DocumentType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { removeStock, addStock } = require('../../services/stock.service');
const { getNextSequence } = require('../../services/sequence.service');
const workflowService = require('../workflow/workflow.service');

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
 * CREATE DISPATCH (Warehouse -> Store Movement)
 * Initial state: PENDING. No stock moved yet.
 */
const createDispatch = async (dispatchData, userId) => {
    return await withTransaction(async (session) => {
        const dispatchNumber = await generateDispatchNumber(session);
        
        // Use products array naming as per common frontend payload
        const rawItems = dispatchData.items || dispatchData.products || [];
        const items = rawItems.map(item => ({
            variantId: item.variantId || item.productId,
            qty: Number(item.qty || item.quantity)
        }));

        const dispatch = new Dispatch({
            ...dispatchData,
            items,
            dispatchNumber,
            status: DispatchStatus.PENDING,
            createdBy: userId
        });

        await dispatch.save({ session });

        // Log in workflow
        await workflowService.updateStatus(dispatch._id, DocumentType.DISPATCH, null, DispatchStatus.PENDING, userId, `Dispatch ${dispatchNumber} created in PENDING state.`);

        return dispatch;
    });
};

/**
 * UPDATE DISPATCH STATUS
 * Performs atomic stock transfer during DISPATCHED state change.
 */
const updateDispatchStatus = async (id, status, userId) => {
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch record not found');

        const oldStatus = dispatch.status;
        if (oldStatus === status) return dispatch;

        if (status === DispatchStatus.DISPATCHED && oldStatus === DispatchStatus.PENDING) {
            // ATOMIC STOCK MOVEMENT: Warehouse -> Store
            const stockService = require('../../services/stock.service');
            
            for (const item of dispatch.items) {
                await stockService.transferStock({
                    variantId: item.variantId,
                    fromLocationId: dispatch.sourceWarehouseId,
                    fromLocationType: 'WAREHOUSE',
                    toLocationId: dispatch.destinationStoreId,
                    toLocationType: 'STORE',
                    qty: item.qty,
                    referenceId: dispatch._id,
                    referenceType: 'Dispatch',
                    performedBy: userId,
                    session
                });
            }
            dispatch.dispatchedAt = Date.now();
        } else if (status === DispatchStatus.RECEIVED && oldStatus === DispatchStatus.DISPATCHED) {
            dispatch.receivedAt = Date.now();
        } else if (status === DispatchStatus.CANCELLED && oldStatus === DispatchStatus.PENDING) {
             // Just cancel, no stock moved yet
        } else {
            throw new Error(`Invalid status transition from ${oldStatus} to ${status}`);
        }

        dispatch.status = status;
        await dispatch.save({ session });

        // Log in workflow
        await workflowService.updateStatus(dispatch._id, DocumentType.DISPATCH, oldStatus, status, userId, `Dispatch ${dispatch.dispatchNumber} updated to ${status}`);

        return dispatch;
    });
};

const getDispatchById = async (id) => {
    return await Dispatch.findById(id)
        .populate('sourceWarehouseId', 'name')
        .populate('destinationStoreId', 'name')
        .populate('items.variantId', 'name sku barcode');
};

const getDispatches = async (query = {}) => {
    const { status, sourceWarehouseId, destinationStoreId } = query;
    const filter = {};
    if (status) filter.status = status;
    if (sourceWarehouseId) filter.sourceWarehouseId = sourceWarehouseId;
    if (destinationStoreId) filter.destinationStoreId = destinationStoreId;

    return await Dispatch.find(filter)
        .sort({ updatedAt: -1 })
        .populate('sourceWarehouseId', 'name')
        .populate('destinationStoreId', 'name');
};

module.exports = {
    createDispatch,
    completeDispatch,
    getDispatchById,
    getDispatches
};
