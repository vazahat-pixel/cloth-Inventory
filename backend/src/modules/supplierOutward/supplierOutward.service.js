const SupplierOutward = require('../../models/supplierOutward.model');
const RawMaterial = require('../../models/rawMaterial.model');
const StockLedger = require('../../models/stockLedger.model');

class SupplierOutwardService {
    async createOutward(data, userId) {
        const { supplierId, warehouseId, items, notes } = data;

        if (!items || !items.length) throw new Error('Materials list is required');

        // Generate Outward Number (Legacy ERP format: SO-DATE-RANDOM)
        const outwardNumber = `M-ISSUE-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        const session = await SupplierOutward.startSession();
        session.startTransaction();

        try {
            const savedItems = [];

            for (const line of items) {
                const { rawMaterialId, quantity } = line;

                // 1. Check Raw Material Master Stock
                const rm = await RawMaterial.findById(rawMaterialId).session(session);
                if (!rm) throw new Error(`Raw Material not found for ID: ${rawMaterialId}`);
                
                if (rm.currentStock < quantity) {
                    throw new Error(`Insufficient stock for ${rm.name}. Available: ${rm.currentStock} ${rm.uom}`);
                }

                // 2. Subtract from Master Stock
                rm.currentStock -= quantity;
                rm.lastIssueDate = new Date();
                await rm.save({ session });

                // 3. Create Stock Ledger Entry for Audit
                const ledgerOut = new StockLedger({
                    itemId: rawMaterialId, // Using RM ID in itemId field of ledger
                    locationId: warehouseId || 'MAIN_WH',
                    locationType: 'WAREHOUSE',
                    type: 'OUT',
                    quantity,
                    source: 'RAW_MATERIAL_ISSUE',
                    referenceId: outwardNumber,
                    balanceAfter: rm.currentStock,
                    userId
                });
                await ledgerOut.save({ session });

                savedItems.push({ 
                    rawMaterialId, 
                    code: rm.code, 
                    quantity, 
                    uom: rm.uom 
                });
            }

            const outward = new SupplierOutward({
                outwardNumber,
                supplierId,
                warehouseId: warehouseId || '65e1234567890abcdef12345', // Use a default or valid ID
                items: savedItems,
                notes,
                createdBy: userId,
                status: 'COMPLETED'
            });

            await outward.save({ session });
            await session.commitTransaction();
            
            return outward;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getOutwards(query = {}) {
        return SupplierOutward.find(query)
            .populate('supplierId', 'name supplierName')
            .populate('warehouseId', 'name')
            .populate('createdBy', 'name')
            .populate('items.rawMaterialId', 'name code materialType uom')
            .sort({ createdAt: -1 });
    }

    async getOutwardById(id) {
        return SupplierOutward.findById(id)
            .populate('supplierId', 'name supplierName')
            .populate('warehouseId', 'name')
            .populate('items.rawMaterialId', 'name code materialType uom')
            .populate('createdBy', 'name');
    }
}

module.exports = new SupplierOutwardService();
