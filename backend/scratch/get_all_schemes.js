const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

async function run() {
    try {
        await mongoose.connect(mongoUri);
        const Scheme = require('../src/models/scheme.model');
        const PromotionGroup = require('../src/models/promotionGroup.model');
        const Item = require('../src/models/item.model');
        
        const allSchemes = await Scheme.find().lean();
        console.log('=== ALL SCHEMES IN DB ===');
        console.log(JSON.stringify(allSchemes, null, 2));

        const allGroups = await PromotionGroup.find().lean();
        console.log('=== ALL PROMOTION GROUPS IN DB ===');
        console.log(JSON.stringify(allGroups, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
