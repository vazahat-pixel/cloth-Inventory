const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

async function run() {
    try {
        await mongoose.connect(mongoUri);
        const Scheme = require('./src/models/scheme.model');
        
        // Update FLATE (80% OFF) to be universal
        const result = await Scheme.updateOne(
            { name: 'FLATE', type: 'PERCENTAGE' },
            { $set: { isUniversal: true } }
        );
        
        console.log(`Updated FLATE: ${result.modifiedCount} documents.`);
        
        // Also ensure FLATE PRICE (Fixed 900) is NOT universal (just in case)
        const result2 = await Scheme.updateOne(
            { name: 'FLATE PRICE' },
            { $set: { isUniversal: false } }
        );
        console.log(`Updated FLATE PRICE: ${result2.modifiedCount} documents.`);

        const all = await Scheme.find({ isActive: true });
        console.log('Current Schemes Status:');
        all.forEach(s => {
            console.log(`- ${s.name}: isUniversal=${s.isUniversal}, Products=${s.applicableProducts?.length}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
