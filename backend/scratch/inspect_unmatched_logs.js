const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const logIds = [
            '6a2113e3afd24ffd18968140',
            '6a3638456aa096db0c8625ae',
            '6a38e5f112517c17ad17f97c'
        ];

        for (const logId of logIds) {
            const log = await SystemLog.findById(logId).lean();
            if (!log) {
                console.log(`Log ${logId} not found in SystemLog`);
                continue;
            }
            console.log(`\n=== Log ID: ${logId} ===`);
            console.log(`Date: ${log.createdAt.toISOString()}`);
            console.log(`Action: ${log.action}`);
            if (log.details && log.details.body) {
                const body = log.details.body;
                console.log(`Body:`, JSON.stringify(body, null, 2));

                // Check if any sale in DB matches this body (by date, customerName, or grandTotal)
                const candidateSalesByTotal = await Sale.find({
                    storeId: '69ecb1d9f04d7249bd11adf4',
                    grandTotal: body.grandTotal
                }).lean();
                console.log(`Candidate sales by grandTotal (${body.grandTotal}):`, candidateSalesByTotal.map(s => ({
                    _id: s._id,
                    saleNumber: s.saleNumber,
                    grandTotal: s.grandTotal,
                    saleDate: s.saleDate,
                    customerName: s.customerName,
                    type: s.type
                })));
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
