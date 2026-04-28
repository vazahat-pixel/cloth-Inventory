const mongoose = require('mongoose');
const StockLedger = require('../src/models/stockLedger.model');
require('dotenv').config();

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);
    const barcode = '0001125';
    const warehouseId = '69eb555c91c611d4d6fc50fb';
    
    // Find the rogue entry that was created without session and shouldn't be there
    // It has Ref: 69ef4aef761ce0ce3fffe083 (The sale that doesn't exist)
    const rogue = await StockLedger.findOne({ 
        locationId: warehouseId, 
        barcode,
        referenceId: '69ef4aef761ce0ce3fffe083'
    });
    
    if (rogue) {
        console.log(`Found rogue ledger entry. Deleting it to restore balance...`);
        await StockLedger.deleteOne({ _id: rogue._id });
        console.log(`Done. Stock balance for ${barcode} should now be restored to 1.`);
    } else {
        console.log(`Rogue entry not found. Checking current balance...`);
        const last = await StockLedger.findOne({ locationId: warehouseId, barcode }).sort({ createdAt: -1 });
        console.log(`Current Balance: ${last ? last.balanceAfter : 0}`);
    }
    
    process.exit(0);
}
fix();
