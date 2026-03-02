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
            businessName: String,
            legalName: String,
            gstin: String,
            pan: String,
            address: {
                line1: String,
                city: String,
                state: String,
                pincode: String,
            },
            phone: String,
            email: String,
            financialYearStart: {
                type: String,
                default: '04-01'
            },
            logo: String,
            currency: {
                code: { type: String, default: 'INR' },
                symbol: { type: String, default: '₹' }
            }
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
