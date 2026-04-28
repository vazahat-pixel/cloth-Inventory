const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const WarehouseInventory = require('../src/models/warehouseInventory.model');
const Item = require('../src/models/item.model');

async function checkTypes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const warehouseInv = await WarehouseInventory.find({});
        const itemIds = warehouseInv.map(i => i.itemId);
        const items = await Item.find({ _id: { $in: itemIds } });
        const itemMap = new Map(items.map(it => [it._id.toString(), it]));

        const typeStats = {};
        warehouseInv.forEach(i => {
            const it = itemMap.get(i.itemId.toString());
            const type = it ? it.type : 'UNKNOWN';
            typeStats[type] = (typeStats[type] || 0) + (i.quantity || 0);
        });

        console.log('Warehouse Stock by Type:', typeStats);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkTypes();
