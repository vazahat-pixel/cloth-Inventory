const mongoose = require('mongoose');

const materialConsumptionSchema = new mongoose.Schema({
    consumptionNumber: {
        type: String,
        required: true,
        unique: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    sourceOutwardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupplierOutward',
        required: true
    },
    items: [{
        rawMaterialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RawMaterial',
            required: true
        },
        quantityUsed: {
            type: Number,
            required: true
        },
        wastage: {
            type: Number,
            default: 0
        },
        notes: String
    }],
    consumptionDate: {
        type: Date,
        default: Date.now
    },
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('MaterialConsumption', materialConsumptionSchema);
