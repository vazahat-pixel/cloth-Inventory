const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));

const Product = require('../backend/src/models/product.model');
const StoreInventory = require('../backend/src/models/storeInventory.model');
const Sale = require('../backend/src/models/sale.model');
const Dispatch = require('../backend/src/models/dispatch.model');
const Ledger = require('../backend/src/models/ledger.model');
const Customer = require('../backend/src/models/customer.model');
const CreditNote = require('../backend/src/models/creditNote.model');
const StockHistory = require('../backend/src/models/stockHistory.model');

async function audit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const results = {};

        // 1. Check if any Product.factoryStock < 0
        const negativeFactoryStock = await Product.countDocuments({ factoryStock: { $lt: 0 } });
        results.factoryStockNonNegative = negativeFactoryStock === 0 ? "PASS" : "FAIL";

        // 2. Check if any StoreInventory.quantityAvailable < 0
        const negativeStoreStock = await StoreInventory.countDocuments({ quantityAvailable: { $lt: 0 } });
        results.storeInventoryNonNegative = negativeStoreStock === 0 ? "PASS" : "FAIL";

        // 3. Check if any duplicate saleNumber exists
        const duplicateSales = await Sale.aggregate([
            { $group: { _id: "$saleNumber", count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);
        results.noDuplicateSaleNumber = duplicateSales.length === 0 ? "PASS" : "FAIL";

        // 4. Check if any duplicate dispatchNumber exists
        const duplicateDispatches = await Dispatch.aggregate([
            { $group: { _id: "$dispatchNumber", count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);
        results.noDuplicateDispatchNumber = duplicateDispatches.length === 0 ? "PASS" : "FAIL";

        // 5. Check if total ledger debit === total ledger credit
        const ledgerTotals = await Ledger.aggregate([
            { $group: { _id: null, totalDebit: { $sum: "$debit" }, totalCredit: { $sum: "$credit" } } }
        ]);
        if (ledgerTotals.length === 0) {
            results.ledgerBalanced = "PASS (No entries)";
        } else {
            const diff = Math.abs(ledgerTotals[0].totalDebit - ledgerTotals[0].totalCredit);
            results.ledgerBalanced = diff < 0.01 ? "PASS" : "FAIL";
        }

        // 6. Check if any dispatch is RECEIVED but storeInventory not updated
        // Simplified: Check if number of RECEIVED dispatches matches number of 'IN' StockHistory records with 'Dispatch' model
        const receivedDispatches = await Dispatch.find({ status: 'RECEIVED', isDeleted: false });
        let receivedMismatch = false;
        for (const d of receivedDispatches) {
            const historyCount = await StockHistory.countDocuments({ referenceId: d._id, referenceModel: 'Dispatch', type: 'IN' });
            if (historyCount === 0) {
                receivedMismatch = true;
                break;
            }
        }
        results.dispatchInventorySync = !receivedMismatch ? "PASS" : "FAIL";

        // 7. Check if any sale exists without corresponding stock movement
        const sales = await Sale.find({ status: 'COMPLETED' }).limit(500);
        let saleMovementMissing = false;
        for (const s of sales) {
            const history = await StockHistory.findOne({ referenceId: s._id, referenceModel: 'Sale' });
            if (!history) {
                saleMovementMissing = true;
                break;
            }
        }
        results.saleStockMovementExists = !saleMovementMissing ? "PASS" : "FAIL";

        // 8. Check if any loyalty balance < 0
        const negativeLoyalty = await Customer.countDocuments({ 'loyalty.balance': { $lt: 0 } });
        results.loyaltyNonNegative = negativeLoyalty === 0 ? "PASS" : "FAIL";

        // 9. Check if any creditNote remainingAmount < 0
        const negativeCreditNote = await CreditNote.countDocuments({ remainingAmount: { $lt: 0 } });
        results.creditNoteNonNegative = negativeCreditNote === 0 ? "PASS" : "FAIL";

        console.log("AUDIT_RESULTS_START");
        console.log(JSON.stringify(results, null, 2));
        console.log("AUDIT_RESULTS_END");

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

audit();
