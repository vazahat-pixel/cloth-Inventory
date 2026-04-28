const mongoose = require('mongoose');

const taxRuleSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        min: { type: Number, default: 0 },
        max: { type: Number, default: null }, // null for no upper limit
        gst: { type: Number, required: true },
        type: { type: String, enum: ['SLAB', 'FLAT'], default: 'SLAB' },
        hsnCode: { type: String, trim: true }, // Optional: specific HSN for FLAT rules
        category: { type: String, trim: true }, // Optional: specific category
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('TaxRule', taxRuleSchema);
