const mongoose = require("mongoose");
const { GstType } = require("../core/enums");

const gstSlabSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        percentage: { type: Number, required: true },
        type: {
            type: String,
            enum: Object.values(GstType),
            required: true,
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

gstSlabSchema.index({ percentage: 1 });

module.exports = mongoose.model("GstSlab", gstSlabSchema);
