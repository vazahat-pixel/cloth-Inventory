const mongoose = require('mongoose');

const hsnCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'HSN Code is required'],
            unique: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        gstSlabId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GstSlab',
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

hsnCodeSchema.index({ code: 1 });

module.exports = mongoose.model('HsnCode', hsnCodeSchema);
