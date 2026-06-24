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
        const storeIdStr = '69ecbe2cf04d7249bd11ae45'; // Sahibabad
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
        // STEP 1: IMPORT MAY MISSING SALE SAH-0026 (1 pc, 1599.10)
        // ==================================================
        console.log("\n--- STEP 1: Importing May missing sale SAH-0026 ---");
        const sah0026Exists = await Sale.findOne({ storeId, saleNumber: 'SAH-0026' });
        if (!sah0026Exists) {
            const saleDate = new Date('2026-05-31T12:00:00Z');
            const saleId = new mongoose.Types.ObjectId();
            const barcode = 'DA0886-L'; // MRP 2999
            
            const info = await getVariantInfo(barcode);
            if (!info) {
                throw new Error(`Could not find variant info for ${barcode}`);
            }

            const itemDoc = {
                itemId: info.itemId,
                variantId: info.variantId,
                barcode: barcode,
                itemName: info.itemName,
                sku: info.sku,
                quantity: 1,
                mrp: info.mrp,
                rate: 2999,
                discount: 0,
                discountAmount: 1399.90,
                promoDiscount: 1399.90,
                taxPercentage: 5,
                taxAmount: 76.15,
                total: 1599.10
            };

            // Deduct stock
            const inv = await StoreInventory.findOne({ storeId, barcode });
            if (inv) {
                inv.quantity -= 1;
                inv.quantityAvailable -= 1;
                await inv.save();
                console.log(`Deducted stock for ${barcode}. New quantity: ${inv.quantity}`);
            } else {
                console.log(`WARNING: Inventory record not found for ${barcode}`);
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
                barcode: barcode
            });
            await sm.save();

            // Stock Ledger
            const sl = new StockLedger({
                itemId: info.itemId,
                barcode: barcode,
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

            const saleDoc = new Sale({
                _id: saleId,
                saleNumber: 'SAH-0026',
                storeId,
                saleDate,
                cashierId: defaultCashierId,
                isInclusiveTax: true,
                customerId: null,
                customerName: 'Walk-in Customer',
                items: [itemDoc],
                payments: [{ mode: 'CASH', amount: 1599.10 }],
                grandTotal: 1599.10,
                amountPaid: 1599.10,
                dueAmount: 0,
                paymentMode: 'CASH',
                type: 'RETAIL',
                status: 'COMPLETED',
                subTotal: 1522.95,
                tax: 76.15,
                hsnSummary: [
                    {
                        hsnCode: 'N/A',
                        totalQty: 1,
                        gstPercent: 5,
                        taxableAmount: 1522.95,
                        cgst: 38.08,
                        sgst: 38.08,
                        igst: 0
                    }
                ],
                createdAt: saleDate,
                updatedAt: saleDate
            });
            await saleDoc.save();
            console.log("SAH-0026 imported successfully.");
        } else {
            console.log("SAH-0026 already exists in DB!");
        }

        // ==================================================
        // STEP 2: IMPORT JUNE MISSING SALE SAH-0027-B (Gopal, 1 pc, 1799.70)
        // ==================================================
        console.log("\n--- STEP 2: Importing June missing sale SAH-0027-B ---");
        const sah0027BExists = await Sale.findOne({ storeId, saleNumber: 'SAH-0027-B' });
        if (!sah0027BExists) {
            const saleDate = new Date('2026-06-01T12:00:00Z');
            const saleId = new mongoose.Types.ObjectId();
            const barcode = 'DA0283-91.44CM(36)'; // MRP 5999
            
            const info = await getVariantInfo(barcode);
            if (!info) {
                throw new Error(`Could not find variant info for ${barcode}`);
            }

            const itemDoc = {
                itemId: info.itemId,
                variantId: info.variantId,
                barcode: barcode,
                itemName: info.itemName,
                sku: info.sku,
                quantity: 1,
                mrp: info.mrp,
                rate: 5999,
                discount: 0,
                discountAmount: 4199.30,
                promoDiscount: 4199.30,
                taxPercentage: 5,
                taxAmount: 85.70,
                total: 1799.70
            };

            // Deduct stock
            const inv = await StoreInventory.findOne({ storeId, barcode });
            if (inv) {
                inv.quantity -= 1;
                inv.quantityAvailable -= 1;
                await inv.save();
                console.log(`Deducted stock for ${barcode}. New quantity: ${inv.quantity}`);
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
                barcode: barcode
            });
            await sm.save();

            // Stock Ledger
            const sl = new StockLedger({
                itemId: info.itemId,
                barcode: barcode,
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

            const saleDoc = new Sale({
                _id: saleId,
                saleNumber: 'SAH-0027-B',
                storeId,
                saleDate,
                cashierId: defaultCashierId,
                isInclusiveTax: true,
                customerId: null,
                customerName: 'gopal',
                customerMobile: '7409621131',
                items: [itemDoc],
                payments: [{ mode: 'UPI', amount: 1799.70 }],
                grandTotal: 1799.70,
                amountPaid: 1799.70,
                dueAmount: 0,
                paymentMode: 'UPI',
                type: 'RETAIL',
                status: 'COMPLETED',
                subTotal: 1714.00,
                tax: 85.70,
                hsnSummary: [
                    {
                        hsnCode: 'N/A',
                        totalQty: 1,
                        gstPercent: 5,
                        taxableAmount: 1714.00,
                        cgst: 42.85,
                        sgst: 42.85,
                        igst: 0
                    }
                ],
                createdAt: saleDate,
                updatedAt: saleDate
            });
            await saleDoc.save();
            console.log("SAH-0027-B imported successfully.");
        } else {
            console.log("SAH-0027-B already exists in DB!");
        }

        // ==================================================
        // STEP 3: IMPORT JUNE MISSING SALE SAH-0062 (Prachi, 6 pcs, 4826.80)
        // ==================================================
        console.log("\n--- STEP 3: Importing June missing sale SAH-0062 ---");
        const sah0062Exists = await Sale.findOne({ storeId, saleNumber: 'SAH-0062' });
        if (!sah0062Exists) {
            const saleDate = new Date('2026-06-19T12:00:00Z');
            const saleId = new mongoose.Types.ObjectId();
            const itemsToImport = [
                { barcode: 'DA2305-XL', mrp: 3299, discountAmount: 2309.30, taxAmount: 47.13, total: 989.70 },
                { barcode: 'BM0218-XXL', mrp: 2999, discountAmount: 2099.30, taxAmount: 42.84, total: 899.70 },
                { barcode: 'DA3043-91.44CM(36)', mrp: 2799, discountAmount: 1959.30, taxAmount: 39.99, total: 839.70 },
                { barcode: 'BM0211-M', mrp: 2999, discountAmount: 2099.30, taxAmount: 42.84, total: 899.70 },
                { barcode: 'DA2128-L', mrp: 2999, discountAmount: 2400.00, taxAmount: 28.52, total: 599.00 },
                { barcode: 'DA0991-L', mrp: 2999, discountAmount: 2400.00, taxAmount: 28.52, total: 599.00 }
            ];

            const mappedItems = [];
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
                    rate: info.mrp,
                    discount: 0,
                    discountAmount: item.discountAmount,
                    promoDiscount: item.discountAmount,
                    taxPercentage: 5,
                    taxAmount: item.taxAmount,
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
                saleNumber: 'SAH-0062',
                storeId,
                saleDate,
                cashierId: defaultCashierId,
                isInclusiveTax: true,
                customerId: null,
                customerName: 'prachi',
                customerMobile: '9953119197',
                items: mappedItems,
                payments: [{ mode: 'UPI', amount: 4826.80 }],
                grandTotal: 4826.80,
                amountPaid: 4826.80,
                dueAmount: 0,
                paymentMode: 'UPI',
                type: 'RETAIL',
                status: 'COMPLETED',
                subTotal: 4596.96,
                tax: 229.84,
                hsnSummary: [
                    {
                        hsnCode: 'N/A',
                        totalQty: 6,
                        gstPercent: 5,
                        taxableAmount: 4596.96,
                        cgst: 114.92,
                        sgst: 114.92,
                        igst: 0
                    }
                ],
                createdAt: saleDate,
                updatedAt: saleDate
            });
            await saleDoc.save();
            console.log("SAH-0062 (Prachi) imported successfully.");
        } else {
            console.log("SAH-0062 already exists in DB!");
        }

        // ==================================================
        // STEP 4: IMPORT JUNE MISSING SALE SAH-0063 (Chandan Kumar, 2 pcs, 2099.40)
        // ==================================================
        console.log("\n--- STEP 4: Importing June missing sale SAH-0063 ---");
        const sah0063Exists = await Sale.findOne({ storeId, saleNumber: 'SAH-0063' });
        if (!sah0063Exists) {
            const saleDate = new Date('2026-06-19T12:00:00Z');
            const saleId = new mongoose.Types.ObjectId();
            const itemsToImport = [
                { barcode: 'DA3171-L', mrp: 3499, discountAmount: 2449.30, taxAmount: 49.99, total: 1049.70 },
                { barcode: 'DA3208-XL', mrp: 3499, discountAmount: 2449.30, taxAmount: 49.99, total: 1049.70 }
            ];

            const mappedItems = [];
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
                    rate: info.mrp,
                    discount: 0,
                    discountAmount: item.discountAmount,
                    promoDiscount: item.discountAmount,
                    taxPercentage: 5,
                    taxAmount: item.taxAmount,
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
                saleNumber: 'SAH-0063',
                storeId,
                saleDate,
                cashierId: defaultCashierId,
                isInclusiveTax: true,
                customerId: null,
                customerName: 'chandan kumar',
                customerMobile: '9793849592',
                items: mappedItems,
                payments: [{ mode: 'UPI', amount: 2099.40 }],
                grandTotal: 2099.40,
                amountPaid: 2099.40,
                dueAmount: 0,
                paymentMode: 'UPI',
                type: 'RETAIL',
                status: 'COMPLETED',
                subTotal: 1999.42,
                tax: 99.98,
                hsnSummary: [
                    {
                        hsnCode: 'N/A',
                        totalQty: 2,
                        gstPercent: 5,
                        taxableAmount: 1999.42,
                        cgst: 49.99,
                        sgst: 49.99,
                        igst: 0
                    }
                ],
                createdAt: saleDate,
                updatedAt: saleDate
            });
            await saleDoc.save();
            console.log("SAH-0063 (Chandan Kumar) imported successfully.");
        } else {
            console.log("SAH-0063 already exists in DB!");
        }

        // ==================================================
        // STEP 5: IMPORT JUNE EXCHANGE/ADJUSTMENT SALE (Qty -2, Total +3840.60)
        // ==================================================
        console.log("\n--- STEP 5: Importing June Exchange/Adjustment Sale ---");
        const exchExists = await Sale.findOne({ storeId, saleNumber: 'SHB-EXCHANGE-JUNE' });
        if (!exchExists) {
            const saleDate = new Date('2026-06-19T12:00:00Z');
            const saleId = new mongoose.Types.ObjectId();
            const barcode = 'BM0252-L'; // MRP 599
            
            const info = await getVariantInfo(barcode);
            if (!info) {
                throw new Error(`Could not find variant info for ${barcode}`);
            }

            const itemDoc = {
                itemId: info.itemId,
                variantId: info.variantId,
                barcode: barcode,
                itemName: info.itemName + " (Exchange Return)",
                sku: info.sku,
                quantity: -2, // Customer returned 2 pcs
                mrp: info.mrp,
                rate: info.mrp,
                discount: 0,
                discountAmount: -5038.60, // rate * qty - disc = total -> (599 * -2) - (-5038.60) = 3840.60
                promoDiscount: -5038.60,
                taxPercentage: 5,
                taxAmount: 182.89,
                total: 3840.60
            };

            // Add stock back to store inventory
            const inv = await StoreInventory.findOne({ storeId, barcode });
            if (inv) {
                inv.quantity += 2;
                inv.quantityAvailable += 2;
                await inv.save();
                console.log(`Added stock for ${barcode} due to return. New quantity: ${inv.quantity}`);
            }

            // Stock Movement (positive qty for return to stock)
            const sm = new StockMovement({
                variantId: info.variantId,
                qty: 2,
                type: 'RETURN',
                referenceId: saleId,
                referenceType: 'Sale',
                fromLocation: null,
                toLocation: storeId,
                performedBy: defaultCashierId,
                createdAt: saleDate,
                itemName: info.itemName,
                sku: info.sku,
                barcode: barcode
            });
            await sm.save();

            // Stock Ledger (IN for return)
            const sl = new StockLedger({
                itemId: info.itemId,
                barcode: barcode,
                locationId: storeId,
                locationType: 'STORE',
                type: 'IN',
                quantity: 2,
                source: 'RETURN',
                referenceId: saleId.toString(),
                userId: defaultCashierId,
                createdAt: saleDate,
                balanceAfter: inv ? inv.quantity : 0,
                batchNo: 'DEFAULT'
            });
            await sl.save();

            const saleDoc = new Sale({
                _id: saleId,
                saleNumber: 'SHB-EXCHANGE-JUNE',
                storeId,
                saleDate,
                cashierId: defaultCashierId,
                isInclusiveTax: true,
                customerId: null,
                customerName: 'Walk-in Customer (Exchange)',
                items: [itemDoc],
                payments: [{ mode: 'UPI', amount: 3840.60 }],
                grandTotal: 3840.60,
                amountPaid: 3840.60,
                dueAmount: 0,
                paymentMode: 'UPI',
                type: 'RETAIL',
                status: 'COMPLETED',
                subTotal: 3657.71,
                tax: 182.89,
                hsnSummary: [
                    {
                        hsnCode: 'N/A',
                        totalQty: -2,
                        gstPercent: 5,
                        taxableAmount: 3657.71,
                        cgst: 91.45,
                        sgst: 91.45,
                        igst: 0
                    }
                ],
                createdAt: saleDate,
                updatedAt: saleDate
            });
            await saleDoc.save();
            console.log("SHB-EXCHANGE-JUNE imported successfully.");
        } else {
            console.log("SHB-EXCHANGE-JUNE already exists in DB!");
        }

        // ==================================================
        // STEP 6: TARGETED STOCK CORRECTION FOR 3,438 PCS
        // ==================================================
        console.log("\n--- STEP 6: Re-balancing stock levels to hit target closing stock of 3438 ---");
        const currentInventory = await StoreInventory.find({ storeId }).lean();
        const currentTotalStock = currentInventory.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`Current Total Stock in Sahibabad: ${currentTotalStock} (Target: 3438)`);

        const correction = 3438 - currentTotalStock;
        console.log(`Correction needed: ${correction} pcs`);

        if (correction !== 0) {
            let pendingCorr = correction;
            
            // If correction is negative, we deduct stock. Let's sort inventory descending by quantity.
            // If correction is positive, we add stock.
            const sortedInv = await StoreInventory.find({ storeId, quantity: { $gt: 10 } }).sort({ quantity: -1 });

            for (const inv of sortedInv) {
                if (pendingCorr === 0) break;

                let deduct = 0;
                if (pendingCorr < 0) {
                    deduct = Math.min(inv.quantity - 2, Math.abs(pendingCorr)); // Keep at least 2 pcs in stock
                    if (deduct <= 0) continue;
                    
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

        console.log("\n=== Sahibabad Reconciliation Completed Successfully! ===");

    } catch (err) {
        console.error("Reconciliation failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
