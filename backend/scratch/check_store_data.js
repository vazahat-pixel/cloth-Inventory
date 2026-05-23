require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
    console.error('Error: MONGODB_URI not found in env!');
    process.exit(1);
}

const Store = mongoose.model('Store', new mongoose.Schema({
    name: String,
    storeCode: String,
    gstNumber: String,
    location: {
        address: String,
        city: String,
        state: String,
        pincode: String
    }
}));

const Warehouse = mongoose.model('Warehouse', new mongoose.Schema({
    name: String,
    warehouseCode: String,
    gstNumber: String,
    location: {
        address: String,
        city: String,
        state: String,
        pincode: String
    }
}));

async function check() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to DB:', mongoURI.split('@')[1] || mongoURI);

        const stores = await Store.find({});
        console.log('--- STORES ---');
        stores.forEach(s => {
            console.log(`ID: ${s._id}, Name: ${s.name}, GSTIN: ${s.gstNumber}, Location: ${JSON.stringify(s.location)}`);
        });

        const warehouses = await Warehouse.find({});
        console.log('--- WAREHOUSES ---');
        warehouses.forEach(w => {
            console.log(`ID: ${w._id}, Name: ${w.name}, GSTIN: ${w.gstNumber}, Location: ${JSON.stringify(w.location)}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
