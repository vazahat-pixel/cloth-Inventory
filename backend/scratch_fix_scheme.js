require('dotenv').config();
const connectDB = require('./src/config/db');
const Scheme = require('./src/models/scheme.model');
const Item = require('./src/models/item.model');

async function run() {
  await connectDB();

  // 1. Find OWN STORE scheme
  const scheme = await Scheme.findOne({ name: /own store/i });
  if (!scheme) {
    console.log("Scheme 'OWN STORE' not found!");
    process.exit(0);
  }
  console.log(`Found Scheme: ${scheme.name} (ID: ${scheme._id})`);
  console.log(`Current applicableProducts count: ${scheme.applicableProducts.length}`);

  // 2. Find all Items with itemName "FSH25-0071"
  const items = await Item.find({ itemName: /FSH25-0071/i });
  const itemIds = items.map(item => item._id);
  console.log(`Found ${itemIds.length} Items matching 'FSH25-0071' in Item collection.`);

  // 3. Add to applicableProducts
  const existingSet = new Set(scheme.applicableProducts.map(id => id.toString()));
  let addedCount = 0;
  for (const itemId of itemIds) {
    const idStr = itemId.toString();
    if (!existingSet.has(idStr)) {
      scheme.applicableProducts.push(itemId);
      existingSet.add(idStr);
      addedCount++;
    }
  }

  if (addedCount > 0) {
    await scheme.save();
    console.log(`Successfully added ${addedCount} missing FSH25-0071 variants to the scheme.`);
    console.log(`New applicableProducts count: ${scheme.applicableProducts.length}`);
  } else {
    console.log("All variants of FSH25-0071 were already in the scheme.");
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
