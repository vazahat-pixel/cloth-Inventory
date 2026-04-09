const SupplierOutward = require('../../models/supplierOutward.model');
const Item = require('../../models/item.model');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const stockService = require('../../services/stock.service');

/**
 * Generate unique outward number (e.g. JW-2024-0001)
 */
const generateOutwardNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `JW-${year}-`;
    const seq = await getNextSequence(`JW_OUTWARD_${year}`, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * Issue raw materials to a supplier/tailor
 */
const createOutward = async (outwardData, userId) => {
    return await withTransaction(async (session) => {
        const { supplierId, warehouseId, items, notes, outwardDate, targetItemId } = outwardData;

        const outwardNumber = await generateOutwardNumber(session);

        const outward = new SupplierOutward({
            outwardNumber,
            supplierId,
            warehouseId,
            items: items.map(item => ({
                itemId: item.itemId,
                code: item.code || 'N/A',
                quantity: Number(item.quantity),
                uom: item.uom || 'MTR'
            })),
            notes,
            outwardDate: outwardDate || new Date(),
            targetItemId: targetItemId || null,
            createdBy: userId,
            status: 'PENDING' // Initially pending until shirts arrive
        });

        await outward.save({ session });

        for (const item of items) {
            // Use stockService to handle physical stock deduction + ledger + audit
            let barcode = item.code;
            if (!barcode || barcode === 'N/A' || barcode === '') {
                const itemDoc = await Item.findById(item.itemId).session(session);
                barcode = itemDoc?.itemCode || 'N/A';
            }

            await stockService.removeStock({
                itemId: item.itemId,
                barcode: barcode,
                variantId: item.variantId || item.itemId, // Use itemId as fallback variantId
                locationId: warehouseId,
                locationType: 'WAREHOUSE',
                qty: Math.abs(Number(item.quantity)),
                type: 'MATERIAL_OUTWARD',
                referenceId: outward._id,
                referenceType: 'SupplierOutward',
                performedBy: userId,
                session
            });
        }

        return outward;
    });
};

/**
 * Get all outward records
 */
const getAllOutwards = async (filters = {}) => {
    return await SupplierOutward.find({ ...filters })
        .populate('supplierId', 'name supplierName')
        .populate('warehouseId', 'name')
        .populate('targetItemId', 'itemName itemCode')
        .populate('items.itemId', 'itemName itemCode uom')
        .sort({ createdAt: -1 });
};

/**
 * Get outward by ID
 */
const getOutwardById = async (id) => {
    return await SupplierOutward.findById(id)
        .populate('supplierId', 'name supplierName')
        .populate('warehouseId', 'name')
        .populate('targetItemId', 'itemName itemCode')
        .populate('items.itemId', 'itemName itemCode uom');
};

module.exports = {
    createOutward,
    getAllOutwards,
    getOutwardById
};
