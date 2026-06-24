require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Item = require('../src/models/item.model.js');
  
  // Find items where color is empty and name has a space
  const items = await Item.find({
    $or: [
      { color: null },
      { color: '' },
      { color: { $exists: false } }
    ],
    itemName: { $regex: ' ' }
  });

  console.log(`Found ${items.length} items to fix.`);
  
  let count = 0;
  for (const item of items) {
    const name = item.itemName || '';
    const parts = name.split(' ');
    if (parts.length > 1) {
      const newName = parts[0];
      const newColor = parts.slice(1).join(' ');
      
      item.itemName = newName;
      item.color = newColor;
      
      // Also update variants if they don't have color
      if (item.sizes && item.sizes.length > 0) {
        item.sizes.forEach(variant => {
          if (!variant.color) {
            variant.color = newColor;
          }
        });
      }
      
      await item.save();
      count++;
    }
  }
  
  console.log(`Fixed ${count} items successfully.`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
