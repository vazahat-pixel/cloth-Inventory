const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth-inventory';

mongoose.connect(MONGO_URI).then(async () => {
  const Group = require('./src/models/group.model');
  const Category = require('./src/models/category.model');
  const Item = require('./src/models/item.model');

  const groupCount = await Group.countDocuments({});
  const categoryCount = await Category.countDocuments({});
  const itemCount = await Item.countDocuments({});

  console.log(`Counts: Groups=${groupCount}, Categories=${categoryCount}, Items=${itemCount}`);

  const sampleGroups = await Group.find({}).limit(10).lean();
  console.log('Sample Groups:', JSON.stringify(sampleGroups, null, 2));

  const sampleCategories = await Category.find({}).limit(10).lean();
  console.log('Sample Categories:', JSON.stringify(sampleCategories, null, 2));

  const sampleItems = await Item.find({}).limit(5).lean();
  console.log('Sample Items:', JSON.stringify(sampleItems, null, 2));

  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
