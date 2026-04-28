const mongoose = require('mongoose');
const StockLedger = require('../src/models/stockLedger.model');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const barcode = '0001125';
    const warehouseId = '69eb555c91c611d4d6fc50fb';
    
    const lastEntry = await StockLedger.findOne({ 
        locationId: warehouseId, 
        barcode 
    }).sort({ createdAt: -1 });
    
    console.log(`Barcode: ${barcode}`);
    console.log(`Current Balance in Ledger: ${lastEntry ? lastEntry.balanceAfter : 0}`);
    
    const WarehouseInventory = require('../src/models/warehouseInventory.model');
    const physical = await WarehouseInventory.findOne({ warehouseId, barcode: { $regex: barcode } });
    console.log(`Physical Quantity in WarehouseInventory: ${physical ? physical.quantity : 0}`);
    
    process.exit(0);
}
check();
