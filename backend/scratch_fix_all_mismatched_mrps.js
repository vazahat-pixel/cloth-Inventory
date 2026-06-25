require('dotenv').config();
const connectDB = require('./src/config/db');
const Item = require('./src/models/item.model');

async function run() {
  await connectDB();

  console.log("Fetching all active items...");
  const items = await Item.find({ isActive: true });
  console.log(`Found ${items.length} items in catalog.`);

  // Group by trimmed, lowercase itemName
  const groups = new Map();
  for (const item of items) {
    if (!item.itemName) continue;
    const nameKey = item.itemName.trim().toLowerCase();
    if (!groups.has(nameKey)) {
      groups.set(nameKey, []);
    }
    groups.get(nameKey).push(item);
  }

  console.log(`Grouped into ${groups.size} unique style names.`);

  let totalUpdatedDocs = 0;
  let totalUpdatedVariants = 0;

  for (const [nameKey, docList] of groups.entries()) {
    // 1. Find the highest MRP in this style group
    let maxMRP = 0;
    for (const doc of docList) {
      if (doc.mrp && doc.mrp > maxMRP) {
        maxMRP = doc.mrp;
      }
      for (const size of doc.sizes || []) {
        if (size.mrp && size.mrp > maxMRP) {
          maxMRP = size.mrp;
        }
      }
    }

    // If maxMRP is still 0 (e.g. no price entered at all), skip
    if (maxMRP <= 0) continue;

    // 2. Align all variants/parent MRPs in this group to the maxMRP
    for (const doc of docList) {
      let isModified = false;

      // Update parent MRP if it is lower
      if (doc.mrp !== undefined && doc.mrp < maxMRP) {
        // console.log(`  [Doc MRP] Style: "${doc.itemName}" (${doc.itemCode}) parent MRP ${doc.mrp} -> ${maxMRP}`);
        doc.mrp = maxMRP;
        isModified = true;
      }

      // Update sizes array variants if their MRP is lower
      for (const size of doc.sizes || []) {
        const currentMRP = size.mrp || 0;
        if (currentMRP < maxMRP) {
          console.log(`  [Variant MRP] Style: "${doc.itemName}" [SKU: ${size.sku}] MRP ${currentMRP} -> ${maxMRP}`);
          size.mrp = maxMRP;
          isModified = true;
          totalUpdatedVariants++;
        }
      }

      if (isModified) {
        await doc.save();
        totalUpdatedDocs++;
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`Migration completed successfully!`);
  console.log(`Total Documents Updated: ${totalUpdatedDocs}`);
  console.log(`Total Variants Updated: ${totalUpdatedVariants}`);
  console.log(`==================================================`);

  process.exit(0);
}

run().catch(err => {
  console.error("Error during migration:", err);
  process.exit(1);
});
