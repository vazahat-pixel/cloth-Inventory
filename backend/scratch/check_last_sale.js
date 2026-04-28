const mongoose = require('mongoose');
const Sale = require('../src/models/sale.model');

async function checkLastSale() {
    try {
        await mongoose.connect('mongodb://localhost:27017/cloth-inventory');
        const lastSale = await Sale.findOne().sort({ createdAt: -1 });
        console.log(JSON.stringify(lastSale, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkLastSale();
