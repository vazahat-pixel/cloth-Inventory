const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Scheme = require('../src/models/scheme.model');

async function checkSchemes() {
    await connectDB();
    try {
        const schemes = await Scheme.find().lean();
        console.log(`ℹ️ Total Schemes in DB: ${schemes.length}`);
        schemes.forEach(s => {
            console.log(`- Scheme: "${s.name}" | Type: "${s.type}" | Value: ${s.value} | Active: ${s.isActive} | Universal: ${s.isUniversal}`);
            console.log(`  * Target Stores: ${JSON.stringify(s.applicableStores || [])}`);
            console.log(`  * Target Categories: ${JSON.stringify(s.applicableCategories || [])}`);
            console.log(`  * Target Brands: ${JSON.stringify(s.applicableBrands || [])}`);
            console.log(`  * Target Products Count: ${s.applicableProducts?.length || 0}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

checkSchemes();
