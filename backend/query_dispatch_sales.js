require('dotenv').config();
const mongoose = require('mongoose');
//commit 
async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Dispatch = require('./src/models/dispatch.model');
        const Sale = require('./src/models/sale.model');
        const Store = require('./src/models/store.model');
        const Warehouse = require('./src/models/warehouse.model');

        console.log('--- DISPATCH BREAKDOWN (WAREHOUSE TO STORE) ---');
        // We only care about dispatches that have left the warehouse ('DISPATCHED', 'RECEIVED')
        const dispatches = await Dispatch.find({ status: { $in: ['DISPATCHED', 'RECEIVED'] } }).populate('destinationStoreId').lean();

        const dispatchStoreMap = {};
        for (const d of dispatches) {
            const storeName = d.destinationStoreId ? d.destinationStoreId.name : 'Unknown Store';
            if (!dispatchStoreMap[storeName]) dispatchStoreMap[storeName] = 0;
            const qty = d.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
            dispatchStoreMap[storeName] += qty;
        }

        for (const [storeName, qty] of Object.entries(dispatchStoreMap)) {
            console.log(`Store: ${storeName} | Dispatched Qty: ${qty}`);
        }

        console.log('\n--- SALES BREAKDOWN (STORE-WISE & WAREHOUSE) ---');
        const sales = await Sale.find({}).populate('storeId').lean();

        const salesMap = {};
        for (const s of sales) {
            // Check if storeId belongs to a Warehouse or Store
            let locationName = 'Unknown Location';
            if (s.storeId) {
                // storeId could be populated with Store or Warehouse doc. 
                // Wait, mongoose populate might not work if ref is dynamic without refPath.
                // Let's manually check.
                const storeObj = await Store.findById(s.storeId._id || s.storeId).lean();
                if (storeObj) {
                    locationName = `Store: ${storeObj.name}`;
                } else {
                    const whObj = await Warehouse.findById(s.storeId._id || s.storeId).lean();
                    if (whObj) {
                        locationName = `Head Office (Warehouse): ${whObj.name}`;
                    } else {
                        locationName = `Unknown: ${s.storeId._id || s.storeId}`;
                    }
                }
            }

            if (!salesMap[locationName]) salesMap[locationName] = 0;
            const qty = s.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            salesMap[locationName] += qty;
        }

        for (const [loc, qty] of Object.entries(salesMap)) {
            console.log(`${loc} | Total Sold Qty: ${qty}`);
        }

        // What about Draft challans?
        const drafts = await Dispatch.find({ status: { $in: ['PENDING', 'PACKED'] } }).populate('destinationStoreId').lean();
        console.log('\n--- DRAFT DISPATCHES (NOT YET SENT) ---');
        const draftMap = {};
        for (const d of drafts) {
            const storeName = d.destinationStoreId ? d.destinationStoreId.name : 'Unknown Store';
            if (!draftMap[storeName]) draftMap[storeName] = 0;
            const qty = d.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
            draftMap[storeName] += qty;
        }
        for (const [storeName, qty] of Object.entries(draftMap)) {
            console.log(`Store: ${storeName} | Draft Qty: ${qty}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

run();
