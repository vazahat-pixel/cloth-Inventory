const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Return = require('../src/models/return.model');
const SalesReturn = require('../src/models/salesReturn.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const returns = await Return.find({
            createdAt: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-30T23:59:59Z')
            }
        }).lean();
        console.log(`Returns in June: ${returns.length}`);
        returns.forEach(r => {
            console.log(`- Return: ${r.returnNumber}, type: ${r.type}, totalAmount: ${r.totalAmount}, items count: ${r.items.length}, Date: ${r.createdAt}`);
        });

        const salesReturns = await SalesReturn.find({
            createdAt: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-30T23:59:59Z')
            }
        }).lean();
        console.log(`\nSalesReturns in June: ${salesReturns.length}`);
        salesReturns.forEach(sr => {
            console.log(`- SalesReturn: ${sr.returnNumber}, saleId: ${sr.saleId}, totalAmount: ${sr.totalAmount}, Date: ${sr.createdAt}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
