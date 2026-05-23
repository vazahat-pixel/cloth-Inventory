require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const StockLedger = require('./src/models/stockLedger.model');
        const countGRN = await StockLedger.countDocuments({ source: 'GRN' });
        const countOB = await StockLedger.countDocuments({ source: 'OPENING_BALANCE' });
        const countADJ = await StockLedger.countDocuments({ source: 'ADJUSTMENT' });
        
        console.log(`StockLedger records with source 'GRN': ${countGRN}`);
        console.log(`StockLedger records with source 'OPENING_BALANCE': ${countOB}`);
        console.log(`StockLedger records with source 'ADJUSTMENT': ${countADJ}`);
        
        const adjInCount = await StockLedger.countDocuments({ source: 'ADJUSTMENT', type: 'IN' });
        const adjOutCount = await StockLedger.countDocuments({ source: 'ADJUSTMENT', type: 'OUT' });
        
        console.log(`ADJUSTMENT IN count: ${adjInCount}`);
        console.log(`ADJUSTMENT OUT count: ${adjOutCount}`);
        
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

run();
