const mongoose = require('mongoose');

// Line-level tracking of each material given vs consumed
const consumptionLineSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    variantId: { type: String },
    barcode: { type: String, required: true },
    itemName: { type: String },
    itemCode: { type: String },
    uom: { type: String, default: 'MTR' },

    // Quantities
    usedQty: { type: Number, required: true, min: 0 },     // Consumed in manufacturing
    wasteQty: { type: Number, default: 0, min: 0 },        // Scrap / Cutting waste
    pendingQty: { type: Number, default: 0, min: 0 },      // Remaining balance: opening - used - waste

    notes: { type: String },
}, { _id: false });

const materialConsumptionSchema = new mongoose.Schema({
    consumptionNumber: { type: String, required: true, unique: true },

    // Links
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    jobWorkId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierOutward', required: false },
    grnId: { type: mongoose.Schema.Types.ObjectId, ref: 'GRN', required: true },   // The Garment GRN that triggered this settlement

    // Line-level material ledger
    items: [consumptionLineSchema],

    // Status
    status: {
        type: String,
        enum: ['DRAFT', 'SETTLED', 'PARTIAL'],
        default: 'SETTLED'
    },

    consumptionDate: { type: Date, default: Date.now },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Indexes for fast lookups
materialConsumptionSchema.index({ supplierId: 1, consumptionDate: -1 });
materialConsumptionSchema.index({ grnId: 1 });
materialConsumptionSchema.index({ jobWorkId: 1 });

module.exports = mongoose.model('MaterialConsumption', materialConsumptionSchema);

