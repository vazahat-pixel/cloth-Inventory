const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const StoreInventory = require('../src/models/storeInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const reportPath = path.join(__dirname, '../reports/store_sales_stock_report.json');
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        console.log("Report Date Range:", reportData.dateRange);
        console.log("Report Generated At:", reportData.generatedAt);

        const rGtb = reportData.stores.find(s => String(s.storeId) === '69ecb1d9f04d7249bd11adf4');
        console.log("\n--- REPORT DATA FOR GTB NAGAR ---");
        console.log("Invoice Count:", rGtb.invoiceCount);
        console.log("Total Sales Qty:", rGtb.totalSalesQty);
        console.log("Total Sales Amount:", rGtb.totalSalesAmount);
        console.log("Closing Stock:", rGtb.closingStock);

        // Fetch DB data for GTB Nagar
        const storeId = '69ecb1d9f04d7249bd11adf4';

        // 1. Get all DB sales for the date range
        // Since we want all June sales or all sales in DB, let's see how many sales we have for GTB in the entire DB.
        const dbSales = await Sale.find({ storeId }).lean();
        
        const dbInvoiceCount = dbSales.length;
        const dbSalesQty = dbSales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + i.quantity, 0), 0);
        const dbSalesAmount = dbSales.reduce((sum, s) => sum + s.grandTotal, 0);

        const inventory = await StoreInventory.find({ storeId }).lean();
        const dbClosingStock = inventory.reduce((sum, i) => sum + i.quantity, 0);

        console.log("\n--- DATABASE DATA FOR GTB NAGAR (ENTIRE DB) ---");
        console.log("Invoice Count:", dbInvoiceCount);
        console.log("Total Sales Qty:", dbSalesQty);
        console.log("Total Sales Amount:", dbSalesAmount.toFixed(2));
        console.log("Closing Stock:", dbClosingStock);

        console.log("\n--- DIFFERENCE (REPORT - DB) ---");
        console.log("Invoice Count Diff:", rGtb.invoiceCount - dbInvoiceCount);
        console.log("Sales Qty Diff:", rGtb.totalSalesQty - dbSalesQty);
        console.log("Sales Amount Diff:", (rGtb.totalSalesAmount - dbSalesAmount).toFixed(2));
        console.log("Closing Stock Diff:", rGtb.closingStock - dbClosingStock);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
