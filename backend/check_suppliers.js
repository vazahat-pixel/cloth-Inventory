require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('./src/models/supplier.model');

async function checkSuppliers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Supplier.countDocuments({ isDeleted: false });
    console.log(`Found ${count} active suppliers in database.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkSuppliers();
