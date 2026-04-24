const mongoose = require('mongoose');
require('dotenv').config();
const Warehouse = require('./src/models/warehouse.model');
const User = require('./src/models/user.model');

async function createDefaultWarehouse() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Warehouse.findOne({ isDeleted: false });
    if (existing) {
      console.log('✅ Warehouse already exists:', existing.name, '| ID:', existing._id);
      process.exit(0);
    }

    // Get admin user to set as createdBy
    const admin = await User.findOne({ role: { $in: ['admin', 'Admin', 'superadmin'] } });
    if (!admin) {
      console.error('No admin user found');
      process.exit(1);
    }

    const warehouse = new Warehouse({
      name: 'Main Warehouse',
      code: 'WH-0001',
      contactPerson: 'Admin',
      contactPhone: '9999999999',
      email: 'warehouse@billmarkclothing.com',
      location: {
        address: 'Head Office',
        city: 'Sonipat',
        state: 'Haryana',
        pincode: '131028',
      },
      isActive: true,
      isDeleted: false,
      createdBy: admin._id,
    });

    await warehouse.save();
    console.log('✅ Default warehouse created!');
    console.log('  Name:', warehouse.name);
    console.log('  ID:', warehouse._id.toString());
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createDefaultWarehouse();
