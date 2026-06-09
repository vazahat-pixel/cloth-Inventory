const mongoose = require('mongoose');
require('dotenv').config();

const stockReturnService = require('../src/modules/stockReturn/stockReturn.service.js');
const Store = require('../src/models/store.model.js');
const Warehouse = require('../src/models/warehouse.model.js');
const User = require('../src/models/user.model.js');
const Item = require('../src/models/item.model.js');
const StoreInventory = require('../src/models/storeInventory.model.js');

async function runTest() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Find a store
        const store = await Store.findOne();
        if (!store) throw new Error('No store found.');
        console.log('Using Store:', store.name, 'ID:', store._id);

        // 2. Find a warehouse
        const warehouse = await Warehouse.findOne();
        if (!warehouse) throw new Error('No warehouse found.');
        console.log('Using Warehouse:', warehouse.name, 'ID:', warehouse._id);

        // 3. Find a user
        const user = await User.findOne();
        if (!user) throw new Error('No user found.');
        console.log('Using User:', user.email, 'ID:', user._id);

        // 4. Find an Item with size variant in the store inventory (to make sure stock is > 0)
        const item = await Item.findOne({ "sizes.0": { $exists: true } });
        if (!item) throw new Error('No item with sizes found.');
        const variant = item.sizes[0];
        console.log('Using Item:', item.itemName, 'Variant ID:', variant._id, 'SKU:', variant.sku);

        // Ensure store inventory exists for this variant and has positive stock so we can return it
        const barcode = variant.sku || variant.barcode || item.itemCode;
        let storeInv = await StoreInventory.findOne({ storeId: store._id, barcode });
        if (!storeInv) {
            console.log('Creating store inventory opening stock for test...');
            storeInv = new StoreInventory({
                storeId: store._id,
                itemId: item._id,
                variantId: String(variant._id),
                barcode,
                quantity: 10,
                quantityAvailable: 10
            });
            await storeInv.save();
        } else if (storeInv.quantity < 5) {
            console.log('Updating store inventory to ensure enough stock for test...');
            storeInv.quantity = 10;
            storeInv.quantityAvailable = 10;
            await storeInv.save();
        }
        console.log('Current store stock:', storeInv.quantity);

        // 5. Initiate return
        const payload = {
            sourceStoreId: store._id,
            destinationWarehouseId: warehouse._id,
            items: [
                {
                    variantId: variant._id,
                    qty: 2
                }
            ],
            reason: 'Test return'
        };

        console.log('Initiating stock return...');
        const result = await stockReturnService.initiateReturn(payload, user._id);
        console.log('SUCCESS! Initiated return details:', result);

        console.log('Receiving stock return...');
        const receiveResult = await stockReturnService.receiveReturn(result._id, user._id);
        console.log('RECEIVE SUCCESS!');
        console.log('Received return details:', receiveResult);

    } catch (err) {
        console.error('TEST FAILED:', err);
    } finally {
        // Wait a short moment for background callbacks before disconnecting
        await new Promise(resolve => setTimeout(resolve, 500));
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

runTest();
