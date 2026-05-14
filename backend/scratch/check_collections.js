const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');

async function check() {
    await connectDB();
    try {
        console.log("Listing all collections and document counts...");
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments({});
            console.log(`- ${col.name}: ${count} documents`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

check();
