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

module.exports = { getSupplierStock };
