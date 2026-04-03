const mongoose = require('mongoose');

const supplierInventorySchema = new mongoose.Schema(
    {
        supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
        variantId: { type: String, required: true },
        barcode: { type: String, required: true },
        quantity: { type: Number, default: 0, min: 0 },
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// One record per variant per supplier
supplierInventorySchema.index({ supplierId: 1, barcode: 1 }, { unique: true });

module.exports = mongoose.model('SupplierInventory', supplierInventorySchema);
