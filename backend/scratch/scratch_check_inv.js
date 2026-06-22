const mongoose = require('mongoose');
require('dotenv').config();

const StoreInventory = require('../src/models/storeInventory.model');
const Item = require('../src/models/item.model');
const { populateInventoryManual } = require('../src/modules/storeInventory/storeInventory.service');

async function testPopulate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find an item with multiple sizes in store inventory
    const inventoryDocs = await StoreInventory.find({}).limit(50).lean();
    
    // We will simulate the exact service logic to see the output
    // But since populateInventoryManual is not exported cleanly we can just paste the logic or require it if exported.
    // Let's just manually query the raw docs and see what's in variantId and barcode
    const sample = inventoryDocs.filter(d => d.variantId).slice(0, 5);
    console.log('Raw StoreInventory samples:');
    sample.forEach(s => console.log(`itemId: ${s.itemId}, variantId: ${s.variantId}, barcode: ${s.barcode}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testPopulate();
