#!/usr/bin/env node
/**
 * Fix payment rounding on sales + negative warehouse stock.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Sale = require('../src/models/sale.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);

    const sales = await Sale.find({
        isDeleted: false,
        status: { $nin: ['CANCELLED', 'REFUNDED'] },
    }).select('saleNumber grandTotal amountPaid dueAmount payments').lean();

    let paymentFixes = 0;
    for (const sale of sales) {
        const grand = round2(sale.grandTotal || 0);
        const paid = round2(sale.amountPaid || 0);
        const due = round2(sale.dueAmount || 0);
        const diff = round2(grand - (paid + due));
        if (diff > 0 && diff < 1) {
            await Sale.updateOne(
                { _id: sale._id },
                {
                    $set: {
                        amountPaid: grand,
                        dueAmount: 0,
                        ...(sale.payments?.length === 1
                            ? { 'payments.0.amount': grand }
                            : {}),
                    },
                },
            );
            paymentFixes += 1;
            console.log(`Payment fix: ${sale.saleNumber} +₹${diff}`);
        }
    }

    const negRows = await WarehouseInventory.find({
        $or: [{ quantity: { $lt: 0 } }, { quantityInTransit: { $lt: 0 } }],
    }).select('barcode warehouseId quantity quantityInTransit').lean();

    let stockFixes = 0;
    for (const row of negRows) {
        const update = {};
        if ((row.quantity || 0) < 0) update.quantity = 0;
        if ((row.quantityInTransit || 0) < 0) update.quantityInTransit = 0;
        await WarehouseInventory.updateOne({ _id: row._id }, { $set: update });
        stockFixes += 1;
        console.log(`Warehouse stock fix: ${row.barcode} qty ${row.quantity} → 0`);
    }

    console.log(`\nDone: ${paymentFixes} payment(s), ${stockFixes} warehouse stock row(s)`);
    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
