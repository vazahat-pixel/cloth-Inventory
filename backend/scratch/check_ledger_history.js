const mongoose = require('mongoose');
const StockLedger = require('../src/models/stockLedger.model');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const barcode = '0001125';
    const warehouseId = '69eb555c91c611d4d6fc50fb';
    
    const entries = await StockLedger.find({ 
        locationId: warehouseId, 
        barcode 
    }).sort({ createdAt: 1 });
    
    console.log(`Ledger History for Barcode: ${barcode}`);
    entries.forEach(e => {
        console.log(`- Date: ${e.createdAt.toISOString()}, Type: ${e.type}, Change: ${e.quantity}, BalanceAfter: ${e.balanceAfter}, Source: ${e.source}, Ref: ${e.referenceId}`);
    });
    
    process.exit(0);
}
check();
