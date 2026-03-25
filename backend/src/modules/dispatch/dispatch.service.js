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
 * Requirement: Execute stock reduction and increase at creation phase.
 */
const createDispatch = async (dispatchData, userId) => {
    return await withTransaction(async (session) => {
        const dispatchNumber = await generateDispatchNumber(session);
        
        // 1. STOCK MOVEMENT ENGINE (Transactional)
        for (const item of dispatchData.items) {
            // Reduce from Warehouse
            await removeStock({
                variantId: item.variantId,
                locationId: dispatchData.sourceWarehouseId,
                locationType: 'WAREHOUSE',
                qty: item.qty,
                type: 'TRANSFER',
                referenceId: null, // Update later after save
                referenceType: 'Dispatch',
                performedBy: userId,
                session
            });

            // Increase in Store
            await addStock({
                variantId: item.variantId,
                locationId: dispatchData.destinationStoreId,
                locationType: 'STORE',
                qty: item.qty,
                type: 'TRANSFER',
                referenceId: null, // Update later after save
                referenceType: 'Dispatch',
                performedBy: userId,
                session
            });
        }

        // 2. Save Dispatch Document (Auto-DISPATCHED)
        const dispatch = new Dispatch({
            ...dispatchData,
            dispatchNumber,
            status: DispatchStatus.DISPATCHED,
            dispatchedAt: Date.now(),
            createdBy: userId
        });

        await dispatch.save({ session });

        // Update referenceId in StockMovements if needed (internal logic usually handles it via movement model)
        
        // Log in workflow
        await workflowService.updateStatus(dispatch._id, DocumentType.DISPATCH, null, DispatchStatus.DISPATCHED, userId, `Dispatch ${dispatchNumber} created: Stock moved Warehouse -> Store`);

        return dispatch;
    });
};

/**
 * COMPLETE DISPATCH (Receipt Confirmation)
 * Status update to RECEIVED.
 */
const completeDispatch = async (id, userId) => {
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch record not found');
        if (dispatch.status === DispatchStatus.RECEIVED) {
            throw new Error('Dispatch already received and completed');
        }

        dispatch.status = DispatchStatus.RECEIVED;
        dispatch.receivedAt = Date.now();
        await dispatch.save({ session });

        // Log receipt
        await workflowService.updateStatus(dispatch._id, DocumentType.DISPATCH, DispatchStatus.DISPATCHED, DispatchStatus.RECEIVED, userId, `Dispatch ${dispatch.dispatchNumber} marked as RECEIVED`);

        return dispatch;
    });
};

const getDispatchById = async (id) => {
    return await Dispatch.findById(id)
        .populate('sourceWarehouseId', 'name')
        .populate('destinationStoreId', 'name')
        .populate('items.variantId', 'name sku');
};

const getDispatches = async (filter = {}) => {
    return await Dispatch.find(filter)
        .sort({ createdAt: -1 })
        .populate('sourceWarehouseId', 'name')
        .populate('destinationStoreId', 'name');
};

module.exports = {
    createDispatch,
    completeDispatch,
    getDispatchById,
    getDispatches
};
