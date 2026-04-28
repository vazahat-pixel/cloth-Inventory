const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const storeInventoryService = require('../src/modules/storeInventory/storeInventory.service');
const User = require('../src/models/user.model');

async function checkFirst1000() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ role: 'admin' });
        const result = await storeInventoryService.getStoreInventory({ limit: 1000 }, admin);
        
        const sum1000 = result.inventory.reduce((sum, item) => sum + Number(item.available ?? item.quantity ?? 0), 0);
        console.log('Sum of first 1000 items:', sum1000);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkFirst1000();
