require('dotenv').config();
const connectDB = require('./src/config/db');
const Item = require('./src/models/item.model');
const StoreInventory = require('./src/models/storeInventory.model');

async function checkDA3261() {
  await connectDB();
  const regex = new RegExp(`^DA3261$`, 'i');
  
  const parentItem = await Item.findOne({ 
      $or: [
          { itemCode: regex },
          { "sizes.barcode": regex }, 
          { "sizes.sku": regex }
      ]
  });
  console.log("Parent Item:", parentItem ? { 
    id: parentItem._id, 
    code: parentItem.itemCode, 
    sizes: parentItem.sizes.map(s => ({ _id: s._id, sku: s.sku, barcode: s.barcode })) 
  } : 'NOT FOUND');

  if (parentItem) {
    const inventories = await StoreInventory.find({ 
        $or: [
            { itemId: parentItem._id },
            { barcode: regex }
        ]
    });
    console.log("Inventories:");
    inventories.forEach(i => {
      console.log(`- Store: ${i.storeId}, Qty: ${i.quantity}, Avail: ${i.quantityAvailable}, Variant: ${i.variantId}, Barcode: ${i.barcode}`);
    });
  }
  process.exit(0);
}
checkDA3261();
