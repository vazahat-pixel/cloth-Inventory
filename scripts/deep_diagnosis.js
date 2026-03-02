const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));

const Sale = require('../backend/src/models/sale.model');
const StoreInventory = require('../backend/src/models/storeInventory.model');
const StockHistory = require('../backend/src/models/stockHistory.model');
const { SaleStatus, StockHistoryType } = require('../backend/src/core/enums');

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const completedSales = await Sale.find({ status: 'COMPLETED' });
        const failures = [];

        for (const sale of completedSales) {
            if (failures.length >= 10) break;

            const storeId = sale.storeId;
            const products = sale.products;

            for (const item of products) {
                const productId = item.productId;
                const saleQty = item.quantity;

                // 1. Check StockHistory
                const history = await StockHistory.findOne({
                    referenceId: sale._id,
                    referenceModel: 'Sale',
                    productId: productId,
                    type: StockHistoryType.SALE
                });

                // 2. Check StoreInventory
                const inventory = await StoreInventory.findOne({
                    storeId: storeId,
                    productId: productId
                });

                const historyFound = !!history;
                // Since this is a check of "did it occur", and we don't have previous state in a simple query,
                // we'll assume failure if history is missing or inventory is logically inconsistent.
                // If history is missing, it's definitely a FAIL.

                if (!historyFound) {
                    failures.push({
                        saleNumber: sale.saleNumber,
                        storeId: storeId,
                        productId: productId,
                        quantitySold: saleQty,
                        stockHistoryFound: "NO",
                        inventoryUpdated: inventory ? "UNKNOWN (NO HISTORY)" : "NO (INV MISSING)"
                    });
                    if (failures.length >= 10) break;
                }
            }
        }

        console.log("DIAGNOSIS_REPORT_START");
        console.log(JSON.stringify(failures, null, 2));
        console.log("DIAGNOSIS_REPORT_END");

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diagnose();
