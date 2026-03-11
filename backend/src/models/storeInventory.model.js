const mongoose = require('mongoose');

const storeInventorySchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

        // Total physical quantity present in the store
        quantity: { type: Number, default: 0, min: 0 },

        // Available quantity used in stock checks/low-stock reports.
        // For now this is kept in sync with `quantity` by stock.service.
        quantityAvailable: { type: Number, default: 0, min: 0 },

        // Counters used by sales/returns logic
        quantitySold: { type: Number, default: 0, min: 0 },
        quantityReturned: { type: Number, default: 0, min: 0 },

        // Optional minimum stock level for low-stock alerts
        minStockLevel: { type: Number, default: 0, min: 0 },

        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Compound unique index — one record per product per store
storeInventorySchema.index({ storeId: 1, productId: 1 }, { unique: true });
storeInventorySchema.index({ storeId: 1 });

module.exports = mongoose.model('StoreInventory', storeInventorySchema);
