const SupplierInventory = require('../../models/supplierInventory.model');
const { sendSuccess } = require('../../utils/response.handler');

const getSupplierStock = async (req, res, next) => {
    try {
        const { supplierId } = req.params;
        const inventory = await SupplierInventory.find({ supplierId })
            .populate('itemId', 'itemName itemCode shade uom');
        return sendSuccess(res, { inventory }, 'Supplier inventory retrieved');
    } catch (e) { next(e); }
};

const getMaterialLedger = async (req, res, next) => {
    try {
        const { supplierId } = req.params;
        const MaterialConsumption = require('../../models/materialConsumption.model');
        // Ensure schemas are registered before populating
        require('../../models/supplierOutward.model');
        require('../../models/grn.model');

        const balances = await SupplierInventory.find({ supplierId })
             .populate('itemId', 'itemName itemCode shade uom');

        const history = await MaterialConsumption.find({ supplierId })
             .populate('jobWorkId', 'outwardNumber')
             .populate('grnId', 'grnNumber')
             .sort({ createdAt: -1 });

        return sendSuccess(res, { balances, history }, 'Material Ledger fetched');
    } catch (e) { next(e); }
};

module.exports = { getSupplierStock, getMaterialLedger };
