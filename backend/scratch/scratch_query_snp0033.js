const mongoose = require('mongoose');
require('dotenv').config();

// Register all models
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
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await reportService.getDetailedGstReport('2026-05-25', '2026-05-27');
    
    console.log('--- SNP-0033 Resolved HSN Codes ---');
    const items = result.itemWise.filter(i => i.invoice === 'SNP-0033');
    if (items.length > 0) {
        items.forEach((item, idx) => {
            console.log(`${idx + 1}. Item Category: ${item.category}`);
            console.log(`   Resolved HSN Code: ${item.hsn}`);
        });
    } else {
        console.log('SNP-0033 not found in date range.');
    }
    await mongoose.disconnect();
}

run().catch(console.error);
