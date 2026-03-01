const mongoose = require('mongoose');

const storeInventorySchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantityAvailable: { type: Number, default: 0, min: 0 },
        quantitySold: { type: Number, default: 0, min: 0 },
        quantityReturned: { type: Number, default: 0, min: 0 },
        minStockLevel: { type: Number, default: 2 },
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Compound unique index — one record per product per store
storeInventorySchema.index({ storeId: 1, productId: 1 }, { unique: true });
storeInventorySchema.index({ storeId: 1 });

module.exports = mongoose.model('StoreInventory', storeInventorySchema);
