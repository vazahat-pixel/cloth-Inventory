const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Warehouse = require('../src/models/warehouse.model');

async function check() {
    await connectDB();
    try {
        const warehouses = await Warehouse.find({}).lean();
        console.log("Warehouses:");
        warehouses.forEach(w => {
            console.log(`- Name: "${w.name}" | Code: "${w.warehouseCode || w.code}" | ID: ${w._id}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

check();
