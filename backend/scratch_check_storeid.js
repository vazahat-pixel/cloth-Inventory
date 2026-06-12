require('dotenv').config();
const connectDB = require('./src/config/db');
const Sale = require('./src/models/sale.model');
require('./src/models/store.model'); // Register Store

async function checkStoreIdNull() {
    await connectDB();
    // fetch without populate
    const salesRaw = await Sale.find().sort({ saleDate: -1 }).limit(500).lean();
    const nullStores = salesRaw.filter(s => s.storeId && String(s.storeId) === '663e264663efd54341b12b55'); // Some warehouse ID
    
    // fetch with populate
    const salesPopulated = await Sale.find().populate('storeId').sort({ saleDate: -1 }).limit(10);
    const sale = salesPopulated.find(s => !s.storeId);
    if (sale) {
        console.log('Populated but null storeId:', sale.saleNumber);
        console.log('_doc.storeId:', sale._doc.storeId);
        
        // Find raw store ID from lean query
        const raw = await Sale.findById(sale._id).lean();
        console.log('Actual raw storeId from lean:', raw.storeId);
    } else {
        console.log('No sales with null storeId in top 10');
    }
    process.exit(0);
}
checkStoreIdNull();
