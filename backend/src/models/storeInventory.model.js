const mongoose = require('mongoose');

const storeInventorySchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
        variantId: { type: String, required: true },
        barcode: { type: String, required: true, index: true },
        quantity: { type: Number, default: 0, min: 0 },
        quantityAvailable: { type: Number, default: 0, min: 0 },
        quantityInTransit: { type: Number, default: 0, min: 0 },
        damagedQuantity: { type: Number, default: 0, min: 0 },
        quantitySold: { type: Number, default: 0, min: 0 },
        quantityReturned: { type: Number, default: 0, min: 0 },
        lastPurchaseRate: { type: Number, default: 0 },
        minStockLevel: { type: Number, default: 0, min: 0 },
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Compound unique index — one record per variant per store
storeInventorySchema.index({ storeId: 1, barcode: 1 }, { unique: true });
storeInventorySchema.index({ storeId: 1 });

module.exports = mongoose.model('StoreInventory', storeInventorySchema);
