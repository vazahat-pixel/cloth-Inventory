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
        groupId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountGroup" },
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
        isSystem: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        openingBalance: { type: Number, default: 0 },
        description: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);
