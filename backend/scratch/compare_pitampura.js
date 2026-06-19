const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Store = require('../src/models/store.model');
  const StoreInventory = require('../src/models/storeInventory.model');

  const stores = await Store.find({ isDeleted: { $ne: true } }).sort({ name: 1 }).lean();

  console.log('Comparing store stock calculation logic across all stores:\n');
  console.log('| Store Name | Net Sum (Incl. Negatives) | Filtered Sum (Closing > 0) | Negatives Count | Negatives Sum |');
  console.log('| :--- | :---: | :---: | :---: | :---: |');

  for (const store of stores) {
    const invDocs = await StoreInventory.find({ storeId: store._id }).lean();
    
    let netSum = 0;
    let filteredSum = 0;
    let negCount = 0;
    let negSum = 0;

    invDocs.forEach(row => {
      const qty = row.quantityAvailable ?? row.quantity ?? 0;
      const inTransit = row.quantityInTransit ?? 0;
      const damaged = row.damagedQuantity ?? 0;

      netSum += qty;
      if (qty > 0 || inTransit > 0 || damaged > 0) {
        filteredSum += qty;
      }

      if (qty < 0) {
        negCount++;
        negSum += qty;
      }
    });

    console.log(`| ${store.name} | ${netSum} | ${filteredSum} | ${negCount} | ${negSum} |`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
