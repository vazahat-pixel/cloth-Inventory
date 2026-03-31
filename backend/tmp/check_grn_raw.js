const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GRN = require('../src/models/grn.model');

async function checkGrnRaw() {
    await mongoose.connect(process.env.MONGODB_URI);
    const grn = await GRN.findOne().sort({ createdAt: -1 });
    
    if (!grn) {
        console.log('No GRNs');
        process.exit(1);
    }
    
    console.log('GRN:', grn.grnNumber);
    grn.items.forEach((item, i) => {
        console.log(`Item ${i+1} raw productId:`, item.productId);
    });
    
    mongoose.disconnect();
}

checkGrnRaw();
