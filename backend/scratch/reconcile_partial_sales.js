const mongoose = require('mongoose');
require('dotenv').config();
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await Sale.updateMany(
        { isDeleted: false, status: 'PARTIAL', dueAmount: { $gt: 0, $lt: 1 } },
        { $set: { status: 'COMPLETED', dueAmount: 0 } },
    );
    console.log('Reconciled rounding PARTIAL sales:', result.modifiedCount);
    await mongoose.disconnect();
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
