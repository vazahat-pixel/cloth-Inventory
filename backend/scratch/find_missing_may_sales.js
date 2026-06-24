const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const checkSales = ['GTB-0025', 'GTB-0021', 'GTB-0026', 'GTB-0019', 'GTB-0020', 'GTB-0022', 'GTB-0023', 'GTB-0024'];
        
        console.log("Checking DB Sales:");
        for (const num of checkSales) {
            const s = await Sale.findOne({ saleNumber: num }).lean();
            if (s) {
                console.log(`DB Sale - ${num}: Found! Date: ${s.saleDate}, Total: ${s.grandTotal}, Qty: ${s.items.reduce((sum, i) => sum + i.quantity, 0)}`);
            } else {
                console.log(`DB Sale - ${num}: NOT FOUND!`);
            }
        }

        console.log("\nChecking SystemLogs for GTB-0021 and GTB-0025 equivalents (by totals & date):");
        // GTB-0025: Date: 2026-05-18, Total: 2759.1
        // GTB-0021: Date: 2026-05-17, Total: 5398.8
        const targetTotals = [2759.1, 5398.8];
        for (const total of targetTotals) {
            const logs = await SystemLog.find({
                action: 'POST /api/sales',
                'details.body.storeId': new mongoose.Types.ObjectId('69ecb1d9f04d7249bd11adf4'),
                'details.body.grandTotal': { $gte: total - 1, $lte: total + 1 }
            }).lean();
            console.log(`Logs for total close to ${total}: ${logs.length}`);
            logs.forEach(l => {
                console.log(`- Log ID: ${l._id}, Date: ${l.details.body.date}, Total: ${l.details.body.grandTotal}, Qty: ${(l.details.body.products || []).reduce((sum, p) => sum + p.quantity, 0)}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
