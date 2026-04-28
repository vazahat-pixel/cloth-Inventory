const mongoose = require('mongoose');
const StockLedger = require('../src/models/stockLedger.model');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const warehouseId = '69eb555c91c611d4d6fc50fb';
    
    const entries = await StockLedger.find({ 
        locationId: warehouseId,
        createdAt: { $gte: new Date('2026-04-27T11:30:00Z') }
    }).sort({ createdAt: 1 });
    
    console.log(`Global Ledger History for HO Warehouse (Today):`);
    entries.forEach(e => {
        console.log(`- Time: ${e.createdAt.toISOString()}, Barcode: ${e.barcode}, Type: ${e.type}, Qty: ${e.quantity}, Bal: ${e.balanceAfter}, Ref: ${e.referenceType}, RefID: ${e.referenceId}`);
    });
    
    process.exit(0);
}
check();
