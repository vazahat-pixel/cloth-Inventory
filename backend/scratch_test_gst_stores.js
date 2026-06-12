require('dotenv').config();
const connectDB = require('./src/config/db');
const reportService = require('./src/modules/reports/report.service');

async function testGstReport() {
    await connectDB();
    const result = await reportService.getDetailedGstReport('2026-05-13', '2026-06-12', 'all', {});
    const stores = new Set();
    result.itemWise.forEach(i => stores.add(i.storeName));
    console.log('Stores in itemWise:', Array.from(stores));
    process.exit(0);
}
testGstReport();
