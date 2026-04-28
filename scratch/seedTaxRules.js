const mongoose = require('mongoose');
const TaxRule = require('../backend/src/models/taxRule.model');
require('dotenv').config({ path: '../backend/.env' });

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth-inventory');
        console.log('Connected to MongoDB');

        await TaxRule.deleteMany({});
        console.log('Cleared existing tax rules');

        const defaultRules = [
            { name: 'Apparel Low Slab', min: 0, max: 2499, gst: 5, type: 'SLAB' },
            { name: 'Apparel High Slab', min: 2500, max: null, gst: 18, type: 'SLAB' },
            { name: 'Belt Flat', gst: 18, type: 'FLAT', hsnCode: '42033000' }
        ];

        await TaxRule.insertMany(defaultRules);
        console.log('Seeded default tax rules');

        await mongoose.connection.close();
        console.log('Connection closed');
    } catch (error) {
        console.error('Error seeding:', error);
    }
};

seed();
