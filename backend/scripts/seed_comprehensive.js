/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

// ---------- CONNECTION ----------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth-erp';

mongoose.set('strictQuery', true);

// ---------- SCHEMAS ----------

// Roles & Permissions
const roleSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  permissions: [{ type: String, required: true }],
});

// Users
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true },
});

// Stores
const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  phone: String,
  address: String,
  status: { type: String, default: 'Active' },
});

// Warehouses
const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  address: String,
  status: { type: String, default: 'Active' },
});

// Suppliers
const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  phone: String,
  gstNumber: String,
  address: String,
  email: String,
});

// Customers
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  city: String,
  state: String,
  gstNumber: String,
  address: String,
});

// Categories
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

// Brands
const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

// Sizes
const sizeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

// Colors
const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

// HSN Codes
const hsnCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  description: String,
  gstSlab: { type: mongoose.Schema.Types.ObjectId, ref: 'GstSlab' },
});

// GST Slabs
const gstSlabSchema = new mongoose.Schema({
  rate: { type: Number, required: true, unique: true },
  name: String,
});

// Promotions / Offers
const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  discountType: { type: String, enum: ['PERCENT', 'FLAT'], required: true },
  discountValue: { type: Number, required: true },
  validFrom: Date,
  validTo: Date,
  status: { type: String, default: 'Active' },
});

// Price Lists
const priceListSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

// Payment Methods
const paymentMethodSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

// Products
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  size: { type: mongoose.Schema.Types.ObjectId, ref: 'Size' },
  color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color' },
  costPrice: Number,
  salePrice: Number,
  barcode: { type: String, unique: true, required: true },
});

// Warehouse Inventory
const warehouseInventorySchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 0 },
});

// Store Inventory
const storeInventorySchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 0 },
});

// Purchases
const purchaseSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  invoiceNumber: String,
  date: Date,
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      costPrice: Number,
      total: Number,
    },
  ],
  grandTotal: Number,
});

// Dispatches
const dispatchSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  dispatchNumber: String,
  date: Date,
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
    },
  ],
});

// ---------- MODELS ----------
const Role = mongoose.model('Role', roleSchema);
const User = mongoose.model('User', userSchema);
const Store = mongoose.model('Store', storeSchema);
const Warehouse = mongoose.model('Warehouse', warehouseSchema);
const Supplier = mongoose.model('Supplier', supplierSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Category = mongoose.model('Category', categorySchema);
const Brand = mongoose.model('Brand', brandSchema);
const Size = mongoose.model('Size', sizeSchema);
const Color = mongoose.model('Color', colorSchema);
const HsnCode = mongoose.model('HsnCode', hsnCodeSchema);
const GstSlab = mongoose.model('GstSlab', gstSlabSchema);
const Promotion = mongoose.model('Promotion', promotionSchema);
const PriceList = mongoose.model('PriceList', priceListSchema);
const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
const Product = mongoose.model('Product', productSchema);
const WarehouseInventory = mongoose.model('WarehouseInventory', warehouseInventorySchema);
const StoreInventory = mongoose.model('StoreInventory', storeInventorySchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);
const Dispatch = mongoose.model('Dispatch', dispatchSchema);

// ---------- HELPERS ----------
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFrom = (arr) => arr[randomInt(0, arr.length - 1)];
const randomPhone = () => `9${randomInt(100000000, 999999999)}`;
const randomGST = () => `${randomInt(10, 99)}ABCDE${randomInt(1000, 9999)}F1Z${randomInt(0, 9)}`;

// ---------- SEED FUNCTIONS ----------
async function clearDatabase() {
  const collections = await mongoose.connection.db.collections();
  for (const coll of collections) {
    try {
      await coll.drop();
      console.log(`Dropped collection: ${coll.collectionName}`);
    } catch (err) {
      if (err.code === 26) {
        // NamespaceNotFound - collection doesn't exist, ignore
      } else {
        console.error(`Error dropping collection ${coll.collectionName}:`, err);
      }
    }
  }
}

async function seedRoles() {
  const permissionsByRole = {
    admin: ['items', 'inventory', 'purchase', 'sales', 'dispatch', 'reports', 'settings'],
    store_staff: ['items', 'inventory', 'sales', 'reports'],
    manager: ['items', 'inventory', 'purchase', 'sales', 'dispatch', 'reports'],
    accountant: ['purchase', 'sales', 'reports', 'settings'],
  };

  const roleDocs = Object.entries(permissionsByRole).map(([name, permissions]) => ({ name, permissions }));
  await Role.insertMany(roleDocs);
  return Role.find({});
}

async function seedUsers() {
  const users = [
    {
      name: 'Admin User',
      email: 'admin@clothinventory.com',
      passwordHash: await bcrypt.hash('Admin@1234', 12),
      role: 'admin',
    },
    {
      name: 'Store Staff',
      email: 'store@clothinventory.com',
      passwordHash: await bcrypt.hash('Store@1234', 12),
      role: 'store_staff',
    },
  ];
  await User.insertMany(users);
}

async function seedStores() {
  const data = [
    { name: 'Store Indore', code: 'STR-IND', phone: randomPhone(), address: 'Indore, MP', status: 'Active' },
    { name: 'Store Bhopal', code: 'STR-BHP', phone: randomPhone(), address: 'Bhopal, MP', status: 'Active' },
    { name: 'Store Delhi', code: 'STR-DEL', phone: randomPhone(), address: 'Delhi, DL', status: 'Active' },
    { name: 'Store Mumbai', code: 'STR-MUM', phone: randomPhone(), address: 'Mumbai, MH', status: 'Active' },
  ];
  await Store.insertMany(data);
  return Store.find({});
}

async function seedWarehouses() {
  const data = [
    { name: 'Central Warehouse', code: 'WH-CENT', address: 'Main Logistics Hub', status: 'Active' },
    { name: 'Secondary Warehouse', code: 'WH-SEC', address: 'Secondary Hub', status: 'Active' },
    { name: 'Backup Warehouse', code: 'WH-BACK', address: 'Backup Facility', status: 'Active' },
  ];
  await Warehouse.insertMany(data);
  return Warehouse.find({});
}

async function seedSuppliers() {
  const baseNames = [
    'Arrow Clothing',
    'Raymond Textiles',
    'Cotton King',
    'Denim House',
    'Fashion Mills',
    'Metro Garments',
    'Royal Threads',
    'Elite Apparel',
    'Urban Fabrics',
    'Classic Textiles',
  ];
  const moreNames = baseNames.map((n) => `${n} India`);
  const allNames = [...baseNames, ...moreNames]; // 20

  const docs = allNames.map((name, idx) => ({
    name,
    phone: randomPhone(),
    gstNumber: randomGST(),
    address: `Supplier Address ${idx + 1}`,
    email: `supplier${idx + 1}@example.com`,
  }));

  await Supplier.insertMany(docs);
  return Supplier.find({});
}

async function seedCustomers() {
  const cities = ['Indore', 'Bhopal', 'Delhi', 'Mumbai', 'Pune', 'Jaipur'];
  const states = ['MP', 'MH', 'DL', 'RJ', 'GJ'];

  const docs = [];
  for (let i = 1; i <= 50; i += 1) {
    docs.push({
      name: `Customer ${i}`,
      phone: randomPhone(),
      city: randomFrom(cities),
      state: randomFrom(states),
      gstNumber: i % 3 === 0 ? randomGST() : '',
      address: `Customer Address ${i}`,
    });
  }
  await Customer.insertMany(docs);
}

async function seedCategories() {
  const names = ['Shirts', 'T-Shirts', 'Jeans', 'Jackets', 'Trousers', 'Kids Wear', 'Women\'s Wear', 'Sportswear'];
  const docs = names.map((name) => ({ name }));
  await Category.insertMany(docs);
  return Category.find({});
}

async function seedBrands() {
  const names = ['Arrow', 'Raymond', 'Levis', 'Nike', 'Adidas', 'Zara', 'H&M'];
  const docs = names.map((name) => ({ name }));
  await Brand.insertMany(docs);
  return Brand.find({});
}

async function seedSizes() {
  const names = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const docs = names.map((name) => ({ name }));
  await Size.insertMany(docs);
  return Size.find({});
}

async function seedColors() {
  const names = ['Black', 'Blue', 'Red', 'White', 'Grey', 'Green', 'Navy'];
  const docs = names.map((name) => ({ name }));
  await Color.insertMany(docs);
  return Color.find({});
}

async function seedGstAndHsn() {
  const rates = [0, 5, 12, 18, 28];
  const slabs = await GstSlab.insertMany(
    rates.map((rate) => ({ rate, name: `${rate}%` })),
  );

  const slabByRate = {};
  slabs.forEach((s) => {
    slabByRate[s.rate] = s;
  });

  const hsnDocs = [
    { code: '6109', description: 'T-Shirts', gstSlab: slabByRate[5]._id },
    { code: '6205', description: 'Shirts', gstSlab: slabByRate[5]._id },
    { code: '6203', description: 'Trousers', gstSlab: slabByRate[12]._id },
    { code: '6204', description: 'Women\'s garments', gstSlab: slabByRate[12]._id },
  ];
  await HsnCode.insertMany(hsnDocs);

  return { slabs, hsns: await HsnCode.find({}) };
}

async function seedPromotions() {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const docs = [
    {
      name: 'Flat 10% Off',
      discountType: 'PERCENT',
      discountValue: 10,
      validFrom: now,
      validTo: in30,
      status: 'Active',
    },
    {
      name: 'Buy 2 Get 1',
      discountType: 'PERCENT',
      discountValue: 33.33,
      validFrom: now,
      validTo: in60,
      status: 'Active',
    },
    {
      name: 'Festive Sale 20%',
      discountType: 'PERCENT',
      discountValue: 20,
      validFrom: now,
      validTo: in60,
      status: 'Active',
    },
    {
      name: 'Clearance Sale',
      discountType: 'PERCENT',
      discountValue: 40,
      validFrom: now,
      validTo: in60,
      status: 'Active',
    },
  ];
  await Promotion.insertMany(docs);
}

async function seedPriceLists() {
  const names = ['MRP', 'Wholesale', 'Retail', 'Distributor', 'Festival Discount'];
  await PriceList.insertMany(names.map((name) => ({ name })));
}

async function seedPaymentMethods() {
  const names = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Wallet'];
  await PaymentMethod.insertMany(names.map((name) => ({ name })));
}

async function seedProducts(brands, categories, sizes, colors) {
  const products = [];
  let barcodeCounter = 1;

  const padBarcode = (n) => `DA${n.toString().padStart(4, '0')}`;

  for (let i = 1; i <= 300; i += 1) {
    const brand = randomFrom(brands);
    const category = randomFrom(categories);
    const size = randomFrom(sizes);
    const color = randomFrom(colors);

    const costPrice = randomInt(200, 800);
    const salePrice = costPrice + randomInt(100, 400);

    products.push({
      name: `${brand.name} ${category.name} ${size.name} ${color.name} ${i}`,
      brand: brand._id,
      category: category._id,
      size: size._id,
      color: color._id,
      costPrice,
      salePrice,
      barcode: padBarcode(barcodeCounter),
    });

    barcodeCounter += 1;
  }

  await Product.insertMany(products);
  return Product.find({});
}

async function seedWarehouseInventory(warehouses, products) {
  const docs = [];
  const mainWarehouse = warehouses[0];

  products.forEach((product) => {
    docs.push({
      warehouse: mainWarehouse._id,
      product: product._id,
      quantity: randomInt(50, 200),
    });
  });

  await WarehouseInventory.insertMany(docs);
  return WarehouseInventory.find({ warehouse: mainWarehouse._id });
}

async function seedPurchases(suppliers, warehouses, products) {
  const docs = [];
  const mainWarehouse = warehouses[0];

  for (let i = 1; i <= 30; i += 1) {
    const supplier = randomFrom(suppliers);
    const date = new Date();
    date.setDate(date.getDate() - randomInt(10, 60));

    const lineCount = randomInt(2, 5);
    const items = [];
    let grandTotal = 0;

    for (let j = 0; j < lineCount; j += 1) {
      const product = randomFrom(products);
      const qty = randomInt(5, 20);
      const costPrice = product.costPrice || randomInt(200, 800);
      const total = qty * costPrice;
      grandTotal += total;

      items.push({
        product: product._id,
        quantity: qty,
        costPrice,
        total,
      });

      // increase warehouse inventory for that product
      await WarehouseInventory.updateOne(
        { warehouse: mainWarehouse._id, product: product._id },
        { $inc: { quantity: qty } },
        { upsert: true },
      );
    }

    docs.push({
      supplier: supplier._id,
      warehouse: mainWarehouse._id,
      invoiceNumber: `PI-${String(i).padStart(4, '0')}`,
      date,
      items,
      grandTotal,
    });
  }

  await Purchase.insertMany(docs);
}

async function seedDispatches(warehouses, stores, products) {
  const docs = [];
  const mainWarehouse = warehouses[0];

  for (let i = 1; i <= 20; i += 1) {
    const store = randomFrom(stores);
    const date = new Date();
    date.setDate(date.getDate() - randomInt(1, 30));

    const lineCount = randomInt(2, 4);
    const items = [];

    for (let j = 0; j < lineCount; j += 1) {
      const product = randomFrom(products);
      const qty = randomInt(3, 15);

      items.push({
        product: product._id,
        quantity: qty,
      });

      // reduce warehouse stock, increase store stock
      await WarehouseInventory.updateOne(
        { warehouse: mainWarehouse._id, product: product._id },
        { $inc: { quantity: -qty } },
        { upsert: true },
      );

      await StoreInventory.updateOne(
        { store: store._id, product: product._id },
        { $inc: { quantity: qty } },
        { upsert: true },
      );
    }

    docs.push({
      warehouse: mainWarehouse._id,
      store: store._id,
      dispatchNumber: `DSP-${String(i).padStart(4, '0')}`,
      date,
      items,
    });
  }

  await Dispatch.insertMany(docs);
}

// ---------- MAIN ----------
(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await clearDatabase();
    console.log('🗑️  Cleared existing data');

    await seedRoles();
    await seedUsers();
    const stores = await seedStores();
    const warehouses = await seedWarehouses();
    const suppliers = await seedSuppliers();
    await seedCustomers();
    const categories = await seedCategories();
    const brands = await seedBrands();
    const sizes = await seedSizes();
    const colors = await seedColors();
    await seedGstAndHsn();
    await seedPromotions();
    await seedPriceLists();
    await seedPaymentMethods();

    const products = await seedProducts(brands, categories, sizes, colors);
    const whInventory = await seedWarehouseInventory(warehouses, products);
    await seedPurchases(suppliers, warehouses, products);
    await seedDispatches(warehouses, stores, products);

    console.log('✅ Seed complete');
    console.log({
      users: await User.countDocuments(),
      roles: await Role.countDocuments(),
      stores: stores.length,
      warehouses: warehouses.length,
      suppliers: suppliers.length,
      customers: await Customer.countDocuments(),
      categories: categories.length,
      brands: brands.length,
      sizes: sizes.length,
      colors: colors.length,
      products: products.length,
      warehouseInventory: whInventory.length,
      purchases: await Purchase.countDocuments(),
      dispatches: await Dispatch.countDocuments(),
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
})();
