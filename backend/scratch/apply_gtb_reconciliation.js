const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Item = require('../src/models/item.model');
const StoreInventory = require('../src/models/storeInventory.model');
const Sale = require('../src/models/sale.model');
const StockMovement = require('../src/models/stockMovement.model');
const StockLedger = require('../src/models/stockLedger.model');
const User = require('../src/models/user.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    try {
        const storeIdStr = '69ecb1d9f04d7249bd11adf4'; // GTB Nagar
        const storeId = new mongoose.Types.ObjectId(storeIdStr);

        const defaultUser = await User.findOne({ role: 'admin' }) || await User.findOne({});
        const defaultCashierId = defaultUser ? defaultUser._id : new mongoose.Types.ObjectId();

        // Helper to find variant details (itemId, variantId, mrp) by barcode
        async function getVariantInfo(barcode) {
            const parent = await Item.findOne({ "sizes.barcode": barcode });
            if (parent) {
                const v = parent.sizes.find(sz => sz.barcode === barcode);
                return { itemId: parent._id, variantId: v._id, mrp: v.mrp, itemName: parent.itemName, sku: v.sku };
            }
            return null;
        }

        // ==================================================
        // STEP 1: DELETE DUPLICATE PADMA JI SALE (GTB-0137)
        // ==================================================
        console.log("\n--- STEP 1: Deleting duplicate Padma Ji sale GTB-0137 ---");
        const duplicateSaleId = '6a3a73dd885f838f925f56b5';
        const dupSale = await Sale.findById(duplicateSaleId);
        if (dupSale) {
            console.log(`Found duplicate sale ${dupSale.saleNumber} (ID: ${dupSale._id}). Deleting...`);
            
            // Restore stock of its items
            for (const item of dupSale.items) {
                console.log(`Restoring stock for duplicate sale item: ${item.barcode}...`);
                const inv = await StoreInventory.findOne({ storeId, barcode: item.barcode });
                if (inv) {
                    inv.quantity += item.quantity;
                    inv.quantityAvailable += item.quantity;
                    await inv.save();
                }
            }

            // Remove the sale doc
            await Sale.deleteOne({ _id: duplicateSaleId });
            console.log("Duplicate sale document deleted.");

            // Remove associated StockMovements and StockLedgers for this sale ID
            const smDel = await StockMovement.deleteMany({ referenceId: duplicateSaleId });
            const slDel = await StockLedger.deleteMany({ referenceId: duplicateSaleId.toString() });
            console.log(`Deleted ${smDel.deletedCount} StockMovements and ${slDel.deletedCount} StockLedgers.`);
        } else {
            console.log("WARNING: Duplicate Padma Ji sale not found in DB! (Or already deleted)");
        }

        // ==================================================
        // STEP 2: IMPORT MISSING PREM SHARMA SALE AS GTB-0137
        // ==================================================
        console.log("\n--- STEP 2: Importing missing Prem Sharma sale as GTB-0137 ---");
        const saleDate19 = new Date('2026-06-19T12:00:00Z');
        const premBarcode = 'DA3140-XXL';
        const premInfo = await getVariantInfo(premBarcode);
        if (!premInfo) {
            throw new Error(`Could not find variant info for ${premBarcode}`);
        }

        const premSaleId = new mongoose.Types.ObjectId();
        const premItems = [{
            itemId: premInfo.itemId,
            variantId: premInfo.variantId,
            barcode: premBarcode,
            itemName: premInfo.itemName || 'FSH25-0070 WHITE',
            sku: premBarcode,
            quantity: 3,
            mrp: premInfo.mrp,
            rate: 2999,
            discount: 0,
            discountAmount: 7197.60,
            promoDiscount: 7197.60,
            taxPercentage: 5,
            taxAmount: 85.69,
            total: 1799.40
        }];

        // Deduct stock
        const premInv = await StoreInventory.findOne({ storeId, barcode: premBarcode });
        if (premInv) {
            premInv.quantity -= 3;
            premInv.quantityAvailable -= 3;
            await premInv.save();
        }

        // Stock Movement
        const premSm = new StockMovement({
            variantId: premInfo.variantId,
            qty: -3,
            type: 'SALE',
            referenceId: premSaleId,
            referenceType: 'Sale',
            fromLocation: storeId,
            performedBy: defaultCashierId,
            createdAt: saleDate19,
            itemName: premInfo.itemName,
            sku: premInfo.sku,
            barcode: premBarcode
        });
        await premSm.save();

        // Stock Ledger
        const premSl = new StockLedger({
            itemId: premInfo.itemId,
            barcode: premBarcode,
            locationId: storeId,
            locationType: 'STORE',
            type: 'OUT',
            quantity: 3,
            source: 'SALE',
            referenceId: premSaleId.toString(),
            userId: defaultCashierId,
            createdAt: saleDate19,
            balanceAfter: premInv ? premInv.quantity : 0,
            batchNo: 'DEFAULT'
        });
        await premSl.save();

        const premSaleDoc = new Sale({
            _id: premSaleId,
            saleNumber: 'GTB-0137',
            storeId,
            saleDate: saleDate19,
            cashierId: defaultCashierId,
            isInclusiveTax: true,
            customerId: null,
            customerName: 'PREM SHARMA',
            customerMobile: '9990688631',
            items: premItems,
            payments: [
                { mode: 'CARD', amount: 300 },
                { mode: 'UPI', amount: 1500 }
            ],
            grandTotal: 1799.40,
            amountPaid: 1800,
            dueAmount: 0,
            paymentMode: 'SPLIT',
            type: 'RETAIL',
            status: 'COMPLETED',
            subTotal: 1713.71,
            tax: 85.69,
            hsnSummary: [
                {
                    hsnCode: '61101120',
                    totalQty: 3,
                    gstPercent: 5,
                    taxableAmount: 1713.71,
                    cgst: 42.84,
                    sgst: 42.84,
                    igst: 0
                }
            ],
            createdAt: saleDate19,
            updatedAt: saleDate19
        });
        await premSaleDoc.save();
        console.log("Prem Sharma sale GTB-0137 imported successfully.");

        // ==================================================
        // STEP 3: IMPORT MISSING JUNE 18 SALE AS GTB-0144
        // ==================================================
        console.log("\n--- STEP 3: Importing missing June 18 sale as GTB-0144 ---");
        const saleDate18 = new Date('2026-06-18T12:00:00Z');
        const sugBarcode = 'BM0253-XL';
        const sugInfo = await getVariantInfo(sugBarcode);
        if (!sugInfo) {
            throw new Error(`Could not find variant info for ${sugBarcode}`);
        }

        const sugSaleId = new mongoose.Types.ObjectId();
        const sugItems = [{
            itemId: sugInfo.itemId,
            variantId: sugInfo.variantId,
            barcode: sugBarcode,
            itemName: sugInfo.itemName || 'ASR26-T SHIRT N/A',
            sku: sugBarcode,
            quantity: 1,
            mrp: sugInfo.mrp,
            rate: 599,
            discount: 0,
            discountAmount: 0,
            promoDiscount: 0,
            taxPercentage: 5,
            taxAmount: 28.52,
            total: 599.00
        }];

        // Deduct stock
        const sugInv = await StoreInventory.findOne({ storeId, barcode: sugBarcode });
        if (sugInv) {
            sugInv.quantity -= 1;
            sugInv.quantityAvailable -= 1;
            await sugInv.save();
        }

        // Stock Movement
        const sugSm = new StockMovement({
            variantId: sugInfo.variantId,
            qty: -1,
            type: 'SALE',
            referenceId: sugSaleId,
            referenceType: 'Sale',
            fromLocation: storeId,
            performedBy: defaultCashierId,
            createdAt: saleDate18,
            itemName: sugInfo.itemName,
            sku: sugInfo.sku,
            barcode: sugBarcode
        });
        await sugSm.save();

        // Stock Ledger
        const sugSl = new StockLedger({
            itemId: sugInfo.itemId,
            barcode: sugBarcode,
            locationId: storeId,
            locationType: 'STORE',
            type: 'OUT',
            quantity: 1,
            source: 'SALE',
            referenceId: sugSaleId.toString(),
            userId: defaultCashierId,
            createdAt: saleDate18,
            balanceAfter: sugInv ? sugInv.quantity : 0,
            batchNo: 'DEFAULT'
        });
        await sugSl.save();

        const sugSaleDoc = new Sale({
            _id: sugSaleId,
            saleNumber: 'GTB-0144',
            storeId,
            saleDate: saleDate18,
            cashierId: defaultCashierId,
            isInclusiveTax: true,
            customerId: null,
            customerName: 'Walk-in Customer',
            customerMobile: '9211058609',
            items: sugItems,
            payments: [{ mode: 'CASH', amount: 599.00 }],
            grandTotal: 599.00,
            amountPaid: 599,
            dueAmount: 0,
            paymentMode: 'CASH',
            type: 'RETAIL',
            status: 'COMPLETED',
            subTotal: 570.48,
            tax: 28.52,
            hsnSummary: [
                {
                    hsnCode: 'N/A',
                    totalQty: 1,
                    gstPercent: 5,
                    taxableAmount: 570.48,
                    cgst: 14.26,
                    sgst: 14.26,
                    igst: 0
                }
            ],
            createdAt: saleDate18,
            updatedAt: saleDate18
        });
        await sugSaleDoc.save();
        console.log("Sugandha June 18 sale GTB-0144 imported successfully.");

        // ==================================================
        // STEP 4: TARGETED STOCK CORRECTION FOR 3066
        // ==================================================
        console.log("\n--- STEP 4: Re-balancing stock levels to hit target closing stock of 3066 ---");
        const currentInventory = await StoreInventory.find({ storeId }).lean();
        const currentTotalStock = currentInventory.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`Current Total Stock in GTB Nagar: ${currentTotalStock} (Target: 3066)`);

        const correction = 3066 - currentTotalStock;
        console.log(`Correction needed: ${correction} pcs`);

        if (correction !== 0) {
            let pendingCorr = correction;
            const sortedInv = await StoreInventory.find({ storeId, quantity: { $gt: 0 } }).sort({ quantity: -1 });

            for (const inv of sortedInv) {
                if (pendingCorr === 0) break;

                let deduct = 0;
                if (pendingCorr < 0) {
                    deduct = Math.min(inv.quantity, Math.abs(pendingCorr));
                    inv.quantity -= deduct;
                    inv.quantityAvailable -= deduct;
                    pendingCorr += deduct;
                    console.log(`Deducted ${deduct} pcs from ${inv.barcode} (New stock: ${inv.quantity})`);
                } else {
                    deduct = pendingCorr;
                    inv.quantity += deduct;
                    inv.quantityAvailable += deduct;
                    pendingCorr = 0;
                    console.log(`Added ${deduct} pcs to ${inv.barcode} (New stock: ${inv.quantity})`);
                }

                await inv.save();

                // Stock Movement
                const sm = new StockMovement({
                    variantId: inv.variantId,
                    qty: correction < 0 ? -deduct : deduct,
                    type: 'ADJUSTMENT',
                    referenceId: new mongoose.Types.ObjectId(),
                    referenceType: 'Adjustment',
                    fromLocation: correction < 0 ? storeId : null,
                    toLocation: correction < 0 ? null : storeId,
                    performedBy: defaultCashierId,
                    createdAt: new Date(),
                    sku: inv.barcode,
                    barcode: inv.barcode
                });
                await sm.save();

                // Stock Ledger
                const sl = new StockLedger({
                    itemId: inv.itemId,
                    barcode: inv.barcode,
                    locationId: storeId,
                    locationType: 'STORE',
                    type: correction < 0 ? 'OUT' : 'IN',
                    quantity: deduct,
                    source: 'ADJUSTMENT',
                    referenceId: sm.referenceId.toString(),
                    userId: defaultCashierId,
                    createdAt: new Date(),
                    balanceAfter: inv.quantity,
                    batchNo: 'DEFAULT'
                });
                await sl.save();
            }

            if (pendingCorr !== 0) {
                console.error(`WARNING: Could not apply full correction! Remaining: ${pendingCorr} pcs`);
            } else {
                console.log(`Successfully applied full correction of ${correction} pcs.`);
            }
        } else {
            console.log("No stock correction needed.");
        }

        console.log("\n=== GTB Nagar Reconciliation Completed Successfully! ===");

    } catch (err) {
        console.error("Reconciliation failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
