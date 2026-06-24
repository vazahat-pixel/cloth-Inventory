const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const StockMovement = require('../src/models/stockMovement.model');
const StoreInventory = require('../src/models/storeInventory.model');
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69e86a235df4170210683604'; // Pitampura

        // 1. Calculate total sale qty in DB
        const sales = await Sale.find({ storeId, isDeleted: false }).lean();
        const totalSaleQty = sales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + i.quantity, 0), 0);
        console.log(`Total Sales Qty in DB: ${totalSaleQty} pcs`);

        // 2. Calculate total inward qty (type RECEIVE) in DB
        const inwards = await StockMovement.find({
            toLocation: storeId,
            type: 'RECEIVE'
        }).lean();
        const totalInwardQty = inwards.reduce((sum, m) => sum + Math.abs(m.qty), 0);
        console.log(`Total Inward (RECEIVE) Qty in DB: ${totalInwardQty} pcs`);

        // 3. Calculate total adjustments in DB
        const adjustments = await StockMovement.find({
            type: 'ADJUSTMENT',
            $or: [
                { fromLocation: storeId },
                { toLocation: storeId }
            ]
        }).lean();
        
        let totalAdj = 0;
        adjustments.forEach(m => {
            if (String(m.toLocation) === storeId) {
                totalAdj += Math.abs(m.qty);
            } else if (String(m.fromLocation) === storeId) {
                totalAdj -= Math.abs(m.qty);
            }
        });
        console.log(`Total Adjustments Qty in DB: ${totalAdj} pcs`);

        // 4. Current closing stock
        const inventory = await StoreInventory.find({ storeId }).lean();
        const closingStock = inventory.reduce((sum, i) => sum + i.quantity, 0);
        console.log(`Current Closing Stock in DB: ${closingStock} pcs`);

        // 5. Let's see if we can calculate the implicit opening stock
        // Closing = Opening + Inward - Sale + Adjustments
        // Opening = Closing - Inward + Sale - Adjustments
        const calculatedOpening = closingStock - totalInwardQty + totalSaleQty - totalAdj;
        console.log(`Calculated Opening Stock: ${calculatedOpening} pcs`);

        console.log(`\n=== Comparison ===`);
        console.log(`User Expected: Opening (3182) + Inward (176) - Sale (153) = ${3182 + 176 - 153} pcs (Expected Closing: 3205)`);
        console.log(`DB Actual: Closing Stock = ${closingStock} pcs`);
        console.log(`Difference: ${closingStock - (3182 + 176 - 153)} pcs`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
