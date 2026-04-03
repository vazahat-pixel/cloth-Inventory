const mongoose = require('mongoose');

const warehouseInventorySchema = new mongoose.Schema(
    {
        warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
        variantId: { type: String, required: true }, // Stores variant._id or SKU
        barcode: { type: String, required: true, index: true },
        quantity: { type: Number, default: 0, min: 0 },
        reservedQuantity: { type: Number, default: 0, min: 0 },
        damagedQuantity: { type: Number, default: 0, min: 0 },
        quantityInTransit: { type: Number, default: 0, min: 0 },
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Compound unique index — one record per variant per warehouse
warehouseInventorySchema.index({ warehouseId: 1, barcode: 1 }, { unique: true });
warehouseInventorySchema.index({ warehouseId: 1 });

module.exports = mongoose.model('WarehouseInventory', warehouseInventorySchema);
