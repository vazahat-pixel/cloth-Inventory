const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GRN = require('../src/models/grn.model');
const Product = require('../src/models/product.model');

async function checkGrn() {
    await mongoose.connect(process.env.MONGODB_URI);
    const grnId = '69cbaf3961ed4c7973e36d58'; // ID from user screenshot might be slight different
    
    // Actually, I'll search by most recent GRN instead of manually typing that ID
    const latestGrn = await GRN.findOne().sort({ createdAt: -1 }).populate('items.productId');
    
    if (!latestGrn) {
        console.log('No GRNs found in DB');
        process.exit(1);
    }
    
    console.log('Latest GRN:', latestGrn.grnNumber);
    console.log('ID:', latestGrn._id);
    console.log('Status:', latestGrn.status);
    console.log('Item count:', latestGrn.items.length);
    
    latestGrn.items.forEach((item, i) => {
        console.log(`Item ${i+1}:`);
        console.log('  Product ID:', item.productId?._id);
        console.log('  Product Name:', item.productId?.name || item.productId?.itemName);
        console.log('  Received Qty:', item.receivedQty);
        console.log('  Lot Number:', item.batchNumber);
    });
    
    mongoose.disconnect();
}

checkGrn();
