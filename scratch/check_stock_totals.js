const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const StoreInventory = require('../backend/src/models/storeInventory.model');
const WarehouseInventory = require('../backend/src/models/warehouseInventory.model');
const Item = require('../backend/src/models/item.model');

async function checkStock() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const storeInv = await StoreInventory.find({});
        const warehouseInv = await WarehouseInventory.find({});

        const totalStoreQty = storeInv.reduce((sum, i) => sum + (i.quantity || 0), 0);
        const totalWarehouseQty = warehouseInv.reduce((sum, i) => sum + (i.quantity || 0), 0);

        console.log('Store Inventory Rows:', storeInv.length);
        console.log('Store Total Quantity:', totalStoreQty);
        console.log('Warehouse Inventory Rows:', warehouseInv.length);
        console.log('Warehouse Total Quantity:', totalWarehouseQty);
        console.log('Grand Total:', totalStoreQty + totalWarehouseQty);

        const items = await Item.find({});
        let totalMasterStock = 0;
        items.forEach(it => {
            if (it.sizes) {
                it.sizes.forEach(sz => {
                    totalMasterStock += (sz.stock || 0);
                });
            }
        });
        console.log('Total Item Master Stock:', totalMasterStock);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkStock();
