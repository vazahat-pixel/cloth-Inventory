const mongoose = require('mongoose');
require('dotenv').config();

const WarehouseInventorySchema = new mongoose.Schema({
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number
});
const WarehouseInventory = mongoose.model('WarehouseInventory', WarehouseInventorySchema);

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const inv = await WarehouseInventory.find({}).populate('warehouseId').populate('productId');
    console.log('Count:', inv.length);
    console.log('Stock:', JSON.stringify(inv, null, 2));
    process.exit(0);
}
check();
