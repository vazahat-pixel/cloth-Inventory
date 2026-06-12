require('dotenv').config();
const connectDB = require('./src/config/db');
const WarehouseInventory = require('./src/models/warehouseInventory.model');

async function checkDA3261() {
  await connectDB();
  const regex = new RegExp(`^DA3261$`, 'i');

  const inventories = await WarehouseInventory.find({ 
      barcode: regex
  });
  console.log("Warehouse Inventories:", inventories.map(i => ({ 
    warehouseId: i.warehouseId, 
    quantity: i.quantity, 
    barcode: i.barcode
  })));
  process.exit(0);
}
checkDA3261();
