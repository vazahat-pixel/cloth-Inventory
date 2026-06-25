require('dotenv').config();
const connectDB = require('./src/config/db');
const Item = require('./src/models/item.model');

async function run() {
  await connectDB();

  const stylePrefix = "AW24CTR0007";
  const targetMrp = 3299;

  console.log(`Fixing MRP for all variants of style "${stylePrefix}" to ${targetMrp}...`);

  // Find all items with itemName starting with stylePrefix
  const items = await Item.find({
    itemName: new RegExp(`^${stylePrefix}`, 'i')
  });
  console.log(`Found ${items.length} documents in Item collection.`);

  let updatedCount = 0;
  for (const item of items) {
    let docModified = false;

    // Update parent MRP if different
    if (item.mrp !== targetMrp) {
      console.log(`- Updating parent MRP for "${item.itemName}" (${item.itemCode}) from ${item.mrp} to ${targetMrp}`);
      item.mrp = targetMrp;
      docModified = true;
    }
    
    // Check sizes array
    for (const size of item.sizes || []) {
      if (size.mrp !== targetMrp) {
        console.log(`  - Updating SKU ${size.sku} (${size.color}/${size.size}) MRP from ${size.mrp} to ${targetMrp}`);
        size.mrp = targetMrp;
        docModified = true;
      }
    }

    if (docModified) {
      await item.save();
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} documents for style "${stylePrefix}".`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
