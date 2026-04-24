const mongoose = require('mongoose');
require('dotenv').config();
const Item = require('./src/models/item.model');
const Brand = require('./src/models/brand.model');
const HSNCode = require('./src/models/hsnCode.model');

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const items = await Item.find({ 
      $or: [
        { brandName: { $exists: false } },
        { hsnCode: { $exists: false } }
      ]
    }).populate('brand').populate('hsCodeId');

    console.log(`Found ${items.length} items to update.`);

    let count = 0;
    for (const item of items) {
      let update = {};
      if (item.brand && (item.brand.brandName || item.brand.name)) {
        update.brandName = item.brand.brandName || item.brand.name;
      }
      if (item.hsCodeId && (item.hsCodeId.code || item.hsCodeId.hsnCode)) {
        update.hsnCode = item.hsCodeId.code || item.hsCodeId.hsnCode;
      }

      if (Object.keys(update).length > 0) {
        await Item.updateOne({ _id: item._id }, { $set: update });
        count++;
      }
      
      if (count % 100 === 0) console.log(`Updated ${count} items...`);
    }

    console.log(`Migration complete! Successfully updated ${count} items.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
