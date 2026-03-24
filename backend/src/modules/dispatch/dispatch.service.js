const Dispatch = require('../../models/dispatch.model');
const { DispatchStatus, DocumentType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const stockService = require('../../services/stock.service');
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
 * Create a new Dispatch record (PENDING)
 */
const createDispatch = async (dispatchData, userId) => {
    return await withTransaction(async (session) => {
        const dispatchNumber = await generateDispatchNumber(session);
        
        const dispatch = new Dispatch({
            ...dispatchData,
            dispatchNumber,
            status: DispatchStatus.PENDING,
            createdBy: userId
        });

        await dispatch.save({ session });

        // Workflow logging
        await workflowService.updateStatus(dispatch._id, DocumentType.DISPATCH, null, DispatchStatus.PENDING, userId, `Dispatch ${dispatchNumber} created from Order ${dispatchData.orderId || 'N/A'}`);

        return dispatch;
    });
};

/**
 * Complete Dispatch (Execute movement)
 * Moves stock from Warehouse to Store
 */
const completeDispatch = async (id, userId) => {
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch not found');
        if (dispatch.status !== DispatchStatus.PENDING) {
            throw new Error(`Cannot complete dispatch in ${dispatch.status} status`);
        }

        // Execute stock transfers for each item
        for (const item of dispatch.items) {
            await stockService.transferStock({
                variantId: item.variantId,
                fromLocationId: dispatch.source,
                fromLocationType: 'WAREHOUSE',
                toLocationId: dispatch.destination,
                toLocationType: 'STORE',
                qty: item.qty,
                type: 'TRANSFER',
                referenceId: dispatch._id,
                referenceType: 'Dispatch',
                performedBy: userId,
                session
            });
        }

        // Update dispatch status
        const oldStatus = dispatch.status;
        dispatch.status = DispatchStatus.DELIVERED;
        dispatch.deliveredAt = Date.now();
        await dispatch.save({ session });

        // Workflow logging
        await workflowService.updateStatus(dispatch._id, DocumentType.DISPATCH, oldStatus, DispatchStatus.DELIVERED, userId, `Dispatch ${dispatch.dispatchNumber} completed and delivered`);

        return dispatch;
    });
};

const getDispatchById = async (id) => {
    const dispatch = await Dispatch.findById(id)
        .populate('source', 'name')
        .populate('destination', 'name')
        .populate('items.variantId', 'name sku barcode');
    if (!dispatch) throw new Error('Dispatch not found');
    return dispatch;
};

const getAllDispatches = async (filter = {}) => {
    return await Dispatch.find(filter)
        .sort({ createdAt: -1 })
        .populate('source', 'name')
        .populate('destination', 'name');
};

module.exports = {
    createDispatch,
    completeDispatch,
    getDispatchById,
    getAllDispatches
};
