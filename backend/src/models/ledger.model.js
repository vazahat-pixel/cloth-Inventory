const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
    {
        voucherType: {
            type: String,
            enum: ["SALE", "PURCHASE", "RETURN", "PAYMENT", "SALE_CANCEL", "PURCHASE_CANCEL", "RETURN_CANCEL"],
            required: true,
        },
        voucherId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: true,
        },
        debit: { type: Number, default: 0 },
        credit: { type: Number, default: 0 },
        date: { type: Date, default: Date.now },
        narration: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

ledgerSchema.index({ voucherType: 1, voucherId: 1 });

module.exports = mongoose.model("Ledger", ledgerSchema);
