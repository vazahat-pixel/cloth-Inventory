require('dotenv').config();
const mongoose = require('mongoose');
const ItemService = require('./src/modules/items/item.service');

async function runTest() {
  console.log('Connecting to DB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp_db');
  console.log('Connected to DB!');

  try {
    // 1. Create Fabric
    console.log('1. Creating Fabric...');
    const fabric = await ItemService.createItem({
      type: 'FABRIC',
      itemName: 'Test Fabric ' + Date.now(),
      uom: 'MTR',
      purchasePrice: 150,
      mrp: 200,
      openingStock: 500
    });
    console.log('✅ Fabric created successfully:', fabric.itemCode);

    // 2. Create Garment
    console.log('\n2. Creating Finished Garment...');
    const garment = await ItemService.createItem({
      type: 'GARMENT',
      itemName: 'Test Garment ' + Date.now(),
      uom: 'PCS',
      sizes: [
        { size: 'M', color: 'Blue', mrp: 699, stock: 0, status: 'Active' },
        { size: 'L', color: 'Blue', mrp: 699, stock: 0, status: 'Active' }
      ]
    });
    console.log('✅ Garment created successfully:', garment.itemCode);
    console.log('Variants generated:', garment.sizes.length);

    console.log('\n✅ BOTH ITEM CREATIONS WORKED PERFECTLY. No issues detected.');
  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB.');
  }
}

runTest();
