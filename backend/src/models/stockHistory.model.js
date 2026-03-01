const mongoose = require('mongoose');
const { StockHistoryType } = require('../core/enums');

const stockHistorySchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
        type: {
            type: String,
            enum: Object.values(StockHistoryType),
            required: true,
        },
        quantityBefore: { type: Number, required: true },
        quantityChange: { type: Number, required: true },          // positive = IN, negative = OUT
        quantityAfter: { type: Number, required: true },
        referenceId: { type: mongoose.Schema.Types.ObjectId },     // Sale / Dispatch / Return ID
        referenceModel: { type: String },                           // 'Sale', 'Dispatch', 'Return'
        notes: { type: String },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

stockHistorySchema.index({ productId: 1, storeId: 1, createdAt: -1 });

module.exports = mongoose.model('StockHistory', stockHistorySchema);
