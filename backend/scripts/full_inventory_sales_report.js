/**
 * All-time complete sales + stock report (all stores + warehouses)
 * Usage: node scripts/full_inventory_sales_report.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const Store = require('../src/models/store.model');
  const Warehouse = require('../src/models/warehouse.model');
  const Sale = require('../src/models/sale.model');
  const StoreInventory = require('../src/models/storeInventory.model');
  const WarehouseInventory = require('../src/models/warehouseInventory.model');
  const Item = require('../src/models/item.model');

  const stores = await Store.find({}).sort({ name: 1 }).lean();
  const warehouses = await Warehouse.find({}).sort({ name: 1 }).lean();
  const storeMap = Object.fromEntries(stores.map((s) => [String(s._id), s.name]));
  const whMap = Object.fromEntries(warehouses.map((w) => [String(w._id), w.name || w.warehouseName]));

  // --- SALES (all time, non-deleted, non-cancelled) ---
  const sales = await Sale.find({
    isDeleted: false,
    status: { $nin: ['CANCELLED', 'REFUNDED'] },
  }).lean();

  const salesByStore = {};
  const salesGrand = {
    totalInvoices: 0,
    totalQuantity: 0,
    grossAmount: 0,
    taxAmount: 0,
    discount: 0,
    netAmount: 0,
  };

  sales.forEach((s) => {
    const sid = String(s.storeId);
    const storeName = storeMap[sid] || whMap[sid] || `Unknown (${sid})`;
    if (!salesByStore[sid]) {
      salesByStore[sid] = {
        storeId: sid,
        storeName,
        totalInvoices: 0,
        totalQuantity: 0,
        grossAmount: 0,
        taxAmount: 0,
        discount: 0,
        netAmount: 0,
        invoices: [],
      };
    }
    const qty = (s.items || []).reduce((sum, i) => sum + num(i.quantity), 0);
    const gross = num(s.subTotal);
    const tax = num(s.tax || s.taxAmount || s.totalTax);
    const discount = num(s.discount);
    const net = num(s.grandTotal);

    salesByStore[sid].totalInvoices += 1;
    salesByStore[sid].totalQuantity += qty;
    salesByStore[sid].grossAmount += gross;
    salesByStore[sid].taxAmount += tax;
    salesByStore[sid].discount += discount;
    salesByStore[sid].netAmount += net;
    salesByStore[sid].invoices.push({
      saleNumber: s.saleNumber,
      date: s.saleDate ? new Date(s.saleDate).toISOString().slice(0, 10) : '',
      customer: s.customerName || 'Walk-in',
      quantity: qty,
      gross: round2(gross),
      tax: round2(tax),
      net: round2(net),
      paymentMode: s.paymentMode,
    });

    salesGrand.totalInvoices += 1;
    salesGrand.totalQuantity += qty;
    salesGrand.grossAmount += gross;
    salesGrand.taxAmount += tax;
    salesGrand.discount += discount;
    salesGrand.netAmount += net;
  });

  Object.values(salesByStore).forEach((row) => {
    row.grossAmount = round2(row.grossAmount);
    row.taxAmount = round2(row.taxAmount);
    row.discount = round2(row.discount);
    row.netAmount = round2(row.netAmount);
    row.invoices.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  });
  salesGrand.grossAmount = round2(salesGrand.grossAmount);
  salesGrand.taxAmount = round2(salesGrand.taxAmount);
  salesGrand.discount = round2(salesGrand.discount);
  salesGrand.netAmount = round2(salesGrand.netAmount);

  // --- STORE STOCK ---
  const storeInv = await StoreInventory.find({}).lean();
  const items = await Item.find({}).select('itemName itemCode sizes').lean();
  const itemNameMap = {};
  const variantMeta = {};
  items.forEach((it) => {
    itemNameMap[String(it._id)] = it.itemName;
    (it.sizes || []).forEach((sz) => {
      const meta = {
        itemName: it.itemName,
        sku: sz.sku || '',
        size: sz.size || '',
        color: sz.color || sz.shade || '',
        barcode: sz.barcode || '',
      };
      if (sz._id) variantMeta[String(sz._id)] = meta;
      if (sz.sku) variantMeta[sz.sku] = meta;
      if (sz.barcode) variantMeta[sz.barcode] = meta;
    });
  });

  const stockByStore = {};
  const stockGrand = {
    totalVariants: 0,
    closingStock: 0,
    inTransit: 0,
    damaged: 0,
    sold: 0,
    returned: 0,
    estimatedValue: 0,
  };

  storeInv.forEach((row) => {
    const sid = String(row.storeId);
    const storeName = storeMap[sid] || `Unknown Store (${sid})`;
    const closing = num(row.quantityAvailable ?? row.quantity);
    const inTransit = num(row.quantityInTransit);
    const damaged = num(row.damagedQuantity);
    const sold = num(row.quantitySold);
    const returned = num(row.quantityReturned);
    const rate = num(row.lastPurchaseRate);
    const value = closing * rate;

    const vid = String(row.variantId || '');
    const meta = variantMeta[vid] || variantMeta[row.barcode] || {};
    const itemName = itemNameMap[String(row.itemId)] || meta.itemName || 'Unknown';

    if (!stockByStore[sid]) {
      stockByStore[sid] = {
        storeId: sid,
        storeName,
        totalVariants: 0,
        closingStock: 0,
        inTransit: 0,
        damaged: 0,
        sold: 0,
        returned: 0,
        estimatedValue: 0,
        lines: [],
      };
    }

    if (closing > 0 || inTransit > 0 || damaged > 0) {
      stockByStore[sid].totalVariants += 1;
      stockByStore[sid].closingStock += closing;
      stockByStore[sid].inTransit += inTransit;
      stockByStore[sid].damaged += damaged;
      stockByStore[sid].sold += sold;
      stockByStore[sid].returned += returned;
      stockByStore[sid].estimatedValue += value;
      stockByStore[sid].lines.push({
        itemName,
        sku: meta.sku || row.barcode,
        size: meta.size,
        color: meta.color,
        barcode: row.barcode,
        closingStock: closing,
        inTransit,
        damaged,
        sold,
        returned,
        rate: round2(rate),
        value: round2(value),
      });

      stockGrand.totalVariants += 1;
      stockGrand.closingStock += closing;
      stockGrand.inTransit += inTransit;
      stockGrand.damaged += damaged;
      stockGrand.sold += sold;
      stockGrand.returned += returned;
      stockGrand.estimatedValue += value;
    }
  });

  Object.values(stockByStore).forEach((row) => {
    row.closingStock = round2(row.closingStock);
    row.inTransit = round2(row.inTransit);
    row.estimatedValue = round2(row.estimatedValue);
    row.lines.sort((a, b) => b.closingStock - a.closingStock);
  });
  stockGrand.closingStock = round2(stockGrand.closingStock);
  stockGrand.inTransit = round2(stockGrand.inTransit);
  stockGrand.estimatedValue = round2(stockGrand.estimatedValue);

  // --- WAREHOUSE STOCK ---
  const whInv = await WarehouseInventory.find({}).lean();
  const stockByWarehouse = {};
  const whGrand = {
    totalVariants: 0,
    closingStock: 0,
    reserved: 0,
    damaged: 0,
    inTransit: 0,
    estimatedValue: 0,
  };

  whInv.forEach((row) => {
    const wid = String(row.warehouseId);
    const whName = whMap[wid] || `Unknown Warehouse (${wid})`;
    const closing = num(row.quantity);
    const reserved = num(row.reservedQuantity);
    const damaged = num(row.damagedQuantity);
    const inTransit = num(row.quantityInTransit);

    const vid = String(row.variantId || '');
    const meta = variantMeta[vid] || variantMeta[row.barcode] || {};
    const itemName = itemNameMap[String(row.itemId)] || meta.itemName || 'Unknown';

    if (!stockByWarehouse[wid]) {
      stockByWarehouse[wid] = {
        warehouseId: wid,
        warehouseName: whName,
        totalVariants: 0,
        closingStock: 0,
        reserved: 0,
        damaged: 0,
        inTransit: 0,
        lines: [],
      };
    }

    if (closing > 0 || reserved > 0 || damaged > 0 || inTransit > 0) {
      stockByWarehouse[wid].totalVariants += 1;
      stockByWarehouse[wid].closingStock += closing;
      stockByWarehouse[wid].reserved += reserved;
      stockByWarehouse[wid].damaged += damaged;
      stockByWarehouse[wid].inTransit += inTransit;
      stockByWarehouse[wid].lines.push({
        itemName,
        sku: meta.sku || row.barcode,
        size: meta.size,
        color: meta.color,
        barcode: row.barcode,
        closingStock: closing,
        reserved,
        damaged,
        inTransit,
      });

      whGrand.totalVariants += 1;
      whGrand.closingStock += closing;
      whGrand.reserved += reserved;
      whGrand.damaged += damaged;
      whGrand.inTransit += inTransit;
    }
  });

  Object.values(stockByWarehouse).forEach((row) => {
    row.closingStock = round2(row.closingStock);
    row.reserved = round2(row.reserved);
    row.inTransit = round2(row.inTransit);
    row.lines.sort((a, b) => b.closingStock - a.closingStock);
  });
  whGrand.closingStock = round2(whGrand.closingStock);
  whGrand.reserved = round2(whGrand.reserved);
  whGrand.inTransit = round2(whGrand.inTransit);

  const report = {
    generatedAt: new Date().toISOString(),
    period: 'ALL TIME',
    salesSummary: salesGrand,
    salesByStore: Object.values(salesByStore).sort((a, b) => b.netAmount - a.netAmount),
    storeStockSummary: stockGrand,
    storeStockByStore: Object.values(stockByStore).sort((a, b) => b.closingStock - a.closingStock),
    warehouseStockSummary: whGrand,
    warehouseStockByLocation: Object.values(stockByWarehouse).sort((a, b) => b.closingStock - a.closingStock),
  };

  const outDir = path.join(__dirname, '../reports/full');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(outDir, `complete-report-${stamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // CSV exports
  const csv = (headers, rows) => [headers.join(','), ...rows.map((r) => headers.map((h) => {
    const v = r[h];
    const s = v == null ? '' : String(v);
    return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','))].join('\n');

  fs.writeFileSync(path.join(outDir, `sales-by-store-${stamp}.csv`), csv(
    ['storeName', 'totalInvoices', 'totalQuantity', 'grossAmount', 'taxAmount', 'discount', 'netAmount'],
    report.salesByStore.map(({ storeName, totalInvoices, totalQuantity, grossAmount, taxAmount, discount, netAmount }) => ({
      storeName, totalInvoices, totalQuantity, grossAmount, taxAmount, discount, netAmount,
    })),
  ));

  const allInvoices = [];
  report.salesByStore.forEach((s) => {
    s.invoices.forEach((inv) => allInvoices.push({ storeName: s.storeName, ...inv }));
  });
  fs.writeFileSync(path.join(outDir, `all-sales-detail-${stamp}.csv`), csv(
    ['storeName', 'saleNumber', 'date', 'customer', 'quantity', 'gross', 'tax', 'net', 'paymentMode'],
    allInvoices,
  ));

  fs.writeFileSync(path.join(outDir, `store-stock-by-store-${stamp}.csv`), csv(
    ['storeName', 'totalVariants', 'closingStock', 'inTransit', 'damaged', 'sold', 'returned', 'estimatedValue'],
    report.storeStockByStore.map(({ storeName, totalVariants, closingStock, inTransit, damaged, sold, returned, estimatedValue }) => ({
      storeName, totalVariants, closingStock, inTransit, damaged, sold, returned, estimatedValue,
    })),
  ));

  const allStoreLines = [];
  report.storeStockByStore.forEach((s) => {
    s.lines.forEach((l) => allStoreLines.push({ storeName: s.storeName, ...l }));
  });
  fs.writeFileSync(path.join(outDir, `store-stock-detail-${stamp}.csv`), csv(
    ['storeName', 'itemName', 'sku', 'size', 'color', 'barcode', 'closingStock', 'inTransit', 'damaged', 'sold', 'returned', 'rate', 'value'],
    allStoreLines,
  ));

  fs.writeFileSync(path.join(outDir, `warehouse-stock-by-location-${stamp}.csv`), csv(
    ['warehouseName', 'totalVariants', 'closingStock', 'reserved', 'damaged', 'inTransit'],
    report.warehouseStockByLocation.map(({ warehouseName, totalVariants, closingStock, reserved, damaged, inTransit }) => ({
      warehouseName, totalVariants, closingStock, reserved, damaged, inTransit,
    })),
  ));

  const allWhLines = [];
  report.warehouseStockByLocation.forEach((w) => {
    w.lines.forEach((l) => allWhLines.push({ warehouseName: w.warehouseName, ...l }));
  });
  fs.writeFileSync(path.join(outDir, `warehouse-stock-detail-${stamp}.csv`), csv(
    ['warehouseName', 'itemName', 'sku', 'size', 'color', 'barcode', 'closingStock', 'reserved', 'damaged', 'inTransit'],
    allWhLines,
  ));

  // Console summary
  console.log('\n========== ALL-TIME COMPLETE REPORT ==========\n');
  console.log('--- ALL STORES SALES (TOTAL) ---');
  console.log(JSON.stringify(salesGrand, null, 2));
  console.log('\n--- SALES BY STORE ---');
  report.salesByStore.forEach((s) => {
    console.log(`${s.storeName}: ${s.totalInvoices} invoices | Qty ${s.totalQuantity} | Net ₹${s.netAmount}`);
  });
  console.log('\n--- ALL STORES CLOSING STOCK (TOTAL) ---');
  console.log(JSON.stringify(stockGrand, null, 2));
  console.log('\n--- CLOSING STOCK BY STORE ---');
  report.storeStockByStore.forEach((s) => {
    console.log(`${s.storeName}: ${s.totalVariants} variants | Closing ${s.closingStock} pcs | In-transit ${s.inTransit} | Value ₹${s.estimatedValue}`);
  });
  console.log('\n--- WAREHOUSE STOCK (TOTAL) ---');
  console.log(JSON.stringify(whGrand, null, 2));
  console.log('\n--- WAREHOUSE STOCK BY LOCATION ---');
  report.warehouseStockByLocation.forEach((w) => {
    console.log(`${w.warehouseName}: ${w.totalVariants} variants | Stock ${w.closingStock} pcs | Reserved ${w.reserved} | In-transit ${w.inTransit}`);
  });
  console.log(`\nFiles saved to: ${outDir}`);
  console.log(`JSON: ${jsonPath}`);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
