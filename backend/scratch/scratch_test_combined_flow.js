const mongoose = require('mongoose');
require('dotenv').config();

// Register models
const User = require('../src/models/user.model');
const Store = require('../src/models/store.model');
const Warehouse = require('../src/models/warehouse.model');
const Dispatch = require('../src/models/dispatch.model');
const Item = require('../src/models/item.model');

const dispatchService = require('../src/modules/dispatch/dispatch.service');

async function getAdminUser() {
    const admin = await User.findOne({
        $or: [
            { role: 'admin' },
            { role: 'ADMIN' },
            { role: 'superadmin' },
            { role: 'SUPER_ADMIN' },
        ],
        isActive: { $ne: false },
    }).lean();
    if (!admin) throw new Error('No admin user found');
    return admin;
}

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const adminUser = await getAdminUser();
    
    // Find active store and warehouse
    const store = await Store.findOne({ isActive: { $ne: false } });
    const warehouse = await Warehouse.findOne({ isActive: { $ne: false } });

    if (!store || !warehouse) {
        throw new Error('Active store or warehouse not found');
    }

    console.log(`Using Store: ${store.name} (${store._id})`);
    console.log(`Using Warehouse: ${warehouse.name} (${warehouse._id})`);

    // Find a variant that has stock in this warehouse
    const WarehouseInventory = require('../src/models/warehouseInventory.model');
    const whInv = await WarehouseInventory.findOne({
        warehouseId: warehouse._id,
        quantity: { $gte: 20 }
    });
    if (!whInv) {
        throw new Error('No items found with >= 20 stock in the selected warehouse');
    }
    console.log(`Found warehouse inventory with stock: ${whInv.quantity} for barcode ${whInv.barcode}`);
    
    // Find the item and size matching this variantId
    const item = await Item.findOne({ "sizes._id": whInv.variantId });
    if (!item) {
        throw new Error(`Item not found for variantId ${whInv.variantId}`);
    }
    const size = item.sizes.id(whInv.variantId);

    // Create 2 draft dispatches
    console.log('Creating child test dispatches...');
    const d1 = new Dispatch({
        dispatchNumber: 'SCH-TEST-D1',
        sourceWarehouseId: warehouse._id,
        destinationStoreId: store._id,
        items: [{
            itemId: item._id,
            variantId: size._id,
            barcode: size.sku || size.barcode || item.itemCode,
            qty: 5,
            rate: item.mrp || 100,
            mrp: size.mrp || item.mrp || 100
        }],
        status: 'PENDING',
        createdBy: adminUser._id
    });
    await d1.save();

    const d2 = new Dispatch({
        dispatchNumber: 'SCH-TEST-D2',
        sourceWarehouseId: warehouse._id,
        destinationStoreId: store._id,
        items: [{
            itemId: item._id,
            variantId: size._id,
            barcode: size.sku || size.barcode || item.itemCode,
            qty: 10,
            rate: item.mrp || 100,
            mrp: size.mrp || item.mrp || 100
        }],
        status: 'PENDING',
        createdBy: adminUser._id
    });
    await d2.save();

    console.log(`Created child dispatches: ${d1.dispatchNumber}, ${d2.dispatchNumber}`);

    // Combine dispatches
    console.log('Combining child dispatches into a master dispatch...');
    const master = await dispatchService.combineAndConfirmDispatch({
        dispatchIds: [d1._id, d2._id],
        notes: 'Test combined dispatch notes',
        vehicleNumber: 'DL-TEST-1234',
        driverName: 'Test Driver'
    }, adminUser._id);

    console.log(`Combined master dispatch created: ${master.dispatchNumber}`);

    // Verify Visibility for Store Users
    console.log('Verifying visibility for store users...');
    const storeUser = {
        role: 'store_staff',
        shopId: store._id
    };

    const storeQueryResults = await dispatchService.getDispatches({ isTransferBill: 'false' }, storeUser);
    const storeRecordList = storeQueryResults.dispatches || storeQueryResults.records || storeQueryResults;

    const hasChild1 = storeRecordList.some(r => r.dispatchNumber === 'SCH-TEST-D1');
    const hasChild2 = storeRecordList.some(r => r.dispatchNumber === 'SCH-TEST-D2');
    const hasMaster = storeRecordList.some(r => r.dispatchNumber === master.dispatchNumber);

    console.log(`  - Store sees child 1: ${hasChild1} (Expected: false)`);
    console.log(`  - Store sees child 2: ${hasChild2} (Expected: false)`);
    console.log(`  - Store sees master: ${hasMaster} (Expected: true)`);

    if (hasChild1 || hasChild2 || !hasMaster) {
        throw new Error('Visibility verification FAILED!');
    }
    console.log('Visibility verification PASSED!');

    // Verify Direct Child Inward Block
    console.log('Verifying that receiving a combined child directly is blocked...');
    try {
        await dispatchService.receiveDispatch(d1._id, adminUser._id);
        throw new Error('Direct child receive should have been BLOCKED but succeeded!');
    } catch (e) {
        console.log(`  - Direct child receive correctly blocked with error: "${e.message}"`);
        if (!e.message.includes('combined into a Tax Invoice')) {
            throw new Error(`Unexpected error message: ${e.message}`);
        }
    }
    console.log('Child receive block verification PASSED!');

    // Verify Master Inward and Auto-received Children
    console.log('Receiving combined master dispatch...');
    const receivedMaster = await dispatchService.receiveDispatch(master._id, adminUser._id);
    console.log(`  - Master dispatch status: ${receivedMaster.status} (Expected: RECEIVED)`);

    const updatedChild1 = await Dispatch.findById(d1._id);
    const updatedChild2 = await Dispatch.findById(d2._id);

    console.log(`  - Child 1 status: ${updatedChild1.status} (Expected: RECEIVED)`);
    console.log(`  - Child 2 status: ${updatedChild2.status} (Expected: RECEIVED)`);

    if (receivedMaster.status !== 'RECEIVED' || updatedChild1.status !== 'RECEIVED' || updatedChild2.status !== 'RECEIVED') {
        throw new Error('Master receive and auto-receive children FAILED!');
    }
    console.log('Master receive and auto-receive children verification PASSED!');

    // Clean up
    console.log('Cleaning up test data...');
    // We also need to reverse the stock additions done by the test receive, so let's delete them.
    // Or we can just use deleteDispatch for master, which will clean up stock and set status.
    await dispatchService.deleteDispatch(master._id, adminUser._id);
    
    // Hard delete test dispatches from DB
    await Dispatch.deleteMany({
        dispatchNumber: { $in: ['SCH-TEST-D1', 'SCH-TEST-D2', master.dispatchNumber] }
    });
    console.log('Cleanup completed successfully!');

    await mongoose.disconnect();
    console.log('Disconnected! Test PASSED successfully!');
}

run().catch(async (e) => {
    console.error('Test FAILED:', e);
    // Cleanup if possible
    try {
        await Dispatch.deleteMany({
            dispatchNumber: { $in: ['SCH-TEST-D1', 'SCH-TEST-D2'] }
        });
        const master = await Dispatch.findOne({ notes: /Test combined dispatch notes/ });
        if (master) {
            await Dispatch.deleteOne({ _id: master._id });
        }
    } catch {}
    await mongoose.disconnect();
    process.exit(1);
});
