const mongoose = require('mongoose');
require('dotenv').config();
const StockMovement = require('./src/models/stockMovement.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adj = await StockMovement.findOne({ type: 'ADJUSTMENT', qty: -345 });
    console.log('Adjustment:', adj);
    
    process.exit(0);
}
run();
