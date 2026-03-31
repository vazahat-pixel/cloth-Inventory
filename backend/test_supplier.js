require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('./src/models/supplier.model');
const User = require('./src/models/user.model');

async function testSupplierCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Find first user to use as creator
    const user = await User.findOne();
    if (!user) {
       console.log('No users found in database. Seed user first.');
       process.exit(1);
    }

    const testSupplier = new Supplier({
      name: 'Test Supplier ' + Date.now(),
      supplierCode: 'TEST001',
      gstNumber: '27AAAAA0000A1Z5',
      phone: '1234567890',
      email: 'test@example.com',
      address: 'Test Address',
      bankDetails: 'Test Bank',
      createdBy: user._id
    });

    const saved = await testSupplier.save();
    console.log('✅ Supplier Saved:', saved._id);
    
    // Clean up
    await Supplier.deleteOne({ _id: saved._id });
    console.log('✅ Test Supplier Cleaned Up');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testSupplierCreation();
