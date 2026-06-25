require('dotenv').config();
const connectDB = require('./src/config/db');
const Store = require('./src/models/store.model');
const Item = require('./src/models/item.model');
const Product = require('./src/models/product.model');
const Scheme = require('./src/models/scheme.model');
const StoreInventory = require('./src/models/storeInventory.model');

async function run() {
  await connectDB();

  // Find GTB Nagar Store
  const store = await Store.findOne({ name: /gtb/i });
  if (!store) {
    console.log("GTB Nagar store not found");
    process.exit(0);
  }
  console.log(`GTB Nagar Store ID: ${store._id}, Name: ${store.name}`);

  // Fetch OWN STORE scheme
  const allSchemes = await Scheme.find({});
  console.log(`\nAll Schemes in DB:`, allSchemes.map(s => `Name: "${s.name}", Active: ${s.isActive}`));
  const scheme = allSchemes.find(s => s.name.trim().toLowerCase() === "own store");
  if (!scheme) {
    console.log("Scheme 'OWN STORE' not found");
    process.exit(0);
  }
  
  const applicableStoreIds = scheme.applicableStores.map(id => id.toString());
  const isStoreInScheme = applicableStoreIds.includes(store._id.toString());
  console.log(`Is GTB Nagar store in scheme applicableStores? ${isStoreInScheme ? 'YES' : 'NO'}`);
  console.log(`Scheme applicableStores:`, applicableStoreIds);


  // 1. Search in Item model
  const items = await Item.find({ itemName: /FSH25-0071/i });
  console.log(`\nFound ${items.length} Items in Item model:`);
  for (const item of items) {
    console.log(`- ID: ${item._id}`);
    console.log(`  itemName: ${item.itemName}`);
    console.log(`  itemCode: ${item.itemCode}`);
    console.log(`  parent MRP: ${item.mrp}`);
    console.log(`  parent salePrice: ${item.salePrice}`);
    console.log(`  sizes variants:`);
    for (const size of item.sizes || []) {
      console.log(`    - size: ${size.size}, color: ${size.color}, SKU: ${size.sku}, barcode: ${size.barcode}, MRP: ${size.mrp}, salePrice: ${size.salePrice}`);
    }
  }

  // 2. Search in Product model
  const products = await Product.find({ name: /FSH25-0071/i });
  console.log(`\nFound ${products.length} Products in Product model:`);
  for (const product of products) {
    console.log(`- ID: ${product._id}, SKU: ${product.sku}, Name: ${product.name}`);
  }

  // 3. Search in Schemes
  const schemes = await Scheme.find({});
  console.log(`\nChecking schemes for these item/product IDs:`);
  for (const scheme of schemes) {
    const applicableIds = scheme.applicableProducts.map(id => id.toString());
    console.log(`Scheme: ${scheme.name} (ID: ${scheme._id})`);
    console.log(`- Applicable products count: ${applicableIds.length}`);
    for (const item of items) {
      const isItemInScheme = applicableIds.includes(item._id.toString());
      console.log(`  - Item FSH25-0071 ID ${item._id} in scheme? ${isItemInScheme ? 'YES' : 'NO'}`);
    }
    for (const prod of products) {
      const isProdInScheme = applicableIds.includes(prod._id.toString());
      console.log(`  - Product FSH25-0071 ID ${prod._id} in scheme? ${isProdInScheme ? 'YES' : 'NO'}`);
    }
  }

  // 4. Search in StoreInventory for GTB Nagar
  console.log(`\nChecking GTB Nagar store inventory for these items:`);
  for (const item of items) {
    const invs = await StoreInventory.find({ storeId: store._id, itemId: item._id }).populate('itemId');
    if (invs.length > 0) {
      console.log(`- Item ID ${item._id} (${item.itemName}) has ${invs.length} store inventory records:`);
      for (const inv of invs) {
        console.log(`  - VariantID: ${inv.variantId}`);
        console.log(`    Barcode: ${inv.barcode}`);
        console.log(`    QtyAvailable: ${inv.quantityAvailable}`);
        console.log(`    Item Info in StoreInventory:`);
        console.log(`      Item ID: ${inv.itemId?._id}`);
        console.log(`      Item Name: ${inv.itemId?.itemName}`);
        console.log(`      Item Code: ${inv.itemId?.itemCode}`);
        console.log(`      Item Sizes variants list:`, inv.itemId?.sizes?.map(s => ({ id: s._id, size: s.size, color: s.color, barcode: s.barcode, sku: s.sku })));
      }
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

