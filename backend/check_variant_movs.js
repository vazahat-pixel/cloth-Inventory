const mongoose = require('mongoose');
require('dotenv').config();

const StockMovement = require('./src/models/stockMovement.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const movs = await StockMovement.find({ variantId: "6a0477d7cbe1886f6da47f1b" });
    console.log(movs.map(m => ({ type: m.type, qty: m.qty, refType: m.referenceType })));
    
    process.exit(0);
}
run();
