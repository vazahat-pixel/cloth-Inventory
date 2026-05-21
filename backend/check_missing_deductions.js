const mongoose = require('mongoose');
require('dotenv').config();

const Dispatch = require('./src/models/dispatch.model');
const StockMovement = require('./src/models/stockMovement.model');
const WarehouseInventory = require('./src/models/warehouseInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find all dispatches that are either DISPATCHED or RECEIVED
    const dispatches = await Dispatch.find({ status: { $in: ['DISPATCHED', 'RECEIVED'] } });
    console.log(`Found ${dispatches.length} confirmed dispatches.`);

    let missingDeductions = 0;
    let totalQtyToDeduct = 0;

    for (const disp of dispatches) {
        // Check if there is a StockMovement deducting from Warehouse for this dispatch
        const movement = await StockMovement.findOne({
            referenceId: disp._id,
            referenceType: 'Dispatch',
            fromLocation: disp.sourceWarehouseId
        });

        if (!movement) {
            missingDeductions++;
            // Calculate how much should have been deducted
            for (const item of disp.items) {
                totalQtyToDeduct += item.qty;
            }
        }
    }

    console.log(`Found ${missingDeductions} dispatches missing Warehouse deductions.`);
    console.log(`Total Quantity that needs to be deducted: ${totalQtyToDeduct}`);
    
    process.exit(0);
}
run();
