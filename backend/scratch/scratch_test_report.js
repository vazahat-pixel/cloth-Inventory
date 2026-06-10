const mongoose = require('mongoose');
require('dotenv').config();

// Register all models that might be populated or queried
require('../src/models/hsnCode.model');
require('../src/models/item.model');
require('../src/models/store.model');
require('../src/models/sale.model');
require('../src/models/product.model');
require('../src/models/storeInventory.model');
require('../src/models/productionBatch.model');
require('../src/models/return.model');
require('../src/models/account.model');
require('../src/models/ledger.model');
require('../src/models/purchase.model');
require('../src/models/warehouseInventory.model');
require('../src/models/stockMovement.model');

const reportService = require('../src/modules/reports/report.service');

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Let's run getDetailedGstReport for a broad date range
    const startDate = '2026-05-01';
    const endDate = '2026-06-30';
    console.log(`Running getDetailedGstReport for ${startDate} to ${endDate}...`);
    
    const result = await reportService.getDetailedGstReport(startDate, endDate);
    console.log(`Total itemWise records returned: ${result.itemWise.length}`);

    // Verify if any items have HSN showing as N/A or empty
    const missingHsn = result.itemWise.filter(item => !item.hsn || item.hsn.toUpperCase() === 'N/A' || item.hsn.toUpperCase() === 'UNDEFINED');

    if (missingHsn.length > 0) {
        console.error(`FAILED: Found ${missingHsn.length} items with missing/N/A HSN code!`);
        missingHsn.slice(0, 10).forEach((item, idx) => {
            console.error(`  ${idx + 1}. Invoice: ${item.invoice}, Category: ${item.category}, HSN: ${item.hsn}`);
        });
    } else {
        console.log('SUCCESS: All items have a valid HSN code! No "N/A" HSN codes found.');
    }

    // Let's output first 10 items to manually inspect
    console.log('\nSample items in GSTR-1 detailed report:');
    result.itemWise.slice(0, 10).forEach((item, idx) => {
        console.log(`  ${idx + 1}. Invoice: ${item.invoice}, Store: ${item.storeName}, Category: ${item.category}, HSN: ${item.hsn}, Taxable: ${item.taxable}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected!');
}

run().catch(console.error);
