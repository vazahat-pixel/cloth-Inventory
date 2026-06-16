#!/usr/bin/env node
/**
 * All-stores sales + closing stock report (live data)
 * Usage: node scripts/store_sales_stock_report.js [--startDate=YYYY-MM-DD] [--endDate=YYYY-MM-DD]
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Store = require('../src/models/store.model');
const StoreInventory = require('../src/models/storeInventory.model');
const Sale = require('../src/models/sale.model');
const Item = require('../src/models/item.model');

const RETAIL_SALE_MATCH = {
    isDeleted: false,
    $or: [{ type: { $exists: false } }, { type: { $nin: ['INTERNAL_SALE'] } }],
};

const parseArgs = () => {
    const opts = {};
    process.argv.slice(2).forEach((arg) => {
        const [key, val] = arg.replace(/^--/, '').split('=');
        opts[key] = val || true;
    });
    return opts;
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtAmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function main() {
    const { startDate, endDate } = parseArgs();
    await mongoose.connect(process.env.MONGODB_URI);

    const dateMatch = {};
    if (startDate || endDate) {
        dateMatch.saleDate = {};
        if (startDate) dateMatch.saleDate.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateMatch.saleDate.$lte = end;
        }
    }

    const stores = await Store.find({ isDeleted: { $ne: true } }).sort({ name: 1 }).lean();
    const report = { generatedAt: new Date().toISOString(), dateRange: { startDate: startDate || 'ALL', endDate: endDate || 'ALL' }, stores: [] };

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('  STORE-WISE SALES & CLOSING STOCK REPORT (LIVE)');
    console.log('══════════════════════════════════════════════════════════════\n');

    let grandClosing = 0;
    let grandSalesQty = 0;
    let grandSalesAmt = 0;

    for (const store of stores) {
        const invRows = await StoreInventory.find({ storeId: store._id })
            .populate('itemId', 'itemName itemCode brandName categoryName')
            .lean();

        const itemIds = [...new Set(invRows.map(r => String(r.itemId?._id || r.itemId)).filter(Boolean))];
        const items = itemIds.length ? await Item.find({ _id: { $in: itemIds } }).lean() : [];
        const itemMap = new Map(items.map(i => [String(i._id), i]));

        const sales = await Sale.find({ ...RETAIL_SALE_MATCH, ...dateMatch, storeId: store._id }).lean();

        const salesByVariant = {};
        let totalSalesQty = 0;
        let totalSalesAmt = 0;
        for (const sale of sales) {
            totalSalesAmt += Number(sale.grandTotal || 0);
            for (const line of sale.items || []) {
                const key = `${line.itemId}_${line.variantId || line.barcode}`;
                if (!salesByVariant[key]) {
                    salesByVariant[key] = { qty: 0, amount: 0, barcode: line.barcode, itemId: line.itemId, variantId: line.variantId };
                }
                const q = Number(line.quantity || 0);
                const a = Number(line.total || 0);
                salesByVariant[key].qty += q;
                salesByVariant[key].amount += a;
                totalSalesQty += q;
            }
        }

        let closingStock = 0;
        const lines = invRows.map((inv) => {
            const itemDoc = inv.itemId?._id ? inv.itemId : itemMap.get(String(inv.itemId));
            const variant = itemDoc?.sizes?.find(s => String(s._id) === String(inv.variantId) || s.barcode === inv.barcode || s.sku === inv.barcode);
            const qty = typeof inv.quantityAvailable === 'number' ? inv.quantityAvailable : (inv.quantity || 0);
            closingStock += qty;

            const saleKey = `${inv.itemId}_${inv.variantId}`;
            const saleKey2 = `${String(inv.itemId?._id || inv.itemId)}_${inv.variantId}`;
            const saleInfo = salesByVariant[saleKey] || salesByVariant[saleKey2] || { qty: 0, amount: 0 };

            return {
                barcode: inv.barcode,
                itemName: itemDoc?.itemName || 'Unknown',
                itemCode: itemDoc?.itemCode || '',
                size: variant?.size || '-',
                color: variant?.color || '-',
                closingStock: qty,
                inTransit: inv.quantityInTransit || 0,
                soldQty: saleInfo.qty,
                soldAmount: Number(saleInfo.amount.toFixed(2)),
            };
        }).sort((a, b) => b.closingStock - a.closingStock);

        grandClosing += closingStock;
        grandSalesQty += totalSalesQty;
        grandSalesAmt += totalSalesAmt;

        const storeBlock = {
            storeName: store.name,
            storeCode: store.storeCode,
            storeId: store._id,
            invoiceCount: sales.length,
            totalSalesQty,
            totalSalesAmount: Number(totalSalesAmt.toFixed(2)),
            closingStock,
            inTransitTotal: lines.reduce((s, l) => s + l.inTransit, 0),
            lines,
        };
        report.stores.push(storeBlock);

        console.log(`▶ ${store.name} (${store.storeCode || 'N/A'})`);
        console.log(`  Closing Stock (live) : ${fmt(closingStock)} pcs`);
        console.log(`  Sales Qty            : ${fmt(totalSalesQty)} pcs  |  Invoices: ${sales.length}`);
        console.log(`  Sales Amount         : ${fmtAmt(totalSalesAmt)}`);
        console.log('  ─────────────────────────────────────────────────────────');
        console.log('  Barcode        Item                          Size   Closing  Sold   Amount');
        console.log('  ─────────────────────────────────────────────────────────');

        const topLines = lines.filter(l => l.closingStock > 0 || l.soldQty > 0);
        if (topLines.length === 0) {
            console.log('  (no stock / no sales)');
        } else {
            for (const l of topLines.slice(0, 50)) {
                const name = (l.itemName || '').slice(0, 28).padEnd(28);
                console.log(`  ${String(l.barcode).padEnd(14)} ${name} ${String(l.size).padEnd(6)} ${String(l.closingStock).padStart(7)} ${String(l.soldQty).padStart(6)} ${fmtAmt(l.soldAmount).padStart(12)}`);
            }
            if (topLines.length > 50) {
                console.log(`  ... +${topLines.length - 50} more lines (see JSON file)`);
            }
        }
        console.log('');
    }

    report.grandTotal = {
        closingStock: grandClosing,
        salesQty: grandSalesQty,
        salesAmount: Number(grandSalesAmt.toFixed(2)),
    };

    console.log('══════════════════════════════════════════════════════════════');
    console.log('  GRAND TOTAL (ALL STORES)');
    console.log(`  Closing Stock : ${fmt(grandClosing)} pcs`);
    console.log(`  Sales Qty     : ${fmt(grandSalesQty)} pcs`);
    console.log(`  Sales Amount  : ${fmtAmt(grandSalesAmt)}`);
    console.log('══════════════════════════════════════════════════════════════\n');

    const outPath = path.join(__dirname, '../reports/store_sales_stock_report.json');
    require('fs').writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`Full line-level report saved: ${outPath}\n`);

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
