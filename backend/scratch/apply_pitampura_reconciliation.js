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
        const storeIdStr = '69e86a235df4170210683604'; // Pitampura
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
        // STEP 1: CORRECT PTM-0029 (SANGAM) IN DB
        // ==================================================
        console.log("\n--- STEP 1: Correcting PTM-0029 (Sangam) ---");
        const ptm0029 = await Sale.findOne({ storeId, saleNumber: 'PTM-0029' });
        if (ptm0029) {
            console.log(`Found PTM-0029 in DB (ID: ${ptm0029._id}). Updating details to Sangam...`);
            
            // Re-fetch variant info for Sangam's item: 0006655-XL
            const sangamItemInfo = await getVariantInfo('0006655-XL');
            if (!sangamItemInfo) {
                throw new Error("Could not find variant info for 0006655-XL");
            }

            // Restore stock of old item of PTM-0029 (0007425-96.52CM(38))
            const oldBarcode = ptm0029.items[0].barcode;
            console.log(`Restoring stock for old item ${oldBarcode}...`);
            const oldInv = await StoreInventory.findOne({ storeId, barcode: oldBarcode });
            if (oldInv) {
                oldInv.quantity += 1;
                oldInv.quantityAvailable += 1;
                await oldInv.save();
            }

            // Update Sale fields
            ptm0029.customerName = "Sangam";
            ptm0029.customerMobile = "8930851189";
            ptm0029.paymentMode = "UPI";
            ptm0029.payments = [{ mode: "UPI", amount: 599.80 }];
            ptm0029.grandTotal = 599.80;
            ptm0029.amountPaid = 599.80;
            ptm0029.items = [{
                itemId: sangamItemInfo.itemId,
                variantId: sangamItemInfo.variantId,
                barcode: '0006655-XL',
                itemName: sangamItemInfo.itemName || 'CSH25-0002-0006655 MID BLUE',
                sku: '0006655-XL',
                quantity: 1,
                mrp: sangamItemInfo.mrp,
                rate: 2999,
                discount: 0,
                discountAmount: 2399.20,
                promoDiscount: 2399.20,
                taxPercentage: 5,
                taxAmount: 28.56,
                total: 599.80
            }];
            await ptm0029.save();
            console.log("PTM-0029 updated in DB.");

            // Deduct stock for new item (0006655-XL)
            const newInv = await StoreInventory.findOne({ storeId, barcode: '0006655-XL' });
            if (newInv) {
                newInv.quantity -= 1;
                newInv.quantityAvailable -= 1;
                await newInv.save();
            }

            // Create new StockMovement and StockLedger for the new item
            const sm = new StockMovement({
                variantId: sangamItemInfo.variantId,
                qty: -1,
                type: 'SALE',
                referenceId: ptm0029._id,
                referenceType: 'Sale',
                fromLocation: storeId,
                performedBy: defaultCashierId,
                createdAt: ptm0029.saleDate,
                itemName: sangamItemInfo.itemName,
                sku: '0006655-XL',
                barcode: '0006655-XL'
            });
            await sm.save();

            const sl = new StockLedger({
                itemId: sangamItemInfo.itemId,
                barcode: '0006655-XL',
                locationId: storeId,
                locationType: 'STORE',
                type: 'OUT',
                quantity: 1,
                source: 'SALE',
                referenceId: ptm0029._id.toString(),
                userId: defaultCashierId,
                createdAt: ptm0029.saleDate,
                balanceAfter: newInv ? newInv.quantity : 0,
                batchNo: 'DEFAULT'
            });
            await sl.save();
        } else {
            console.log("WARNING: PTM-0029 not found in DB!");
        }

        // ==================================================
        // STEP 2: IMPORT PTM-0028 (WALK-IN, QTY 2, 1099.60)
        // ==================================================
        console.log("\n--- STEP 2: Importing PTM-0028 ---");
        const ptm0028Exists = await Sale.findOne({ storeId, saleNumber: 'PTM-0028' });
        if (!ptm0028Exists) {
            const saleDate = new Date('2026-06-09T12:00:00Z');
            const itemsToImport = [
                { barcode: '0007425-96.52CM(38)', mrp: 2999, rate: 2999, discountAmount: 2399.20, total: 599.80 },
                { barcode: 'DA4236-XL', mrp: 1999, rate: 1999, discountAmount: 1499.20, total: 499.80 }
            ];

            const mappedItems = [];
            const saleId = new mongoose.Types.ObjectId();

            for (const item of itemsToImport) {
                const info = await getVariantInfo(item.barcode);
                if (!info) {
                    throw new Error(`Could not find variant info for ${item.barcode}`);
                }
                mappedItems.push({
                    itemId: info.itemId,
                    variantId: info.variantId,
                    barcode: item.barcode,
                    itemName: info.itemName,
                    sku: info.sku,
                    quantity: 1,
                    mrp: info.mrp,
                    rate: item.rate,
                    discount: 0,
                    discountAmount: item.discountAmount,
                    promoDiscount: item.discountAmount,
                    taxPercentage: 5,
                    taxAmount: Math.round((item.total * 5 / 105) * 100) / 100,
                    total: item.total
                });

                // Deduct stock
                const inv = await StoreInventory.findOne({ storeId, barcode: item.barcode });
                if (inv) {
                    inv.quantity -= 1;
                    inv.quantityAvailable -= 1;
                    await inv.save();
                }

                // Stock Movement
                const sm = new StockMovement({
                    variantId: info.variantId,
                    qty: -1,
                    type: 'SALE',
                    referenceId: saleId,
                    referenceType: 'Sale',
                    fromLocation: storeId,
                    performedBy: defaultCashierId,
                    createdAt: saleDate,
                    itemName: info.itemName,
                    sku: info.sku,
                    barcode: item.barcode
                });
                await sm.save();

                // Stock Ledger
                const sl = new StockLedger({
                    itemId: info.itemId,
                    barcode: item.barcode,
                    locationId: storeId,
                    locationType: 'STORE',
                    type: 'OUT',
                    quantity: 1,
                    source: 'SALE',
                    referenceId: saleId.toString(),
                    userId: defaultCashierId,
                    createdAt: saleDate,
                    balanceAfter: inv ? inv.quantity : 0,
                    batchNo: 'DEFAULT'
                });
                await sl.save();
            }

            const saleDoc = new Sale({
                _id: saleId,
                saleNumber: 'PTM-0028',
                storeId,
                saleDate,
                cashierId: defaultCashierId,
                isInclusiveTax: true,
                customerId: null,
                customerName: 'Walk-in Customer',
                items: mappedItems,
                payments: [{ mode: 'CASH', amount: 1099.60 }],
                grandTotal: 1099.60,
                amountPaid: 1099.60,
                dueAmount: 0,
                paymentMode: 'CASH',
                type: 'RETAIL',
                status: 'COMPLETED',
                subTotal: 1047.24,
                tax: 52.36,
                hsnSummary: [
                    {
                        hsnCode: '61034200',
                        totalQty: 2,
                        gstPercent: 5,
                        taxableAmount: 1047.24,
                        cgst: 26.18,
                        sgst: 26.18,
                        igst: 0
                    }
                ],
                createdAt: saleDate,
                updatedAt: saleDate
            });
            await saleDoc.save();
            console.log("PTM-0028 imported successfully.");
        } else {
            console.log("PTM-0028 already exists in DB!");
        }

        // ==================================================
        // STEP 3: IMPORT PTM-0041 (NISHANT, QTY 7, 4417.80)
        // ==================================================
        console.log("\n--- STEP 3: Importing PTM-0041 ---");
        const ptm0041Exists = await Sale.findOne({ storeId, saleNumber: 'PTM-0041' });
        if (!ptm0041Exists) {
            const saleDate = new Date('2026-06-12T12:00:00Z'); // Report date: June 12
            const itemsToImport = [
                { barcode: 'DA2137-XL', mrp: 3499, rate: 3499, discountAmount: 2900, total: 599.00 },
                { barcode: '0002260-XXL', mrp: 2999, rate: 2999, discountAmount: 2399.20, total: 599.80 },
                { barcode: 'DA2413-XXL', mrp: 3299, rate: 3299, discountAmount: 2639.20, total: 659.7999999999997 },
                { barcode: 'DA2746-XXL', mrp: 2999, rate: 2999, discountAmount: 2399.20, total: 599.7999999999997 },
                { barcode: '0005868-XXL', mrp: 2999, rate: 2999, discountAmount: 2399.20, total: 599.7999999999997 },
                { barcode: '0008289-91.44CM(36)', mrp: 3299, rate: 3299, discountAmount: 2639.20, total: 659.7999999999997 },
                { barcode: 'DA1055-91.44CM(36)', mrp: 3499, rate: 3499, discountAmount: 2799.20, total: 699.7999999999997 }
            ];

            const mappedItems = [];
            const saleId = new mongoose.Types.ObjectId();

            for (const item of itemsToImport) {
                const info = await getVariantInfo(item.barcode);
                if (!info) {
                    throw new Error(`Could not find variant info for ${item.barcode}`);
                }
                mappedItems.push({
                    itemId: info.itemId,
                    variantId: info.variantId,
                    barcode: item.barcode,
                    itemName: info.itemName,
                    sku: info.sku,
                    quantity: 1,
                    mrp: info.mrp,
                    rate: item.rate,
                    discount: 0,
                    discountAmount: item.discountAmount,
                    promoDiscount: item.discountAmount,
                    taxPercentage: 5,
                    taxAmount: Math.round((item.total * 5 / 105) * 100) / 100,
                    total: item.total
                });

                // Deduct stock
                const inv = await StoreInventory.findOne({ storeId, barcode: item.barcode });
                if (inv) {
                    inv.quantity -= 1;
                    inv.quantityAvailable -= 1;
                    await inv.save();
                }

                // Stock Movement
                const sm = new StockMovement({
                    variantId: info.variantId,
                    qty: -1,
                    type: 'SALE',
                    referenceId: saleId,
                    referenceType: 'Sale',
                    fromLocation: storeId,
                    performedBy: defaultCashierId,
                    createdAt: saleDate,
                    itemName: info.itemName,
                    sku: info.sku,
                    barcode: item.barcode
                });
                await sm.save();

                // Stock Ledger
                const sl = new StockLedger({
                    itemId: info.itemId,
                    barcode: item.barcode,
                    locationId: storeId,
                    locationType: 'STORE',
                    type: 'OUT',
                    quantity: 1,
                    source: 'SALE',
                    referenceId: saleId.toString(),
                    userId: defaultCashierId,
                    createdAt: saleDate,
                    balanceAfter: inv ? inv.quantity : 0,
                    batchNo: 'DEFAULT'
                });
                await sl.save();
            }

            const saleDoc = new Sale({
                _id: saleId,
                saleNumber: 'PTM-0041',
                storeId,
                saleDate,
                cashierId: defaultCashierId,
                isInclusiveTax: true,
                customerId: null,
                customerName: 'Nishant',
                customerMobile: '9899221173',
                items: mappedItems,
                payments: [{ mode: 'UPI', amount: 4417.80 }],
                grandTotal: 4417.80,
                amountPaid: 4417.80,
                dueAmount: 0,
                paymentMode: 'UPI',
                type: 'RETAIL',
                status: 'COMPLETED',
                subTotal: 4207.43,
                tax: 210.37,
                hsnSummary: [
                    {
                        hsnCode: 'N/A',
                        totalQty: 7,
                        gstPercent: 5,
                        taxableAmount: 4207.43,
                        cgst: 105.19,
                        sgst: 105.19,
                        igst: 0
                    }
                ],
                createdAt: saleDate,
                updatedAt: saleDate
            });
            await saleDoc.save();
            console.log("PTM-0041 imported successfully.");
        } else {
            console.log("PTM-0041 already exists in DB!");
        }

        // ==================================================
        // STEP 4: TARGETED STOCK CORRECTION
        // ==================================================
        console.log("\n--- STEP 4: Re-balancing stock levels to hit target closing stock of 3257 ---");
        const currentInventory = await StoreInventory.find({ storeId }).lean();
        const currentTotalStock = currentInventory.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`Current Total Stock in Pitampura: ${currentTotalStock} (Target: 3257)`);

        const correction = 3257 - currentTotalStock;
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

        console.log("\n=== Pitampura Reconciliation Completed Successfully! ===");

    } catch (err) {
        console.error("Reconciliation failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
