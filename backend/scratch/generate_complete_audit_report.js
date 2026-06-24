const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Store = require('../src/models/store.model');
const Warehouse = require('../src/models/warehouse.model');
const Sale = require('../src/models/sale.model');
const StoreInventory = require('../src/models/storeInventory.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("=== STARTING COMPLETE AUDIT REPORT ===");

        // 1. Get all stores and warehouses
        const stores = await Store.find({ isActive: true }).lean();
        const warehouses = await Warehouse.find({ isActive: true }).lean();

        console.log(`Found ${stores.length} active stores and ${warehouses.length} active warehouses.`);

        // 2. Warehouse Stock
        console.log("\n=== WAREHOUSE STOCK STATUS ===");
        let grandWarehouseStock = 0;
        for (const wh of warehouses) {
            const whInv = await WarehouseInventory.find({ warehouseId: wh._id }).lean();
            const totalQty = whInv.reduce((sum, item) => sum + (item.quantity || 0), 0);
            grandWarehouseStock += totalQty;
            console.log(`- Warehouse: ${wh.name} (${wh._id}) | Total Stock: ${totalQty} pcs | Unique Items: ${whInv.length}`);
        }
        console.log(`Total Warehouse Stock: ${grandWarehouseStock} pcs`);

        // 3. Store-wise Live Stock
        console.log("\n=== STORE-WISE LIVE STOCK STATUS ===");
        let grandStoreStock = 0;
        for (const store of stores) {
            const storeInv = await StoreInventory.find({ storeId: store._id }).lean();
            const totalQty = storeInv.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const totalAvailable = storeInv.reduce((sum, item) => sum + (item.quantityAvailable || 0), 0);
            grandStoreStock += totalQty;
            console.log(`- Store: ${store.name} | Live Stock: ${totalQty} pcs (Available: ${totalAvailable} pcs) | Unique Items: ${storeInv.length}`);
        }
        console.log(`Total Store Stock: ${grandStoreStock} pcs`);

        // 4. Store-wise Sales Summary (All-Time)
        console.log("\n=== STORE-WISE SALES SUMMARY (ALL-TIME) ===");
        let grandTotalSalesCount = 0;
        let grandTotalSalesQty = 0;
        let grandTotalSalesAmt = 0;

        for (const store of stores) {
            const storeSales = await Sale.find({ storeId: store._id, isDeleted: false }).lean();
            const count = storeSales.length;
            const qty = storeSales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + (i.quantity || 0), 0), 0);
            const amt = storeSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);

            grandTotalSalesCount += count;
            grandTotalSalesQty += qty;
            grandTotalSalesAmt += amt;

            console.log(`- Store: ${store.name} | Total Sales: ${count} bills | Qty Sold: ${qty} pcs | Net Amount: ${amt.toFixed(2)} INR`);
        }
        console.log(`Grand Total Sales: ${grandTotalSalesCount} bills | Qty Sold: ${grandTotalSalesQty} pcs | Net Amount: ${grandTotalSalesAmt.toFixed(2)} INR`);

        // 5. Store-wise Sales Summary for June 2026
        console.log("\n=== STORE-WISE SALES SUMMARY (JUNE 2026) ===");
        const startJune = new Date('2026-06-01T00:00:00Z');
        const endJune = new Date('2026-06-30T23:59:59Z');
        
        let juneTotalSalesCount = 0;
        let juneTotalSalesQty = 0;
        let juneTotalSalesAmt = 0;

        for (const store of stores) {
            const storeSales = await Sale.find({ 
                storeId: store._id, 
                isDeleted: false,
                saleDate: { $gte: startJune, $lte: endJune }
            }).lean();
            
            const count = storeSales.length;
            const qty = storeSales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + (i.quantity || 0), 0), 0);
            const amt = storeSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);

            juneTotalSalesCount += count;
            juneTotalSalesQty += qty;
            juneTotalSalesAmt += amt;

            console.log(`- Store: ${store.name} | June Sales: ${count} bills | June Qty Sold: ${qty} pcs | June Amount: ${amt.toFixed(2)} INR`);
        }
        console.log(`June Grand Total Sales: ${juneTotalSalesCount} bills | Qty Sold: ${juneTotalSalesQty} pcs | Net Amount: ${juneTotalSalesAmt.toFixed(2)} INR`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
