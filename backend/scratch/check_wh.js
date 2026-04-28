const mongoose = require('mongoose');
const Warehouse = require('../src/models/warehouse.model');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const whs = await Warehouse.find({ isDeleted: false });
    console.log('Warehouses in DB:');
    whs.forEach(w => {
        console.log(`- ${w.name}: GST=${w.gstNumber}, Location=${JSON.stringify(w.location)}`);
    });
    process.exit(0);
}
check();
