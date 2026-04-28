const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const storeInventoryService = require('../src/modules/storeInventory/storeInventory.service');
const User = require('../src/models/user.model');

async function triggerService() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('Admin user not found');
            return;
        }

        console.log('Calling getStoreInventory as admin...');
        const result = await storeInventoryService.getStoreInventory({}, admin);
        console.log('Result totalQuantity:', result.totalQuantity);
        console.log('Result inventory length:', result.inventory.length);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

triggerService();
