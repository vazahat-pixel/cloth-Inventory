const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const sales = await Sale.find().lean();
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true }
        }).lean();

        console.log(`Loaded ${sales.length} sales from database.`);
        console.log(`Loaded ${logs.length} sales logs from SystemLog.`);

        let matched = 0;
        let unmatched = 0;

        // Group logs by storeId and rounded grandTotal for fast lookup
        const logsMap = new Map(); // key: storeId_grandTotal -> array of logs
        logs.forEach(log => {
            const body = log.details.body;
            if (!body) return;
            const storeId = String(body.storeId);
            const total = Math.round(body.grandTotal * 100) / 100;
            const key = `${storeId}_${total}`;
            if (!logsMap.has(key)) {
                logsMap.set(key, []);
            }
            logsMap.get(key).push(log);
        });

        const unmatchedSales = [];

        sales.forEach(sale => {
            const storeId = String(sale.storeId);
            const total = Math.round(sale.grandTotal * 100) / 100;
            const key = `${storeId}_${total}`;
            
            const possibleLogs = logsMap.get(key) || [];
            
            // Find a log that matches customer info if available, or close date
            let bestLog = null;
            if (possibleLogs.length === 1) {
                bestLog = possibleLogs[0];
            } else if (possibleLogs.length > 1) {
                // Filter by customer mobile/name
                const withMobile = possibleLogs.find(l => {
                    const lMobile = l.details.body.customerMobile;
                    return lMobile && sale.customerMobile && String(lMobile).trim() === String(sale.customerMobile).trim();
                });
                if (withMobile) {
                    bestLog = withMobile;
                } else {
                    const withName = possibleLogs.find(l => {
                        const lName = l.details.body.customerName;
                        return lName && sale.customerName && String(lName).toLowerCase().trim() === String(sale.customerName).toLowerCase().trim();
                    });
                    if (withName) {
                        bestLog = withName;
                    } else {
                        // Fallback to closest saleDate
                        let minDiff = Infinity;
                        possibleLogs.forEach(l => {
                            const lDate = l.details.body.date ? new Date(l.details.body.date) : new Date(l.createdAt);
                            const sDate = new Date(sale.saleDate || sale.createdAt);
                            const diff = Math.abs(lDate - sDate);
                            if (diff < minDiff) {
                                minDiff = diff;
                                bestLog = l;
                            }
                        });
                    }
                }
            }

            if (bestLog) {
                matched++;
                // Remove the matched log from pool so it's not reused
                const idx = possibleLogs.indexOf(bestLog);
                if (idx !== -1) possibleLogs.splice(idx, 1);
            } else {
                unmatched++;
                unmatchedSales.push(sale);
            }
        });

        console.log(`Dry-run Match Results:`);
        console.log(`- Matched: ${matched}`);
        console.log(`- Unmatched: ${unmatched}`);

        if (unmatchedSales.length > 0) {
            console.log(`Sample unmatched sales:`);
            unmatchedSales.slice(0, 5).forEach(s => {
                console.log(`Sale #: ${s.saleNumber}, storeId: ${s.storeId}, Total: ${s.grandTotal}, Name: ${s.customerName}, Mobile: ${s.customerMobile}, Date: ${s.saleDate || s.createdAt}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
