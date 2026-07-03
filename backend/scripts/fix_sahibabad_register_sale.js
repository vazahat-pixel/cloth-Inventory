#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Sale = require('../src/models/sale.model');
const StoreInventory = require('../src/models/storeInventory.model');

const SAHIBABAD_ID = '69ecbe2cf04d7249bd11ae45';

async function resolveReturnLine(storeId, rItem, origSale) {
  const matched = origSale?.items?.find((si) => si.barcode === rItem.barcode);
  if (matched?.itemId && matched?.variantId) {
    return {
      itemId: matched.itemId,
      barcode: rItem.barcode,
      variantId: matched.variantId,
      itemName: matched.itemName || '',
      sku: matched.sku || rItem.barcode,
      quantity: rItem.quantity,
      mrp: rItem.mrp || matched.mrp || 0,
      rate: rItem.rate || matched.rate || 0,
      total: matched.quantity ? (matched.total / matched.quantity) * rItem.quantity : 0,
    };
  }
  const inv = await StoreInventory.findOne({ storeId, barcode: rItem.barcode })
    .select('itemId variantId')
    .lean();
  if (!inv?.itemId || !inv?.variantId) {
    throw new Error(`Cannot resolve item for barcode ${rItem.barcode}`);
  }
  return {
    itemId: inv.itemId,
    barcode: rItem.barcode,
    variantId: inv.variantId,
    itemName: '',
    sku: rItem.barcode,
    quantity: rItem.quantity,
    mrp: rItem.mrp || 0,
    rate: rItem.rate || 0,
    total: 0,
  };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const sales = await Sale.find({
    storeId: SAHIBABAD_ID,
    'exchangeDetails.items.0': { $exists: true },
    $or: [{ returnedItems: { $exists: false } }, { returnedItems: { $size: 0 } }],
  });

  const updated = [];
  for (const sale of sales) {
    const origSale = sale.exchangeDetails?.originalSaleId
      ? await Sale.findById(sale.exchangeDetails.originalSaleId).lean()
      : null;
    const returnLines = [];
    for (const rItem of sale.exchangeDetails.items || []) {
      returnLines.push(await resolveReturnLine(SAHIBABAD_ID, rItem, origSale));
    }
    sale.returnedItems = returnLines;
    await sale.save();
    updated.push({ bill: sale.saleNumber, qty: returnLines.reduce((n, x) => n + x.quantity, 0) });
  }

  console.log(JSON.stringify({ updatedExchanges: updated }, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
