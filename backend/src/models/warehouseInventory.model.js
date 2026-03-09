const mongoose = require('mongoose');

const warehouseInventorySchema = new mongoose.Schema(
    {
        warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 0, min: 0 },
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Compound unique index — one record per product per warehouse
warehouseInventorySchema.index({ warehouseId: 1, productId: 1 }, { unique: true });
warehouseInventorySchema.index({ warehouseId: 1 });

module.exports = mongoose.model('WarehouseInventory', warehouseInventorySchema);
