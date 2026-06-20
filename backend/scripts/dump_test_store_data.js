#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Store = require('../src/models/store.model');
const StoreInventory = require('../src/models/storeInventory.model');
const Sale = require('../src/models/sale.model');
const Dispatch = require('../src/models/dispatch.model');
const DeliveryChallan = require('../src/models/deliveryChallan.model');
const StockReturn = require('../src/models/stockReturn.model');
const StorePricing = require('../src/models/storePricing.model');
const User = require('../src/models/user.model');
const SaleOrder = require('../src/models/saleOrder.model');
const Salesman = require('../src/models/salesman.model');
const StockMovement = require('../src/models/stockMovement.model');
const StockLedger = require('../src/models/stockLedger.model');
const Purchase = require('../src/models/purchase.model');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

async function summarizeStore(store) {
  const storeId = store._id;
  const sid = String(storeId);

  const [
    invRows,
    invAgg,
    sales,
    salesAgg,
    dispatches,
    challans,
    stockReturns,
    pricing,
    users,
    saleOrders,
    salesmen,
    purchases,
    ledgerAgg,
    movements,
  ] = await Promise.all([
    StoreInventory.find({ storeId }).select('barcode variantId itemName quantity quantityAvailable quantityInTransit mrp').lean(),
    StoreInventory.aggregate([
      { $match: { storeId } },
      {
        $group: {
          _id: null,
          lines: { $sum: 1 },
          totalQty: { $sum: '$quantityAvailable' },
          totalInTransit: { $sum: '$quantityInTransit' },
          totalValue: { $sum: { $multiply: ['$quantityAvailable', { $ifNull: ['$mrp', 0] }] } },
        },
      },
    ]),
    Sale.find({ storeId, isDeleted: { $ne: true } }).select('saleNumber saleDate status grandTotal amountPaid dueAmount items type').sort({ saleDate: -1 }).lean(),
    Sale.aggregate([
      { $match: { storeId, isDeleted: { $ne: true }, status: { $nin: ['CANCELLED', 'REFUNDED'] } } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$grandTotal' }, paid: { $sum: '$amountPaid' }, due: { $sum: '$dueAmount' } } },
    ]),
    Dispatch.find({ destinationStoreId: storeId }).select('dispatchNumber status items createdAt').lean(),
    DeliveryChallan.find({ destinationStoreId: storeId }).select('challanNumber status grandTotal createdAt').lean(),
    StockReturn.find({ sourceStoreId: storeId }).select('returnNumber status items createdAt').lean(),
    StorePricing.find({ storeId }).lean(),
    User.find({ store: storeId }).select('name email role isActive').lean(),
    SaleOrder.find({ storeId }).select('orderNumber status grandTotal createdAt').lean(),
    Salesman.find({ storeId }).select('name phone isActive').lean(),
    Purchase.find({ storeId }).select('purchaseNumber status grandTotal createdAt').lean(),
    StockLedger.aggregate([
      { $match: { locationId: storeId, locationType: 'STORE' } },
      { $group: { _id: '$type', totalQty: { $sum: '$quantity' }, lines: { $sum: 1 } } },
    ]),
    StockMovement.find({
      $or: [{ fromLocation: storeId }, { toLocation: storeId }],
    }).select('type qty referenceType createdAt').sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const invSummary = invAgg[0] || { lines: 0, totalQty: 0, totalInTransit: 0, totalValue: 0 };
  const saleSummary = salesAgg[0] || { count: 0, revenue: 0, paid: 0, due: 0 };

  return {
    store: {
      id: sid,
      name: store.name,
      code: store.storeCode || store.code,
      isActive: store.isActive,
      address: store.address,
      city: store.city,
      state: store.state,
      phone: store.phone,
      email: store.email,
      invoicePrefix: store.invoicePrefix,
      invoiceFooterText: store.invoiceFooterText,
      gstin: store.gstin,
      createdAt: store.createdAt,
    },
    inventory: {
      skuLines: invSummary.lines,
      totalStockQty: invSummary.totalQty || 0,
      inTransitQty: invSummary.totalInTransit || 0,
      stockValueAtMrp: round2(invSummary.totalValue),
      rows: invRows.map((r) => ({
        barcode: r.barcode,
        itemName: r.itemName,
        qty: r.quantityAvailable ?? r.quantity ?? 0,
        inTransit: r.quantityInTransit || 0,
        mrp: r.mrp,
      })),
    },
    sales: {
      invoiceCount: saleSummary.count,
      totalRevenue: round2(saleSummary.revenue),
      totalPaid: round2(saleSummary.paid),
      totalDue: round2(saleSummary.due),
      invoices: sales.map((s) => ({
        saleNumber: s.saleNumber,
        date: s.saleDate,
        status: s.status,
        type: s.type,
        grandTotal: round2(s.grandTotal),
        paid: round2(s.amountPaid),
        due: round2(s.dueAmount),
        itemCount: (s.items || []).length,
        qty: (s.items || []).reduce((sum, i) => sum + Number(i.quantity || 0), 0),
      })),
    },
    dispatches: {
      count: dispatches.length,
      list: dispatches.map((d) => ({
        dispatchNumber: d.dispatchNumber,
        status: d.status,
        itemLines: (d.items || []).length,
        qty: (d.items || []).reduce((s, i) => s + Number(i.qty || 0), 0),
        date: d.createdAt,
      })),
    },
    deliveryChallans: {
      count: challans.length,
      list: challans.map((c) => ({
        challanNumber: c.challanNumber,
        status: c.status,
        grandTotal: round2(c.grandTotal),
        date: c.createdAt,
      })),
    },
    stockReturns: {
      count: stockReturns.length,
      list: stockReturns.map((r) => ({
        returnNumber: r.returnNumber,
        status: r.status,
        itemLines: (r.items || []).length,
        date: r.createdAt,
      })),
    },
    storePricing: { count: pricing.length, rows: pricing },
    users: users.map((u) => ({ name: u.name, email: u.email, role: u.role, active: u.isActive })),
    saleOrders: {
      count: saleOrders.length,
      list: saleOrders.map((o) => ({ orderNumber: o.orderNumber, status: o.status, total: round2(o.grandTotal) })),
    },
    salesmen: salesmen.map((s) => ({ name: s.name, phone: s.phone, active: s.isActive })),
    purchases: {
      count: purchases.length,
      list: purchases.map((p) => ({ purchaseNumber: p.purchaseNumber, status: p.status, total: round2(p.grandTotal) })),
    },
    stockLedger: ledgerAgg.map((l) => ({ type: l._id, lines: l.lines, totalQty: l.totalQty })),
    recentStockMovements: movements.length,
    recentMovementsSample: movements.slice(0, 10),
  };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const testStores = await Store.find({
    $or: [
      { name: { $regex: /test/i } },
      { storeCode: { $regex: /test/i } },
    ],
  }).lean();

  if (!testStores.length) {
    console.log(JSON.stringify({ message: 'No test store found in database' }, null, 2));
    await mongoose.disconnect();
    return;
  }

  const reports = [];
  for (const store of testStores) {
    // eslint-disable-next-line no-await-in-loop
    reports.push(await summarizeStore(store));
  }

  const grand = {
    storesFound: reports.length,
    totalStockQty: reports.reduce((s, r) => s + r.inventory.totalStockQty, 0),
    totalSalesRevenue: round2(reports.reduce((s, r) => s + r.sales.totalRevenue, 0)),
    totalInvoices: reports.reduce((s, r) => s + r.sales.invoiceCount, 0),
    totalSkuLines: reports.reduce((s, r) => s + r.inventory.skuLines, 0),
  };

  console.log(JSON.stringify({ grand, stores: reports }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
