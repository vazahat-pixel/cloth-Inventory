const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth-inventory';

mongoose.connect(MONGO_URI).then(async () => {
  const HSNCode = require('./src/models/hsnCode.model');

  const codes = await HSNCode.find({}).lean();
  console.log('Registered HSN Codes:', JSON.stringify(codes, null, 2));

  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
