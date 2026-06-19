require('dotenv').config();
const mongoose = require('mongoose');

const Dispatch = require('../src/models/dispatch.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const disp21 = await Dispatch.findOne({ dispatchNumber: 'SCH-2026-00021' }).lean();
    const disp22 = await Dispatch.findOne({ dispatchNumber: 'SCH-2026-00022' }).lean();
    const disp09 = await Dispatch.findOne({ dispatchNumber: 'DSP-00009' }).lean();

    console.log('\n--- SCH-2026-00021 (Qty 100) ---');
    if (disp21) {
        console.log(`Created: ${disp21.createdAt}`);
        console.log(`Status: ${disp21.status}`);
        const items = disp21.items.slice(0, 5).map(i => `${i.barcode || i.variantId}: ${i.qty}`);
        console.log(`First 5 items:`, items);
    } else {
        console.log('Not found');
    }

    console.log('\n--- SCH-2026-00022 (Qty 99) ---');
    if (disp22) {
        console.log(`Created: ${disp22.createdAt}`);
        console.log(`Status: ${disp22.status}`);
        const items = disp22.items.slice(0, 5).map(i => `${i.barcode || i.variantId}: ${i.qty}`);
        console.log(`First 5 items:`, items);
    } else {
        console.log('Not found');
    }

    console.log('\n--- DSP-00009 (Qty 199) ---');
    if (disp09) {
        console.log(`Created: ${disp09.createdAt}`);
        console.log(`Status: ${disp09.status}`);
        const items = disp09.items.slice(0, 5).map(i => `${i.barcode || i.variantId}: ${i.qty}`);
        console.log(`First 5 items:`, items);
    } else {
        console.log('Not found');
    }

    // Check if barcodes in disp09 are exactly the union of disp21 and disp22
    if (disp21 && disp22 && disp09) {
        const barcodes21 = new Set(disp21.items.map(i => i.barcode || i.variantId));
        const barcodes22 = new Set(disp22.items.map(i => i.barcode || i.variantId));
        const barcodes09 = new Set(disp09.items.map(i => i.barcode || i.variantId));

        let overlapCount = 0;
        disp09.items.forEach(item => {
            const bc = item.barcode || item.variantId;
            if (barcodes21.has(bc) || barcodes22.has(bc)) {
                overlapCount++;
            }
        });
        console.log(`\nOverlap of DSP-00009 items with SCH-2026-00021 & SCH-2026-00022: ${overlapCount} out of ${disp09.items.length}`);
    }

    await mongoose.disconnect();
}

run().catch(console.error);
