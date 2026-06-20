#!/usr/bin/env node
/**
 * Delete all data linked to test stores (name/code contains "test").
 * Restores warehouse stock for dispatches that were sent to test stores.
 */
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
const StockHistory = require('../src/models/stockHistory.model');
const Purchase = require('../src/models/purchase.model');
const Invoice = require('../src/models/invoice.model');
const DailyClosure = require('../src/models/dailyClosure.model');
const BillingCounter = require('../src/models/billingCounter.model');
const AuditLog = require('../src/models/auditLog.model');
const Item = require('../src/models/item.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');
const Scheme = require('../src/models/scheme.model');
const Document = require('../src/models/document.model');
const { withTransaction } = require('../src/services/transaction.service');
const stockService = require('../src/services/stock.service');

const TEST_STORE_FILTER = {
  $or: [
    { name: { $regex: /test/i } },
    { storeCode: { $regex: /test/i } },
  ],
};

async function restoreWarehouseForDispatch(dispatch, userId, session) {
  const warehouseId = dispatch.sourceWarehouseId;
  if (!warehouseId) return 0;

  let restoredLines = 0;
  for (const line of dispatch.items || []) {
    const qty = Number(line.qty || 0);
    if (qty <= 0) continue;
    const barcode = line.barcode;
    const variantId = line.variantId;
    const itemId = line.itemId;
    if (!barcode && !variantId) continue;

    // eslint-disable-next-line no-await-in-loop
    await stockService.addStock({
      itemId,
      barcode,
      variantId,
      locationId: warehouseId,
      locationType: 'WAREHOUSE',
      qty,
      type: 'ADJUSTMENT',
      referenceId: dispatch._id,
      referenceType: 'Adjustment',
      performedBy: userId,
      notes: `Test store cleanup — restore stock from deleted dispatch ${dispatch.dispatchNumber}`,
      session,
    });
    restoredLines += 1;
  }
  return restoredLines;
}

async function deleteTestStoreData() {
  await mongoose.connect(process.env.MONGODB_URI);

  const testStores = await Store.find(TEST_STORE_FILTER).lean();
  if (!testStores.length) {
    console.log('No test stores found.');
    await mongoose.disconnect();
    return;
  }

  const storeIds = testStores.map((s) => s._id);
  const storeIdStrings = storeIds.map(String);
  const storeNames = testStores.map((s) => s.name).join(', ');

  console.log(`Found ${testStores.length} test store(s): ${storeNames}`);
  console.log('Store IDs:', storeIdStrings.join(', '));

  const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
  const userId = admin?._id || new mongoose.Types.ObjectId();

  const summary = {};

  await withTransaction(async (session) => {
    const dispatches = await Dispatch.find({ destinationStoreId: { $in: storeIds } }).session(session);
    let restoredLines = 0;
    for (const dispatch of dispatches) {
      if (['DISPATCHED', 'RECEIVED', 'PACKED'].includes(dispatch.status)) {
        // eslint-disable-next-line no-await-in-loop
        restoredLines += await restoreWarehouseForDispatch(dispatch, userId, session);
      }
    }
    summary.warehouseRestoredLines = restoredLines;
    summary.dispatchesDeleted = dispatches.length;

    const saleFilter = { $or: [{ storeId: { $in: storeIds } }, { destinationStoreId: { $in: storeIds } }] };
    const sales = await Sale.find(saleFilter).select('_id saleNumber').session(session).lean();
    summary.salesDeleted = sales.length;

    const invRows = await StoreInventory.find({ storeId: { $in: storeIds } }).select('barcode variantId itemId').session(session).lean();
    const testBarcodes = [...new Set(invRows.map((r) => r.barcode).filter(Boolean))];

    const deleteMany = async (Model, filter, label) => {
      const result = await Model.deleteMany(filter).session(session);
      summary[label] = result.deletedCount || 0;
    };

    await deleteMany(StoreInventory, { storeId: { $in: storeIds } }, 'storeInventoryDeleted');
    await deleteMany(Sale, saleFilter, 'salesDeletedConfirm');
    await deleteMany(Dispatch, { destinationStoreId: { $in: storeIds } }, 'dispatchesDeletedConfirm');
    await deleteMany(DeliveryChallan, { destinationStoreId: { $in: storeIds } }, 'deliveryChallansDeleted');
    await deleteMany(StockReturn, { sourceStoreId: { $in: storeIds } }, 'stockReturnsDeleted');
    await deleteMany(StorePricing, { storeId: { $in: storeIds } }, 'storePricingDeleted');
    await deleteMany(SaleOrder, { storeId: { $in: storeIds } }, 'saleOrdersDeleted');
    await deleteMany(Salesman, { storeId: { $in: storeIds } }, 'salesmenDeleted');
    await deleteMany(Purchase, { storeId: { $in: storeIds } }, 'purchasesDeleted');
    await deleteMany(Invoice, { storeId: { $in: storeIds } }, 'invoicesDeleted');
    await deleteMany(DailyClosure, { storeId: { $in: storeIds } }, 'dailyClosuresDeleted');
    await deleteMany(BillingCounter, { storeId: { $in: storeIds } }, 'billingCountersDeleted');
    await deleteMany(AuditLog, { storeId: { $in: storeIds } }, 'auditLogsDeleted');
    await deleteMany(StockHistory, { storeId: { $in: storeIds } }, 'stockHistoryDeleted');
    await deleteMany(Document, { branchId: { $in: storeIds } }, 'documentsDeleted');

    await deleteMany(StockLedger, {
      locationType: 'STORE',
      locationId: { $in: storeIds },
    }, 'stockLedgerDeleted');

    await deleteMany(StockMovement, {
      $or: [
        { fromLocation: { $in: storeIds } },
        { toLocation: { $in: storeIds } },
      ],
    }, 'stockMovementsDeleted');

    const usersResult = await User.deleteMany({
      shopId: { $in: storeIds },
      role: { $ne: 'admin' },
    }).session(session);
    summary.testUsersDeleted = usersResult.deletedCount || 0;

    await User.updateMany(
      { shopId: { $in: storeIds } },
      { $unset: { shopId: '', shopName: '' } },
    ).session(session);

    await Scheme.updateMany(
      { applicableStores: { $in: storeIds } },
      { $pull: { applicableStores: { $in: storeIds } } },
    ).session(session);

    const storesResult = await Store.deleteMany({ _id: { $in: storeIds } }).session(session);
    summary.storesDeleted = storesResult.deletedCount || 0;

    const orphanItems = [];
    for (const barcode of testBarcodes) {
      // eslint-disable-next-line no-await-in-loop
      const whQty = await WarehouseInventory.findOne({ barcode }).select('quantity').session(session).lean();
      // eslint-disable-next-line no-await-in-loop
      const otherStore = await StoreInventory.findOne({ barcode, storeId: { $nin: storeIds } }).session(session).lean();
      if (!otherStore && (!whQty || (whQty.quantity || 0) <= 0)) {
        const item = await Item.findOne({
          $or: [{ itemCode: barcode }, { 'sizes.sku': barcode }, { 'sizes.barcode': barcode }],
        }).session(session).lean();
        if (item) orphanItems.push(item._id);
      }
    }

    if (orphanItems.length) {
      const itemDelete = await Item.deleteMany({ _id: { $in: orphanItems } }).session(session);
      summary.testItemsDeleted = itemDelete.deletedCount || 0;
    } else {
      summary.testItemsDeleted = 0;
    }
  });

  console.log('\n✅ Test store data deleted successfully:\n');
  console.log(JSON.stringify(summary, null, 2));

  const remaining = await Store.find(TEST_STORE_FILTER).countDocuments();
  console.log(`\nRemaining test stores in DB: ${remaining}`);

  await mongoose.disconnect();
}

deleteTestStoreData().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
