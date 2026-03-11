require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const GstSlab = require('../src/models/gstSlab.model');
const HsnCode = require('../src/models/hsnCode.model');
const Store = require('../src/models/store.model');
const Warehouse = require('../src/models/warehouse.model');
const Supplier = require('../src/models/supplier.model');
const User = require('../src/models/user.model');

async function ensureGstSlab() {
  const existing = await GstSlab.findOne({ name: 'GST 5%' });
  if (existing) {
    console.log(`ℹ️ GST slab already exists: GST 5%`);
    return existing;
  }

  const slab = await GstSlab.create({
    name: 'GST 5%',
    percentage: 5,
    type: 'CGST_SGST',
    isActive: true,
  });
  console.log('🎯 Seeded GST slab: GST 5%');
  return slab;
}

async function ensureHsnCode(slabId) {
  const existing = await HsnCode.findOne({ code: '6109' });
  if (existing) {
    console.log('ℹ️ HSN 6109 already exists');
    return existing;
  }

  const hsn = await HsnCode.create({
    code: '6109',
    description: 'T-Shirt',
    gstSlabId: slabId,
  });
  console.log('🎯 Seeded HSN: 6109 - T-Shirt');
  return hsn;
}

async function getAdminUserId() {
  const admin = await User.findOne({ role: 'admin' }).select('_id');
  if (!admin) {
    throw new Error('Admin user not found. Run `npm run seed` first.');
  }
  return admin._id;
}

async function ensureStore(createdBy) {
  const existing = await Store.findOne({ storeCode: 'STR001' });
  if (existing) {
    console.log('ℹ️ Store STR001 already exists');
    return existing;
  }

  const store = await Store.create({
    name: 'Store Indore',
    storeCode: 'STR001',
    managerName: 'Test Manager',
    managerPhone: '9999999999',
    email: 'store-indore@test.com',
    location: {
      address: 'MG Road',
      city: 'Indore',
      state: 'MP',
      pincode: '452001',
    },
    isActive: true,
    createdBy,
  });
  console.log('🎯 Seeded Store: Store Indore (STR001)');
  return store;
}

async function ensureWarehouse(createdBy) {
  const existing = await Warehouse.findOne({ code: 'WH01' });
  if (existing) {
    console.log('ℹ️ Warehouse WH01 already exists');
    return existing;
  }

  const wh = await Warehouse.create({
    name: 'Central Warehouse',
    code: 'WH01',
    contactPerson: 'HO Manager',
    contactPhone: '7777777777',
    location: {
      address: 'Central Park',
      city: 'Indore',
      state: 'MP',
      pincode: '452001',
    },
    isActive: true,
    createdBy,
  });
  console.log('🎯 Seeded Warehouse: Central Warehouse (WH01)');
  return wh;
}

async function ensureSupplier(createdBy) {
  const existing = await Supplier.findOne({ name: 'Arrow Clothing' });
  if (existing) {
    console.log('ℹ️ Supplier Arrow Clothing already exists');
    return existing;
  }

  const supplier = await Supplier.create({
    name: 'Arrow Clothing',
    supplierCode: 'SUP-ARROW',
    gstNumber: '22ABCDE1234F1Z5',
    phone: '8888888888',
    email: 'arrow@test.com',
    address: 'Textile Hub',
    isActive: true,
    createdBy,
  });
  console.log('🎯 Seeded Supplier: Arrow Clothing');
  return supplier;
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const adminId = await getAdminUserId();

    const slab = await ensureGstSlab();
    await ensureHsnCode(slab._id);
    await ensureStore(adminId);
    await ensureWarehouse(adminId);
    await ensureSupplier(adminId);

    console.log('\n✅ GST, HSN, Store, Warehouse, and Supplier seeds are in place.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed GST/HSN/masters failed:', err.message);
    process.exit(1);
  }
}

run();

