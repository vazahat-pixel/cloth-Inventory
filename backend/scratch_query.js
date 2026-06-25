const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth-inventory';

mongoose.connect(MONGO_URI).then(async () => {
  const Sale = require('./src/models/sale.model');
  const Grn = require('./src/models/grn.model');
  const SystemLog = require('./src/models/systemLog.model');

  const Item = require('./src/models/item.model');


  const searchPattern = 'AW24CTR0007';
  const barcode = searchPattern;
  console.log(`Searching for pricing history of style "${searchPattern}"...`);

  // 0. Item search
  const items = await Item.find({
    $or: [
      { itemCode: new RegExp(searchPattern, 'i') },
      { itemName: new RegExp(searchPattern, 'i') },
      { 'sizes.barcode': new RegExp(searchPattern, 'i') },
      { 'sizes.sku': new RegExp(searchPattern, 'i') }
    ]
  }).lean();
  console.log(`Item catalog matches: ${items.length}`);
  items.forEach(item => {
    console.log(`- Item doc: ${item.itemName} (${item.itemCode}) | Parent MRP: ${item.mrp}`);
    item.sizes.forEach(size => {
      console.log(`  - Size variant: ${size.size} / ${size.color} | Barcode: ${size.barcode} | SKU: ${size.sku} | MRP: ${size.mrp}`);
    });
  });

  // 1. Sales search
  const sales = await Sale.find({
    $or: [
      { 'products.barcode': new RegExp(searchPattern, 'i') },
      { 'products.sku': new RegExp(searchPattern, 'i') }
    ]
  }).lean();
  console.log(`Sales matches: ${sales.length}`);
  sales.forEach(sale => {
    sale.products.forEach(p => {
      if (p.barcode?.includes(barcode) || p.sku?.includes(barcode)) {
        console.log(`- Sale ${sale.saleNumber} | Product: ${p.barcode}/${p.sku} | MRP: ${p.mrp} | Rate: ${p.rate} | Name: ${p.itemName}`);
      }
    });
  });

  // 2. GRNs search
  const grns = await Grn.find({
    $or: [
      { 'items.sku': barcode },
      { 'items.barcode': barcode },
      { 'items.sku': new RegExp(barcode, 'i') }
    ]
  }).lean();
  console.log(`GRN matches: ${grns.length}`);
  grns.forEach(grn => {
    grn.items.forEach(item => {
      const sku = item.sku || item.barcode;
      if (sku?.includes(barcode)) {
        console.log(`- GRN ${grn.grnNumber} | Item: ${sku} | CostPrice (MRP): ${item.costPrice} | Name: ${item.itemName}`);
      }
    });
  });

  // 3. SystemLog search
  const logs = await SystemLog.find({
    action: { $in: ['POST /api/sales', 'POST /api/grn', 'POST /api/sales/create'] },
    $or: [
      { 'details.body.products.barcode': new RegExp(barcode, 'i') },
      { 'details.body.items.barcode': new RegExp(barcode, 'i') },
      { 'details.body.items.sku': new RegExp(barcode, 'i') }
    ]
  }).lean();
  console.log(`SystemLogs matches: ${logs.length}`);
  logs.forEach(log => {
    const body = log.details.body;
    if (Array.isArray(body.products)) {
      body.products.forEach(p => {
        const sku = p.barcode || p.sku;
        if (sku?.includes(barcode)) {
          console.log(`- Log ${log.action} (${log.createdAt}) | Product: ${sku} | MRP: ${p.mrp} | Price: ${p.price} | Name: ${p.itemName}`);
        }
      });
    }
    if (Array.isArray(body.items)) {
      body.items.forEach(item => {
        const sku = item.barcode || item.sku;
        if (sku?.includes(barcode)) {
          console.log(`- Log ${log.action} (${log.createdAt}) | Item: ${sku} | MRP: ${item.mrp} | CostPrice: ${item.costPrice} | Name: ${item.itemName}`);
        }
      });
    }
  });

  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
