const mongoose = require('mongoose');
require('dotenv').config();
const reportService = require('../src/modules/reports/report.service');
const Sale = require('../src/models/sale.model');

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Let's call getDetailedGstReport for a broad date range to cover the existing sales
    const startDate = '2026-06-01';
    const endDate = '2026-06-30';
    console.log(`Running getDetailedGstReport for ${startDate} to ${endDate}...`);
    
    const result = await reportService.getDetailedGstReport(startDate, endDate);
    console.log(`Total itemWise records returned: ${result.itemWise.length}`);

    // Log the first 5 records in itemWise details
    console.log('First 5 itemWise records:');
    result.itemWise.slice(0, 5).forEach((item, idx) => {
        console.log(`${idx + 1}. Invoice: ${item.invoice}, Item Category: ${item.category}`);
        console.log(`   MRP: ${item.mrp}, Discount: ${item.discount}%, Taxable: ${item.taxable}, Net: ${item.netAmount}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected!');
}

run().catch(console.error);
