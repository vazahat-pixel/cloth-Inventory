const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const StoreInventory = require('../src/models/storeInventory.model');
const Item = require('../src/models/item.model');
const StockMovement = require('../src/models/stockMovement.model');
const StockLedger = require('../src/models/stockLedger.model');
const SystemLog = require('../src/models/systemLog.model');
const storeInventoryService = require('../src/modules/storeInventory/storeInventory.service');

async function testClearStoreInventory() {
    console.log('--- STARTING STORE INVENTORY CLEAR TEST ---');
    await connectDB();

    try {
        // 1. Fetch a real master Item variant to use
        const testItem = await Item.findOne();
        if (!testItem || !testItem.sizes || testItem.sizes.length === 0) {
            console.error('❌ No items with sizes found in the DB. Please seed the DB first.');
            process.exit(1);
        }

        const sizeVariant = testItem.sizes[0];
        const initialMasterStock = sizeVariant.stock || 0;
        const testStoreId = new mongoose.Types.ObjectId();
        const testUserId = new mongoose.Types.ObjectId();

        console.log(`ℹ️ Found Master Item: "${testItem.name}"`);
        console.log(`   Variant: Size "${sizeVariant.size}" (ID: ${sizeVariant._id})`);
        console.log(`   Initial Master Stock: ${initialMasterStock}`);
        console.log(`   Test Store ID: ${testStoreId}`);

        // 2. Seed a test store inventory record
        const seedQty = 15;
        const testInv = await StoreInventory.create({
            storeId: testStoreId,
            itemId: testItem._id,
            variantId: sizeVariant._id,
            barcode: sizeVariant.barcode || 'TEST-BARCODE-123',
            quantity: seedQty,
            quantityAvailable: seedQty
        });

        console.log(`✅ Seeded StoreInventory record with quantity: ${seedQty}`);

        // 3. Since we seeded manually, let's manually simulate that the master stock already includes this seed quantity,
        // or just add it so the decrement doesn't go below 0 if not allowed.
        await Item.updateOne(
            { "sizes._id": sizeVariant._id },
            { $inc: { "sizes.$.stock": seedQty } }
        );
        console.log(`✅ Incremented master stock by ${seedQty} to simulate realistic state.`);

        const updatedVariantBefore = await Item.findOne({ "sizes._id": sizeVariant._id }).then(item => 
            item.sizes.find(s => s._id.toString() === sizeVariant._id.toString())
        );
        console.log(`ℹ️ Master Stock before clearing: ${updatedVariantBefore.stock}`);

        // 4. Run the clearStoreInventory service
        console.log('⚡ Running storeInventoryService.clearStoreInventory...');
        const result = await storeInventoryService.clearStoreInventory(testStoreId, testUserId);
        console.log('✅ Service execution result:', result);

        // 5. Verification: Check StoreInventory deleted
        const remainingStoreInv = await StoreInventory.find({ storeId: testStoreId });
        if (remainingStoreInv.length === 0) {
            console.log('🎉 PASS: StoreInventory records successfully deleted.');
        } else {
            console.error('❌ FAIL: StoreInventory records still exist:', remainingStoreInv);
        }

        // 6. Verification: Check Master stock decremented
        const updatedVariantAfter = await Item.findOne({ "sizes._id": sizeVariant._id }).then(item => 
            item.sizes.find(s => s._id.toString() === sizeVariant._id.toString())
        );
        console.log(`ℹ️ Master Stock after clearing: ${updatedVariantAfter.stock}`);
        if (updatedVariantAfter.stock === updatedVariantBefore.stock - seedQty) {
            console.log('🎉 PASS: Master stock successfully decremented by cleared quantity.');
        } else {
            console.error(`❌ FAIL: Master stock not correctly decremented. Expected: ${updatedVariantBefore.stock - seedQty}, Actual: ${updatedVariantAfter.stock}`);
        }

        // 7. Verification: Check StockMovement created
        const movement = await StockMovement.findOne({ fromLocation: testStoreId, performedBy: testUserId });
        if (movement && movement.qty === -seedQty) {
            console.log('🎉 PASS: StockMovement record found with negative qty.');
        } else {
            console.error('❌ FAIL: StockMovement not found or qty mismatch:', movement);
        }

        // 8. Verification: Check StockLedger created
        const ledger = await StockLedger.findOne({ locationId: testStoreId, userId: testUserId });
        if (ledger && ledger.type === 'OUT' && ledger.quantity === seedQty && ledger.balanceAfter === 0) {
            console.log('🎉 PASS: StockLedger OUT entry created successfully with zero remaining balance.');
        } else {
            console.error('❌ FAIL: StockLedger not found or mismatch:', ledger);
        }

        // 9. Verification: Check SystemLog created
        const sysLog = await SystemLog.findOne({ action: 'DELETE_STORE_INVENTORY', userId: testUserId });
        if (sysLog) {
            console.log('🎉 PASS: SystemLog audit log entry created successfully.');
        } else {
            console.error('❌ FAIL: SystemLog audit log not found.');
        }

        // Cleanup: delete the logs we made for testStoreId, and restore the master stock
        await StockMovement.deleteMany({ fromLocation: testStoreId });
        await StockLedger.deleteMany({ locationId: testStoreId });
        await SystemLog.deleteMany({ action: 'DELETE_STORE_INVENTORY', userId: testUserId });
        console.log('🧹 Cleanup of test movements, ledger, and logs complete.');

    } catch (err) {
        console.error('❌ Test failed with error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed.');
        console.log('--- STORE INVENTORY CLEAR TEST FINISHED ---');
    }
}

testClearStoreInventory();
