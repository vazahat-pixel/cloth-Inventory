const SupplierOutward = require('../../models/supplierOutward.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const StockLedger = require('../../models/stockLedger.model');
const Item = require('../../models/item.model');

class SupplierOutwardService {
    async createOutward(data, userId) {
        const { supplierId, warehouseId, items, notes } = data;

        if (!items || !items.length) throw new Error('Items array is required');

        // Generate Outward Number (Legacy ERP format: SO-DATE-RANDOM)
        const outwardNumber = `SO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const session = await SupplierOutward.startSession();
        session.startTransaction();

        try {
            const savedItems = [];
            const SupplierInventory = require('../../models/supplierInventory.model');

            for (const line of items) {
                const { itemId, variantId, sku, quantity } = line;

                // 1. Check Warehouse Stock
                const inv = await WarehouseInventory.findOne({ warehouseId, barcode: sku }).session(session);
                if (!inv || inv.quantity < quantity) {
                    throw new Error(`Insufficient stock for ${sku}. Available: ${inv ? inv.quantity : 0}`);
                }

                // 2. Subtract from Warehouse
                inv.quantity -= quantity;
                await inv.save({ session });

                // 3. Add to Supplier Virtual Account
                let suppInv = await SupplierInventory.findOne({ supplierId, barcode: sku }).session(session);
                if (!suppInv) {
                    suppInv = new SupplierInventory({ supplierId, itemId, variantId, barcode: sku, quantity: 0 });
                }
                suppInv.quantity += quantity;
                suppInv.lastUpdated = Date.now();
                await suppInv.save({ session });

                // 4. Create Stock Ledger Entry for Warehouse (OUT)
                const ledgerOut = new StockLedger({
                    itemId,
                    barcode: sku,
                    locationId: warehouseId,
                    locationType: 'WAREHOUSE',
                    type: 'OUT',
                    quantity,
                    source: 'SUPPLIER_OUTWARD',
                    referenceId: outwardNumber,
                    balanceAfter: inv.quantity,
                    userId
                });
                await ledgerOut.save({ session });

                savedItems.push({ itemId, variantId, sku, quantity });
            }

            const outward = new SupplierOutward({
                outwardNumber,
                supplierId,
                warehouseId,
                items: savedItems,
                notes,
                createdBy: userId
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
            .sort({ createdAt: -1 });
    }

    async getOutwardById(id) {
        return SupplierOutward.findById(id)
            .populate('supplierId', 'name supplierName')
            .populate('warehouseId', 'name')
            .populate('items.itemId', 'itemName itemCode shade')
            .populate('createdBy', 'name');
    }
}

module.exports = new SupplierOutwardService();
