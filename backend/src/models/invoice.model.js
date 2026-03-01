const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: { type: String, required: true, unique: true },
        type: { type: String, enum: ['sale', 'purchase', 'dispatch'], required: true },
        referenceId: { type: mongoose.Schema.Types.ObjectId, refPath: 'referenceModel' },
        referenceModel: { type: String, enum: ['Sale', 'Dispatch'] },
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
        totalAmount: { type: Number, required: true },
        pdfUrl: { type: String },
        generatedAt: { type: Date, default: Date.now },
        generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
