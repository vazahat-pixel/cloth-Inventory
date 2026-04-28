const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const WarehouseInventory = require('../src/models/warehouseInventory.model');

async function checkStockRows() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const countWithStock = await WarehouseInventory.countDocuments({ quantity: { $gt: 0 } });
        console.log('Warehouse Rows with Stock (>0):', countWithStock);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkStockRows();
