const mongoose = require('mongoose');
const Dispatch = require('../src/models/dispatch.model');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const id = '69ef4aef761ce0ce3fffe083';
    const d = await Dispatch.findById(id);
    if (d) {
        console.log(`ID ${id} is a DISPATCH. Status: ${d.status}, Number: ${d.dispatchNumber}`);
    } else {
        const Sale = require('../src/models/sale.model');
        const s = await Sale.findById(id);
        if (s) {
            console.log(`ID ${id} is a SALE. Status: ${s.status}, Number: ${s.saleNumber}`);
        } else {
             console.log(`ID ${id} not found.`);
        }
    }
    process.exit(0);
}
check();
