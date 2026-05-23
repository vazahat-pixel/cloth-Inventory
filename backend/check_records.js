require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Dispatch = require('./src/models/dispatch.model');
        const Sale = require('./src/models/sale.model');

        // Check dispatches
        const dispatches = await Dispatch.find({}).lean();
        for (const d of dispatches) {
            const qty = d.items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
            console.log(`Dispatch ${d.dispatchNumber || d.challanNumber || d._id}: Qty ${qty}, Status: ${d.status}`);
        }

        const sales = await Sale.find({}).lean();
        for (const s of sales) {
            const qty = s.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
            console.log(`Sale ${s.saleNumber || s._id}: Qty ${qty}, Type: ${s.type}`);
        }

    } catch(e) { console.error(e); } finally { mongoose.disconnect(); }
}
run();
