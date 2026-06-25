require('dotenv').config();
const connectDB = require('./src/config/db');
const Item = require('./src/models/item.model');

async function run() {
  await connectDB();

  const itemName = "FSH25-0071";
  console.log(`Fixing MRP for all variants of style "${itemName}" to 3299...`);

  // Find all items with this itemName
  const items = await Item.find({ itemName: itemName });
  console.log(`Found ${items.length} documents in Item collection.`);

  let updatedCount = 0;
  for (const item of items) {
    let docModified = false;
    
    // Check sizes array
    for (const size of item.sizes || []) {
      if (size.mrp !== 3299) {
        console.log(`- Updating SKU ${size.sku} (${size.color}/${size.size}) MRP from ${size.mrp} to 3299`);
        size.mrp = 3299;
        docModified = true;
      }
    }

    if (docModified) {
      await item.save();
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} documents for style "${itemName}".`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
