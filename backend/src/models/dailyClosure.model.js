const mongoose = require('mongoose');

const dailyClosureSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
        closureDate: { type: Date, required: true },
        
        // System Calculated (from Sales/Transactions)
        systemOpeningCash: { type: Number, default: 0 },
        systemSalesCash: { type: Number, default: 0 },
        systemSalesCard: { type: Number, default: 0 },
        systemSalesUPI: { type: Number, default: 0 },
        systemReturnsCash: { type: Number, default: 0 },
        systemExpenses: { type: Number, default: 0 },
        expectedClosingCash: { type: Number, default: 0 },

        // User Input (Physical Counts)
        physicalCash: { type: Number, required: true },
        cashDifference: { type: Number, default: 0 }, // physical - expected
        remarks: { type: String },

        // Denominations (Optional but Professional)
        denominations: {
            '2000': Number,
            '500': Number,
            '200': Number,
            '100': Number,
            '50': Number,
            '20': Number,
            '10': Number,
            'Coins': Number
        },

        isFinalized: { type: Boolean, default: true },
        closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { timestamps: true }
);

// One closure per store per day
dailyClosureSchema.index({ storeId: 1, closureDate: 1 }, { unique: true });

module.exports = mongoose.model('DailyClosure', dailyClosureSchema);
