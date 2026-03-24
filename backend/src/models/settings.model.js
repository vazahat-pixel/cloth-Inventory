const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: 'company_profile'
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        type: {
            type: String,
            required: true,
            enum: ['STRING', 'NUMBER', 'BOOLEAN', 'OBJECT'],
            default: 'STRING'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Settings', settingsSchema);
