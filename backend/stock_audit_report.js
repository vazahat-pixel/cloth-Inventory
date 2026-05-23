/**
 * STOCK AUDIT REPORT
 * Ye script batayega:
 * 1. GRN se kitna opening stock dala gaya tha
 * 2. Total sales kitni hui (store + warehouse)
 * 3. Kitna dispatch/delivery challan hua
 * 4. Current stock kya hai aur 95324 kyon aa rahi hai
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;

// ─── Models ────────────────────────────────────────────────────────────────────
const GRN = require('./src/models/grn.model');
const StockLedger = require('./src/models/stockLedger.model');
const WarehouseInventory = require('./src/models/warehouseInventory.model');
const Sale = require('./src/models/sale.model');
const Dispatch = require('./src/models/dispatch.model');

function sep(char = '─', len = 70) {
    console.log(char.repeat(len));
}

function header(title) {
    sep('═');
    console.log(`  ${title}`);
    sep('═');
}

function num(n) {
    return Number(n || 0).toLocaleString('en-IN');
}

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log('\n✅ Connected to MongoDB\n');

    // ══════════════════════════════════════════════════════════════
    // SECTION 1: GRN Opening Stock Summary
    // ══════════════════════════════════════════════════════════════
    header('SECTION 1 — GRN Opening Stock Summary (kya dala tha)');

    const grns = await GRN.find({ isDeleted: false }).lean();
    console.log(`\n📦 Total GRNs in Database: ${grns.length}`);

    // Group by type
    const byType = {};
    let totalGrnQty = 0;
    for (const g of grns) {
        const t = g.grnType || 'UNKNOWN';
        if (!byType[t]) byType[t] = { count: 0, totalQty: 0, status: {} };
        byType[t].count++;
        byType[t].totalQty += (g.totalQty || 0);
        byType[t].status[g.status] = (byType[t].status[g.status] || 0) + 1;
        totalGrnQty += (g.totalQty || 0);
    }

    console.log('\n  GRN Type Breakdown:');
    for (const [type, data] of Object.entries(byType)) {
        console.log(`\n  📋 ${type}:`);
        console.log(`     GRN Count  : ${data.count}`);
        console.log(`     Total Qty  : ${num(data.totalQty)} items`);
        console.log(`     Status     : ${JSON.stringify(data.status)}`);
    }
    console.log(`\n  ✅ TOTAL QTY RECEIVED via ALL GRNs: ${num(totalGrnQty)}`);

    // Opening Balance specific
    const obGrns = grns.filter(g => g.grnType === 'OPENING_BALANCE');
    const approvedOB = obGrns.filter(g => g.status === 'APPROVED');
    const obQty = approvedOB.reduce((s, g) => s + (g.totalQty || 0), 0);
    console.log(`\n  📂 Opening Balance GRNs (APPROVED): ${approvedOB.length} GRNs → ${num(obQty)} items`);

    // Check for duplicates
    const grnNums = grns.map(g => g.grnNumber);
    const uniqueNums = new Set(grnNums);
    if (grnNums.length !== uniqueNums.size) {
        console.log(`\n  ⚠️  DUPLICATE GRNs DETECTED! Total: ${grnNums.length}, Unique: ${uniqueNums.size}`);
        const seen = new Set();
        const dupes = [];
        for (const n of grnNums) {
            if (seen.has(n)) dupes.push(n);
            else seen.add(n);
        }
        console.log(`  Duplicate GRN Numbers: ${dupes.join(', ')}`);
    } else {
        console.log(`  ✅ No duplicate GRN numbers found.`);
    }

    // ══════════════════════════════════════════════════════════════
    // SECTION 2: Stock Ledger Analysis (IN vs OUT)
    // ══════════════════════════════════════════════════════════════
    header('SECTION 2 — Stock Ledger Full IN/OUT Analysis');

    const ledgerSummary = await StockLedger.aggregate([
        {
            $group: {
                _id: { type: '$type', source: '$source' },
                totalQty: { $sum: '$quantity' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.type': 1, '_id.source': 1 } }
    ]);

    let totalIn = 0, totalOut = 0;
    console.log('\n  Source-wise breakdown:');
    console.log('  ' + '-'.repeat(50));
    console.log('  TYPE  | SOURCE                  | QTY         | COUNT');
    console.log('  ' + '-'.repeat(50));
    for (const row of ledgerSummary) {
        const t = row._id.type.padEnd(5);
        const s = (row._id.source || 'UNKNOWN').padEnd(24);
        const q = num(row.totalQty).padStart(12);
        console.log(`  ${t} | ${s} | ${q} | ${row.count}`);
        if (row._id.type === 'IN') totalIn += row.totalQty;
        else totalOut += row.totalQty;
    }
    console.log('  ' + '-'.repeat(50));
    console.log(`\n  📥 TOTAL IN  (all sources) : ${num(totalIn)}`);
    console.log(`  📤 TOTAL OUT (all sources) : ${num(totalOut)}`);
    console.log(`  📊 NET LEDGER BALANCE      : ${num(totalIn - totalOut)}`);

    // ══════════════════════════════════════════════════════════════
    // SECTION 3: GRN duplicate ledger entries (ROOT CAUSE CHECK)
    // ══════════════════════════════════════════════════════════════
    header('SECTION 3 — Duplicate GRN Stock Ledger Entries Check');

    const grnLedgerDupes = await StockLedger.aggregate([
        { $match: { source: { $in: ['GRN', 'OPENING_BALANCE'] } } },
        {
            $group: {
                _id: '$referenceId',
                entries: { $sum: 1 },
                totalPosted: { $sum: '$quantity' }
            }
        },
        { $match: { entries: { $gt: 1 } } },
        { $sort: { entries: -1 } },
        { $limit: 20 }
    ]);

    if (grnLedgerDupes.length === 0) {
        console.log('\n  ✅ No duplicate ledger entries found for GRNs');
    } else {
        console.log(`\n  ⚠️  GRNs with MULTIPLE ledger entries (possible double-posting):`);
        for (const d of grnLedgerDupes) {
            // Try to find GRN
            let grnInfo = null;
            try {
                grnInfo = await GRN.findById(d._id).lean();
            } catch(e) {}
            console.log(`\n  GRN Ref: ${d._id}`);
            console.log(`     GRN Number  : ${grnInfo?.grnNumber || 'N/A'}`);
            console.log(`     GRN Type    : ${grnInfo?.grnType || 'N/A'}`);
            console.log(`     GRN Qty     : ${num(grnInfo?.totalQty)}`);
            console.log(`     Ledger Posts: ${d.entries} times → ${num(d.totalPosted)} total posted`);
            if (grnInfo) {
                const expectedQty = grnInfo.totalQty || 0;
                const actualPosted = d.totalPosted;
                if (actualPosted > expectedQty) {
                    console.log(`     🚨 OVER-POSTED by ${num(actualPosted - expectedQty)} items!`);
                }
            }
        }
    }

    // ══════════════════════════════════════════════════════════════
    // SECTION 4: Current Warehouse Inventory
    // ══════════════════════════════════════════════════════════════
    header('SECTION 4 — Current Warehouse Inventory (ab kya hai)');

    const whInvTotal = await WarehouseInventory.aggregate([
        {
            $group: {
                _id: '$warehouseId',
                totalQty: { $sum: '$quantity' },
                totalReserved: { $sum: '$reservedQuantity' },
                totalDamaged: { $sum: '$damagedQuantity' },
                skuCount: { $sum: 1 }
            }
        }
    ]);

    let grandWhTotal = 0;
    for (const wh of whInvTotal) {
        const Warehouse = require('./src/models/warehouse.model');
        const whDoc = await Warehouse.findById(wh._id).lean();
        grandWhTotal += wh.totalQty;
        console.log(`\n  🏭 Warehouse: ${whDoc?.name || wh._id}`);
        console.log(`     Available Qty  : ${num(wh.totalQty)}`);
        console.log(`     Reserved Qty   : ${num(wh.totalReserved)}`);
        console.log(`     Damaged Qty    : ${num(wh.totalDamaged)}`);
        console.log(`     Unique SKUs    : ${num(wh.skuCount)}`);
    }
    console.log(`\n  📦 TOTAL WAREHOUSE STOCK (all warehouses): ${num(grandWhTotal)}`);

    // ══════════════════════════════════════════════════════════════
    // SECTION 5: Sales Summary
    // ══════════════════════════════════════════════════════════════
    header('SECTION 5 — Sales Summary (kitni sale hui)');

    try {
        const salesAgg = await Sale.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalItems: { $sum: { $reduce: { input: '$items', initialValue: 0, in: { $add: ['$$value', '$$this.qty'] } } } }
                }
            }
        ]);
        let totalSaleQty = 0;
        console.log('\n  Sales by Status:');
        for (const s of salesAgg) {
            console.log(`  ${(s._id || 'UNKNOWN').padEnd(20)}: ${num(s.count)} sales, ${num(s.totalItems)} items`);
            totalSaleQty += (s.totalItems || 0);
        }
        console.log(`\n  🛒 TOTAL ITEMS SOLD (all statuses): ${num(totalSaleQty)}`);
    } catch(e) {
        console.log('  Could not fetch sales:', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // SECTION 6: Dispatch Summary
    // ══════════════════════════════════════════════════════════════
    header('SECTION 6 — Dispatch Summary (kitna dispatch hua)');

    try {
        const dispatchLedger = await StockLedger.aggregate([
            { $match: { source: 'DISPATCH', type: 'OUT' } },
            { $group: { _id: null, totalQty: { $sum: '$quantity' }, count: { $sum: 1 } } }
        ]);
        const dChallanLedger = await StockLedger.aggregate([
            { $match: { source: 'DELIVERYCHALLAN', type: 'OUT' } },
            { $group: { _id: null, totalQty: { $sum: '$quantity' }, count: { $sum: 1 } } }
        ]);
        const transferLedger = await StockLedger.aggregate([
            { $match: { source: 'TRANSFER', type: 'OUT' } },
            { $group: { _id: null, totalQty: { $sum: '$quantity' }, count: { $sum: 1 } } }
        ]);
        console.log(`\n  🚚 Dispatch (DISPATCH source)         : ${num(dispatchLedger[0]?.totalQty)} items (${dispatchLedger[0]?.count || 0} entries)`);
        console.log(`  📄 Delivery Challan (DELIVERYCHALLAN) : ${num(dChallanLedger[0]?.totalQty)} items (${dChallanLedger[0]?.count || 0} entries)`);
        console.log(`  🔄 Transfers (TRANSFER)               : ${num(transferLedger[0]?.totalQty)} items (${transferLedger[0]?.count || 0} entries)`);
    } catch(e) {
        console.log('  Could not fetch dispatch data:', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // SECTION 7: THE MAIN QUESTION — Why 95324?
    // ══════════════════════════════════════════════════════════════
    header('SECTION 7 — WHY IS CURRENT STOCK 95,324? (Root Cause)');

    console.log('\n  Formula: Stock = Total IN - Total OUT');
    console.log(`\n  📥 Total IN  from ledger: ${num(totalIn)}`);
    console.log(`  📤 Total OUT from ledger: ${num(totalOut)}`);
    console.log(`  📊 Expected Stock       : ${num(totalIn - totalOut)}`);
    console.log(`  📦 Actual WH Inventory  : ${num(grandWhTotal)}`);

    const diff = grandWhTotal - (totalIn - totalOut);
    if (Math.abs(diff) > 1) {
        console.log(`\n  ⚠️  MISMATCH: ${num(Math.abs(diff))} items difference!`);
        if (diff > 0) {
            console.log('     → WarehouseInventory has MORE than ledger says (possible direct DB manipulation or sync issue)');
        } else {
            console.log('     → WarehouseInventory has LESS than ledger says (possible ledger double-counting)');
        }
    } else {
        console.log(`\n  ✅ Stock matches ledger. The 95,324 is the correct computed balance.`);
    }

    // ══════════════════════════════════════════════════════════════
    // SECTION 8: Opening Balance GRN — were they posted multiple times?
    // ══════════════════════════════════════════════════════════════
    header('SECTION 8 — Opening Balance GRN Post Count Verification');

    for (const g of approvedOB) {
        const ledgerForGrn = await StockLedger.aggregate([
            { $match: { referenceId: g._id.toString() } },
            { $group: { _id: '$type', totalQty: { $sum: '$quantity' }, count: { $sum: 1 } } }
        ]);
        const inEntries = ledgerForGrn.find(x => x._id === 'IN');
        const grnQty = g.totalQty || 0;
        const postedQty = inEntries?.totalQty || 0;

        if (postedQty > grnQty && grnQty > 0) {
            console.log(`\n  🚨 GRN ${g.grnNumber} (${g.grnType})`);
            console.log(`     GRN Declared Qty   : ${num(grnQty)}`);
            console.log(`     Actually Posted Qty: ${num(postedQty)}`);
            console.log(`     Times Over-Posted  : ${(postedQty / grnQty).toFixed(1)}x`);
            console.log(`     EXTRA INFLATED QTY : +${num(postedQty - grnQty)}`);
        }
    }

    if (approvedOB.length === 0) {
        console.log('\n  No APPROVED Opening Balance GRNs found to check.');
    }

    sep('═');
    console.log('\n✅ AUDIT COMPLETE\n');
    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
