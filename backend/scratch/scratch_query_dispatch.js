require('dotenv').config();
const mongoose = require('mongoose');

// Register schemas
require('../src/models/warehouse.model');
require('../src/models/store.model');
const Dispatch = require('../src/models/dispatch.model');
const Store = require('../src/models/store.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Get Sonipat store info
    const sonipat = await Store.findOne({ name: /SONIPAT/i }).lean();
    if (!sonipat) {
        console.error('Sonipat store not found!');
        return;
    }
    console.log(`Sonipat ID: ${sonipat._id}`);

    // Query dispatch records matching Sonipat
    console.log('\n--- Querying Dispatches to Sonipat ---');
    const dispatches = await Dispatch.find({
        destinationStoreId: sonipat._id
    }).populate('sourceWarehouseId destinationStoreId').lean();

    console.log(`Found ${dispatches.length} total dispatches to Sonipat.`);

    dispatches.forEach(disp => {
        const dateStr = new Date(disp.createdAt || disp.dispatchDate).toLocaleDateString('en-IN');
        console.log(`\nID: ${disp._id}`);
        console.log(`Dispatch No / Challan No: ${disp.dispatchNumber || disp.challanNo}`);
        console.log(`Invoice No / Bill No: ${disp.invoiceNo || disp.billNo || disp.invoiceNumber || 'N/A'}`);
        console.log(`Status: ${disp.status} | Date: ${dateStr}`);
        console.log(`Items count: ${disp.items?.length || 0}`);
        let totalQty = 0;
        if (disp.items) {
            disp.items.forEach(item => {
                totalQty += item.qty || item.quantity || 0;
            });
        }
        console.log(`Total Quantity: ${totalQty}`);
    });

    console.log('\n--- Searching for specific dispatch DSP-00009 ---');
    const specific = await Dispatch.find({
        $or: [
            { dispatchNumber: /DSP-00009/i },
            { challanNo: /DSP-00009/i },
            { invoiceNo: /DSP-00009/i },
            { billNo: /DSP-00009/i },
            { dispatchNumber: /09/ },
            { challanNo: /09/ }
        ]
    }).populate('sourceWarehouseId destinationStoreId').lean();

    console.log(`Found ${specific.length} records matching 'DSP-00009' or '09' in numbers:`);
    specific.forEach(disp => {
        const dateStr = new Date(disp.createdAt || disp.dispatchDate).toLocaleDateString('en-IN');
        console.log(`- ID: ${disp._id} | No: ${disp.dispatchNumber || disp.challanNo} | Invoice: ${disp.invoiceNo || disp.billNo || disp.invoiceNumber} | Store: ${disp.destinationStoreId?.name} | Status: ${disp.status} | Date: ${dateStr}`);
        let totalQty = 0;
        if (disp.items) {
            disp.items.forEach(item => {
                totalQty += item.qty || item.quantity || 0;
            });
        }
        console.log(`  └─ Total Qty: ${totalQty}`);
    });

    await mongoose.disconnect();
}

run().catch(console.error);
