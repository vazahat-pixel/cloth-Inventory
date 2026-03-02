const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));

const Sale = require('../backend/src/models/sale.model');
const StoreInventory = require('../backend/src/models/storeInventory.model');
const StockHistory = require('../backend/src/models/stockHistory.model');
const { StockHistoryType } = require('../backend/src/core/enums');

async function comparison() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. Get last 10 sales (highest saleNumbers)
        const lastSales = await Sale.find({ status: 'COMPLETED' })
            .sort({ saleNumber: -1 })
            .limit(10);

        const results = [];

        for (const sale of lastSales) {
            let historyPass = true;
            let inventoryPass = true;

            for (const item of sale.products) {
                // Check StockHistory
                const history = await StockHistory.findOne({
                    referenceId: sale._id,
                    referenceModel: 'Sale',
                    productId: item.productId,
                    type: StockHistoryType.SALE
                });
                if (!history) historyPass = false;

                // Check StoreInventory
                const inventory = await StoreInventory.findOne({
                    storeId: sale.storeId,
                    productId: item.productId
                });

                // If quantitySold is 0 for a completed sale, it's a FAIL for "decreased/updated"
                if (!inventory || inventory.quantitySold === 0) {
                    inventoryPass = false;
                }
            }

            results.push({
                saleNumber: sale.saleNumber,
                stockHistoryExists: historyPass ? "PASS" : "FAIL",
                inventoryUpdated: inventoryPass ? "PASS" : "FAIL"
            });
        }

        console.log("COMPARISON_REPORT_START");
        console.table(results);
        console.log("COMPARISON_REPORT_END");

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

comparison();
