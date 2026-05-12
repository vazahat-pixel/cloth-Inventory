const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

async function run() {
    try {
        await mongoose.connect(mongoUri);
        const Scheme = require('../src/models/scheme.model');
        
        const allSchemes = await Scheme.find().lean();
        console.log('=== SUMMARY OF SCHEMES ===');
        const summary = allSchemes.map(s => ({
            name: s.name,
            type: s.type,
            value: s.value,
            buy: s.buyQuantity,
            get: s.getQuantity,
            isActive: s.isActive,
            isUniversal: s.isUniversal,
            numProducts: s.applicableProducts?.length || 0,
            numCategories: s.applicableCategories?.length || 0,
            numBrands: s.applicableBrands?.length || 0,
            numStores: s.applicableStores?.length || 0,
            numGroups: s.applicablePromotionGroups?.length || 0
        }));
        console.table(summary);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
