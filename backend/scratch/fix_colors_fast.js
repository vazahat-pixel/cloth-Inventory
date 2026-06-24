require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Item = require('../src/models/item.model.js');
  
  const items = await Item.find({
    $or: [
      { color: null },
      { color: '' },
      { color: { $exists: false } }
    ],
    itemName: { $regex: ' ' }
  }).lean();

  console.log(`Found ${items.length} items to fix.`);
  
  const bulkOps = [];
  
  for (const item of items) {
    const name = item.itemName || '';
    const parts = name.split(' ');
    if (parts.length > 1) {
      const newName = parts[0];
      const newColor = parts.slice(1).join(' ');
      
      const updateDoc = {
        $set: {
          itemName: newName,
          color: newColor
        }
      };
      
      if (item.sizes && item.sizes.length > 0) {
        let sizesUpdated = false;
        const newSizes = item.sizes.map(variant => {
          if (!variant.color || variant.color === '') {
            sizesUpdated = true;
            return { ...variant, color: newColor };
          }
          return variant;
        });
        if (sizesUpdated) {
          updateDoc.$set.sizes = newSizes;
        }
      }
      
      bulkOps.push({
        updateOne: {
          filter: { _id: item._id },
          update: updateDoc
        }
      });
    }
  }
  
  console.log(`Prepared ${bulkOps.length} bulk operations.`);
  if (bulkOps.length > 0) {
    await Item.bulkWrite(bulkOps, { ordered: false });
    console.log('Bulk write completed successfully.');
  }
  
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
