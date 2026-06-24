const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Item = require('../src/models/item.model');
const StoreInventory = require('../src/models/storeInventory.model');
const Sale = require('../src/models/sale.model');
const Dispatch = require('../src/models/dispatch.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("Connected to Mongo.");
        
        // 1. Check item variants
        const barcodes = ['BM0017-M', 'BM0018-L', 'DA1072-86.36CM(34)', 'DA1481-101.6CM(40)'];
        for (const b of barcodes) {
            const item = await Item.findOne({ "sizes.barcode": b });
            if (item) {
                const variant = item.sizes.find(s => s.barcode === b);
                console.log(`Item Variant ${b} exists. Parent ItemCode: ${item.itemCode}, Variant ID: ${variant._id}`);
            } else {
                console.log(`Item Variant ${b} does NOT exist.`);
            }
        }

        // 2. Check dispatches
        const disps = await Dispatch.find({ dispatchNumber: { $in: ['SCH-LBQUMQ', 'SCH-6GFSTG'] } });
        for (const d of disps) {
            console.log(`Dispatch ${d.dispatchNumber}: status=${d.status}, itemsCount=${d.items.length}, totalMRP=${d.totalMRP}, finalAmount=${d.finalAmount}`);
        }

        // 3. Check sales
        const storeId = '69ecb1d9f04d7249bd11adf4';
        const startJune = new Date('2026-06-19T00:00:00Z');
        const endJune = new Date('2026-06-19T23:59:59Z');
        const sales = await Sale.find({ storeId, saleDate: { $gte: startJune, $lte: endJune } }).lean();
        console.log(`Sales on June 19 in DB: count=${sales.length}`);
        sales.forEach(s => {
            console.log(` - ${s.saleNumber}: GrandTotal=${s.grandTotal}, Qty=${s.items.reduce((acc, p) => acc + p.quantity, 0)}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
