const MaterialConsumption = require('../../models/materialConsumption.model');
const SupplierOutward = require('../../models/supplierOutward.model');
const RawMaterial = require('../../models/rawMaterial.model');
const StockLedger = require('../../models/stockLedger.model');

class MaterialConsumptionService {
    async createConsumption(data, userId) {
        const { sourceOutwardId, supplierId, items, notes, consumptionDate } = data;

        if (!items || !items.length) throw new Error('Materials used list is required');

        const consumptionNumber = `CONS-${Date.now().toString().slice(-6)}`;

        // No transaction here to keep it simple as requested
        const consumption = new MaterialConsumption({
            consumptionNumber,
            supplierId,
            sourceOutwardId,
            items: items.map(i => ({
                rawMaterialId: i.rawMaterialId,
                quantityUsed: i.quantityUsed,
                wastage: i.wastage || 0,
                notes: i.notes
            })),
            notes,
            consumptionDate: consumptionDate || Date.now(),
            createdBy: userId
        });

        await consumption.save();

        // Optional: Update Outward status to show consumption started? 
        // For now, just return the log.
        return consumption;
    }

    async getConsumptions(query = {}) {
        return MaterialConsumption.find(query)
            .populate('supplierId', 'name supplierName')
            .populate('sourceOutwardId', 'outwardNumber')
            .populate('items.rawMaterialId', 'name code uom')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
    }

    async getConsumptionById(id) {
        return MaterialConsumption.findById(id)
            .populate('supplierId', 'name supplierName')
            .populate('sourceOutwardId', 'outwardNumber items')
            .populate('items.rawMaterialId', 'name code uom')
            .populate('createdBy', 'name');
    }
}

module.exports = new MaterialConsumptionService();
