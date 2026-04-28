const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkStock() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const WarehouseInventory = mongoose.model('WarehouseInventory', new mongoose.Schema({}, { strict: false }));
        const count = await WarehouseInventory.countDocuments();
        console.log(`Total Warehouse Inventory Records: ${count}`);
        
        const samples = await WarehouseInventory.find().limit(5).lean();
        console.log('Sample Records:', JSON.stringify(samples, null, 2));
        
        const GRN = mongoose.model('GRN', new mongoose.Schema({}, { strict: false }));
        const grnCount = await GRN.countDocuments({ grnType: 'OPENING_BALANCE' });
        console.log(`Total Opening Balance GRNs: ${grnCount}`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStock();
