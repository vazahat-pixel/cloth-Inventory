const mongoose = require('mongoose');
require('dotenv').config();

const PurchaseOrderSchema = new mongoose.Schema({
    poNumber: String,
    status: String
});
const PurchaseOrder = mongoose.model('PurchaseOrder', PurchaseOrderSchema);

async function check() {
    await mongoose.connect('mongodb://localhost:27017/cloth-inventory');
    const pos = await PurchaseOrder.find({});
    console.log('Count:', pos.length);
    console.log('Orders:', JSON.stringify(pos, null, 2));
    process.exit(0);
}
check();
