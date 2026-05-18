const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth-inventory';

mongoose.connect(MONGO_URI).then(async () => {
  const WarehouseInventory = require('./src/models/warehouseInventory.model');
  const Item = require('./src/models/item.model');

  // Check DA2139 as itemCode
  const item = await Item.findOne({ itemCode: 'DA2139' }).select('itemCode itemName sizes').lean();
  console.log('DA2139 item:', JSON.stringify(item ? { code: item.itemCode, name: item.itemName, sizes: item.sizes.map(s => ({sku: s.sku, barcode: s.barcode, size: s.size, _id: s._id})) } : null, null, 2));

  if (item) {
    // Check WarehouseInventory for this item
    const stocks = await WarehouseInventory.find({ itemId: item._id }).select('warehouseId barcode variantId quantity').lean();
    console.log('Warehouse stocks for DA2139:', JSON.stringify(stocks, null, 2));
  }

  // Check what barcodes look like for items starting with "DA21"
  const wh = await WarehouseInventory.find({ barcode: /^DA21/i }).select('warehouseId barcode variantId quantity').limit(10).lean();
  console.log('Warehouse barcodes starting with DA21:', wh.map(w => w.barcode));

  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
