const mongoose = require('mongoose');

async function checkDA3261() {
  await mongoose.connect('mongodb://vazahat:VazaHat0101%40@ac-g6dgyg7-shard-00-00.nmyzy1e.mongodb.net:27017,ac-g6dgyg7-shard-00-01.nmyzy1e.mongodb.net:27017,ac-g6dgyg7-shard-00-02.nmyzy1e.mongodb.net:27017/cloth-inventory?ssl=true&authSource=admin&replicaSet=atlas-2y4vli-shard-0&retryWrites=true&w=majority');
  const Item = require('../src/models/item.model');
  const StoreInventory = require('../src/models/storeInventory.model');

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
    console.log("Inventories:", inventories.map(i => ({ 
      storeId: i.storeId, 
      quantity: i.quantity, 
      quantityAvailable: i.quantityAvailable,
      barcode: i.barcode,
      variantId: i.variantId
    })));
  }
  process.exit(0);
}
checkDA3261();
