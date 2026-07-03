#!/usr/bin/env node
/**
 * Sync returnedItems on exchange bills — all stores (no stock change).
 * Run backup_all_stores_pre_exchange_fix.js first.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Sale = require('../src/models/sale.model');
const Store = require('../src/models/store.model');
const { resolveExchangeReturnedItems } = require('../src/utils/exchangeSync');
const { aggregateSalesQty, sumExchangeReturnQty } = require('../src/utils/saleReportUtils');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const stores = await Store.find({ isActive: { $ne: false }, name: /REBEL|SHRI KRISHNA/i }).lean();
  const updated = [];
  const skipped = [];
  const errors = [];

  for (const store of stores) {
    const sales = await Sale.find({
      storeId: store._id,
      isDeleted: { $ne: true },
      status: { $nin: ['CANCELLED', 'REFUNDED'] },
      type: 'EXCHANGE',
    });

    for (const sale of sales) {
      if ((sale.returnedItems || []).length > 0) {
        skipped.push({ store: store.name, bill: sale.saleNumber, reason: 'already_has_returnedItems' });
        continue;
      }

      try {
        const lines = await resolveExchangeReturnedItems(sale);
        if (!lines?.length) {
          skipped.push({ store: store.name, bill: sale.saleNumber, reason: 'no_return_data_resolved' });
          continue;
        }

        sale.returnedItems = lines.map(({ _inferredExchange, ...line }) => line);
        if (!sale.exchangeDetails?.items?.length && lines.some((l) => l._inferredExchange)) {
          sale.markModified('returnedItems');
        }
        await sale.save();

        updated.push({
          store: store.name,
          bill: sale.saleNumber,
          exchangeQty: lines.reduce((n, l) => n + Number(l.quantity || 0), 0),
          source: sale.exchangeDetails?.items?.length
            ? 'exchangeDetails'
            : lines[0]?._inferredExchange
              ? 'inferred'
              : 'stock_or_parent',
        });
      } catch (err) {
        errors.push({ store: store.name, bill: sale.saleNumber, error: err.message });
      }
    }
  }

  const verify = [];
  for (const store of stores) {
    const sales = await Sale.find({
      storeId: store._id,
      isDeleted: { $ne: true },
      status: { $nin: ['CANCELLED', 'REFUNDED'] },
      type: 'EXCHANGE',
    }).lean();
    if (!sales.length) continue;
    const qty = aggregateSalesQty(sales);
    verify.push({
      store: store.name,
      exchangeBills: sales.length,
      gross: qty.grossSaleQty,
      exchange: qty.exchangeQty,
      net: qty.netSaleQty,
      bills: sales.map((s) => ({
        bill: s.saleNumber,
        gross: (s.items || []).reduce((n, i) => n + i.quantity, 0),
        exchange: sumExchangeReturnQty(s),
      })),
    });
  }

  console.log(
    JSON.stringify(
      {
        success: errors.length === 0,
        updatedCount: updated.length,
        skippedCount: skipped.length,
        errorCount: errors.length,
        updated,
        skipped,
        errors,
        verify,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
