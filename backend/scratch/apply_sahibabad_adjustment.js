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

        // Helper to find variant details by barcode
        async function getVariantInfo(barcode) {
            const parent = await Item.findOne({ "sizes.barcode": barcode });
            if (parent) {
                const v = parent.sizes.find(sz => sz.barcode === barcode);
                return { itemId: parent._id, variantId: v._id, mrp: v.mrp, itemName: parent.itemName, sku: v.sku };
            }
            return null;
        }

        // ==================================================
        // STEP 1: MODIFY SAH-0036 TO APPLY EXCHANGE ADJUSTMENT (CONDITIONAL)
        // ==================================================
        console.log("\n--- STEP 1: Modifying SAH-0036 (Failsafe) ---");
        const sah0036 = await Sale.findOne({ storeId, saleNumber: 'SAH-0036' });
        if (sah0036) {
            if (sah0036.items.length > 4) {
                console.log(`Found SAH-0036 in DB with ${sah0036.items.length} items. Modifying...`);

                // Items to remove: DA1669-XXL and DA1685-XXL
                const barcodesToRemove = ['DA1669-XXL', 'DA1685-XXL'];
                for (const bc of barcodesToRemove) {
                    const inv = await StoreInventory.findOne({ storeId, barcode: bc });
                    if (inv) {
                        inv.quantity += 1;
                        inv.quantityAvailable += 1;
                        await inv.save();
                        console.log(`Restored stock for removed item ${bc}. New stock: ${inv.quantity}`);
                    }

                    // Create StockMovement for return/restoration
                    const sm = new StockMovement({
                        variantId: (await getVariantInfo(bc)).variantId,
                        qty: 1,
                        type: 'RETURN',
                        referenceId: sah0036._id,
                        referenceType: 'Sale',
                        fromLocation: null,
                        toLocation: storeId,
                        performedBy: defaultCashierId,
                        createdAt: new Date(),
                        sku: bc,
                        barcode: bc
                    });
                    await sm.save();

                    // Create StockLedger for return/restoration
                    const sl = new StockLedger({
                        itemId: (await getVariantInfo(bc)).itemId,
                        barcode: bc,
                        locationId: storeId,
                        locationType: 'STORE',
                        type: 'IN',
                        quantity: 1,
                        source: 'RETURN',
                        referenceId: sah0036._id.toString(),
                        userId: defaultCashierId,
                        createdAt: new Date(),
                        balanceAfter: inv ? inv.quantity : 0,
                        batchNo: 'DEFAULT'
                    });
                    await sl.save();
                }

                // Update SAH-0036 document
                const item1 = await getVariantInfo('DA3044-96.52CM(38)');
                const item2 = await getVariantInfo('BM0064-XXL');
                const item3 = await getVariantInfo('DA1637-XXL');
                const item4 = await getVariantInfo('DA0345-101.6CM(40)');

                sah0036.items = [
                    {
                        itemId: item1.itemId,
                        variantId: item1.variantId,
                        barcode: 'DA3044-96.52CM(38)',
                        itemName: item1.itemName,
                        sku: item1.sku,
                        quantity: 1,
                        mrp: item1.mrp,
                        rate: item1.mrp,
                        discount: 0,
                        discountAmount: 1959.30,
                        promoDiscount: 1959.30,
                        taxPercentage: 5,
                        taxAmount: 39.99,
                        total: 839.70
                    },
                    {
                        itemId: item2.itemId,
                        variantId: item2.variantId,
                        barcode: 'BM0064-XXL',
                        itemName: item2.itemName,
                        sku: item2.sku,
                        quantity: 1,
                        mrp: item2.mrp,
                        rate: item2.mrp,
                        discount: 0,
                        discountAmount: 2099.00,
                        promoDiscount: 2099.00,
                        taxPercentage: 5,
                        taxAmount: 42.81,
                        total: 899.00
                    },
                    {
                        itemId: item3.itemId,
                        variantId: item3.variantId,
                        barcode: 'DA1637-XXL',
                        itemName: item3.itemName,
                        sku: item3.sku,
                        quantity: 1,
                        mrp: item3.mrp,
                        rate: item3.mrp,
                        discount: 0,
                        discountAmount: 1600.00,
                        promoDiscount: 1600.00,
                        taxPercentage: 5,
                        taxAmount: 19.00,
                        total: 399.00
                    },
                    {
                        itemId: item4.itemId,
                        variantId: item4.variantId,
                        barcode: 'DA0345-101.6CM(40)',
                        itemName: item4.itemName,
                        sku: item4.sku,
                        quantity: 1,
                        mrp: item4.mrp,
                        rate: item4.mrp,
                        discount: 0,
                        discountAmount: -1339.60,
                        promoDiscount: -1339.60,
                        taxPercentage: 5,
                        taxAmount: 206.60,
                        total: 4338.60
                    }
                ];

                sah0036.grandTotal = 6476.30;
                sah0036.amountPaid = 6476.30;
                sah0036.payments = [{ mode: 'UPI', amount: 6476.30 }];
                sah0036.subTotal = 6167.90;
                sah0036.tax = 308.40;
                sah0036.hsnSummary = [
                    {
                        hsnCode: 'N/A',
                        totalQty: 4,
                        gstPercent: 5,
                        taxableAmount: 6167.90,
                        cgst: 154.20,
                        sgst: 154.20,
                        igst: 0
                    }
                ];

                await sah0036.save();
                console.log(`SAH-0036 updated successfully! New Qty: 4, New Total: ${sah0036.grandTotal}`);
            } else {
                console.log(`SAH-0036 is already modified (items count: ${sah0036.items.length}). Skipping modification.`);
            }
        } else {
            console.log("WARNING: SAH-0036 not found in DB!");
        }

        // ==================================================
        // STEP 2: TARGETED STOCK CORRECTION FOR 3,438 PCS
        // ==================================================
        console.log("\n--- STEP 2: Re-balancing stock levels to hit target closing stock of 3438 ---");
        const currentInventory = await StoreInventory.find({ storeId }).lean();
        const currentTotalStock = currentInventory.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`Current Total Stock in Sahibabad: ${currentTotalStock} (Target: 3438)`);

        const correction = 3438 - currentTotalStock;
        console.log(`Correction needed: ${correction} pcs`);

        if (correction !== 0) {
            let pendingCorr = correction;
            
            // Query with quantity > 2 to have a larger pool of items for deduction
            const sortedInv = await StoreInventory.find({ storeId, quantity: { $gt: 2 } }).sort({ quantity: -1 });

            for (const inv of sortedInv) {
                if (pendingCorr === 0) break;

                let deduct = 0;
                if (pendingCorr < 0) {
                    deduct = Math.min(inv.quantity - 1, Math.abs(pendingCorr)); // Keep at least 1 pc in stock
                    if (deduct <= 0) continue;
                    
                    const liveInv = await StoreInventory.findById(inv._id);
                    liveInv.quantity -= deduct;
                    liveInv.quantityAvailable -= deduct;
                    await liveInv.save();
                    pendingCorr += deduct;
                    console.log(`Deducted ${deduct} pcs from ${inv.barcode} (New stock: ${liveInv.quantity})`);
                    
                    // Stock Movement
                    const sm = new StockMovement({
                        variantId: inv.variantId,
                        qty: -deduct,
                        type: 'ADJUSTMENT',
                        referenceId: new mongoose.Types.ObjectId(),
                        referenceType: 'Adjustment',
                        fromLocation: storeId,
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
                        type: 'OUT',
                        quantity: deduct,
                        source: 'ADJUSTMENT',
                        referenceId: sm.referenceId.toString(),
                        userId: defaultCashierId,
                        createdAt: new Date(),
                        balanceAfter: liveInv.quantity,
                        batchNo: 'DEFAULT'
                    });
                    await sl.save();
                } else {
                    deduct = pendingCorr;
                    const liveInv = await StoreInventory.findById(inv._id);
                    liveInv.quantity += deduct;
                    liveInv.quantityAvailable += deduct;
                    await liveInv.save();
                    pendingCorr = 0;
                    console.log(`Added ${deduct} pcs to ${inv.barcode} (New stock: ${liveInv.quantity})`);
                    
                    // Stock Movement
                    const sm = new StockMovement({
                        variantId: inv.variantId,
                        qty: deduct,
                        type: 'ADJUSTMENT',
                        referenceId: new mongoose.Types.ObjectId(),
                        referenceType: 'Adjustment',
                        toLocation: storeId,
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
                        type: 'IN',
                        quantity: deduct,
                        source: 'ADJUSTMENT',
                        referenceId: sm.referenceId.toString(),
                        userId: defaultCashierId,
                        createdAt: new Date(),
                        balanceAfter: liveInv.quantity,
                        batchNo: 'DEFAULT'
                    });
                    await sl.save();
                }
            }

            if (pendingCorr !== 0) {
                console.error(`WARNING: Could not apply full correction! Remaining: ${pendingCorr} pcs`);
            } else {
                console.log(`Successfully applied full correction of ${correction} pcs.`);
            }
        } else {
            console.log("No stock correction needed.");
        }

        console.log("\n=== Sahibabad Reconciliation and Adjustment Completed Successfully! ===");

    } catch (err) {
        console.error("Adjustment failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
