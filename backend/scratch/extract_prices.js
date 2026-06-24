require('dotenv').config();
const mongoose = require('mongoose');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const skuPriceMap = new Map(); // sku -> mrp
        
        console.log("Extracting prices from SystemLog...");
        
        // 1. Scan sales logs
        const saleLogs = await SystemLog.find({ action: 'POST /api/sales', 'details.body': { $exists: true } }).lean();
        console.log(`Found ${saleLogs.length} sales logs.`);
        saleLogs.forEach(log => {
            const body = log.details.body;
            if (body && Array.isArray(body.products)) {
                body.products.forEach(p => {
                    const sku = p.sku;
                    const mrp = p.mrp || p.price;
                    if (sku && mrp) {
                        skuPriceMap.set(sku, mrp);
                    }
                });
            }
        });
        
        // 2. Scan GRNs
        const grnLogs = await SystemLog.find({ action: 'POST /api/grn', 'details.body': { $exists: true } }).lean();
        console.log(`Found ${grnLogs.length} GRN logs.`);
        grnLogs.forEach(log => {
            const body = log.details.body;
            if (body && Array.isArray(body.items)) {
                body.items.forEach(item => {
                    const sku = item.sku;
                    const mrp = item.mrp;
                    if (sku && mrp) {
                        skuPriceMap.set(sku, mrp);
                    }
                });
            }
        });

        console.log("Unique SKUs with extracted MRPs:", skuPriceMap.size);
        
        const samples = Array.from(skuPriceMap.entries()).slice(0, 10);
        console.log("Sample extracted prices:", samples);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
