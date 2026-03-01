const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        code: { type: String, unique: true },
        type: {
            type: String,
            enum: ["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"],
            required: true,
        },
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
        isSystem: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);
