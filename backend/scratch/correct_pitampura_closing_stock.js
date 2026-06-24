const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const StoreInventory = require('../src/models/storeInventory.model');
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

        // 1. Get current stock
        const currentInventory = await StoreInventory.find({ storeId }).lean();
        const currentTotalStock = currentInventory.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`Current Total Stock in Pitampura: ${currentTotalStock} (Target: 3205)`);

        const correction = 3205 - currentTotalStock;
        console.log(`Correction needed: ${correction} pcs`);

        if (correction !== 0) {
            let pendingCorr = correction;
            
            // Sort store inventory by quantity descending to distribute deductions nicely
            const sortedInv = await StoreInventory.find({ storeId, quantity: { $gt: 0 } }).sort({ quantity: -1 });

            for (const inv of sortedInv) {
                if (pendingCorr === 0) break;

                let deduct = 0;
                if (pendingCorr < 0) {
                    // We need to decrease stock
                    deduct = Math.min(inv.quantity, Math.abs(pendingCorr));
                    inv.quantity -= deduct;
                    inv.quantityAvailable -= deduct;
                    pendingCorr += deduct;
                    console.log(`Deducted ${deduct} pcs from ${inv.barcode} (New stock: ${inv.quantity})`);
                } else {
                    // We need to increase stock
                    deduct = pendingCorr;
                    inv.quantity += deduct;
                    inv.quantityAvailable += deduct;
                    pendingCorr = 0;
                    console.log(`Added ${deduct} pcs to ${inv.barcode} (New stock: ${inv.quantity})`);
                }

                await inv.save();

                // Create Stock Movement for the adjustment
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

                // Create Stock Ledger for the adjustment
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

        // Final verify
        const finalInventory = await StoreInventory.find({ storeId }).lean();
        const finalTotalStock = finalInventory.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`Final Pitampura Closing Stock: ${finalTotalStock} pcs (Target: 3205)`);

    } catch (err) {
        console.error("Correction failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
