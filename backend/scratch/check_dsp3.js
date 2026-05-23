require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI;

const Dispatch = mongoose.model('Dispatch', new mongoose.Schema({}, { strict: false }));
const Sale = mongoose.model('Sale', new mongoose.Schema({}, { strict: false }));

async function check() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to DB');

        const dsp = await Dispatch.findOne({ dispatchNumber: 'DSP-00003' }).lean();
        if (!dsp) {
            console.log('DSP-00003 not found!');
            await mongoose.disconnect();
            return;
        }

        console.log('--- DISPATCH ---');
        console.log('ID:', dsp._id);
        console.log('Status:', dsp.status);
        console.log('Ref ID:', dsp.referenceId);
        console.log('Ref Type:', dsp.referenceType);
        console.log('First 2 Items:', dsp.items ? dsp.items.slice(0, 2) : 'None');

        if (dsp.referenceId) {
            const sale = await Sale.findById(dsp.referenceId).lean();
            if (sale) {
                console.log('--- SALE ---');
                console.log('ID:', sale._id);
                console.log('Sale Number:', sale.saleNumber);
                console.log('First 2 Items:', sale.items ? sale.items.slice(0, 2) : 'None');
                console.log('Total Tax:', sale.totalTax);
                console.log('Grand Total:', sale.grandTotal);
            } else {
                console.log('Sale not found by ID:', dsp.referenceId);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
