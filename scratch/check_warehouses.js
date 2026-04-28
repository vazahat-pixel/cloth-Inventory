const mongoose = require('mongoose');
const Warehouse = require('./backend/src/models/warehouse.model');
require('dotenv').config({ path: './backend/.env' });

async function checkWarehouses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const warehouses = await Warehouse.find({ isDeleted: false });
        console.log('Warehouses in DB:');
        warehouses.forEach(w => {
            console.log(`- Name: ${w.name}, GST: ${w.gstNumber}, ID: ${w._id}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkWarehouses();
