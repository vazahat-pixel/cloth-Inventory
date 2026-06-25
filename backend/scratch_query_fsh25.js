require('dotenv').config();
const connectDB = require('./src/config/db');
const Store = require('./src/models/store.model');
const StoreInventory = require('./src/models/storeInventory.model');

async function checkCount() {
  await connectDB();
  
  // Find GTB Nagar Store
  const store = await Store.findOne({ name: /gtb/i });
  if (!store) {
    console.log("GTB Nagar store not found");
    process.exit(0);
  }

  const count = await StoreInventory.countDocuments({ storeId: store._id });
  const positiveStockCount = await StoreInventory.countDocuments({ storeId: store._id, quantityAvailable: { $gt: 0 } });
  
  console.log(`GTB Nagar Store ID: ${store._id}`);
  console.log(`Total inventory records: ${count}`);
  console.log(`Inventory records with positive stock: ${positiveStockCount}`);

  process.exit(0);
}

checkCount().catch(err => {
  console.error(err);
  process.exit(1);
});
