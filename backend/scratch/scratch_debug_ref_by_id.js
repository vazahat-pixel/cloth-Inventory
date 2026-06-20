const mongoose = require('mongoose');
require('dotenv').config();

const Dispatch = require('../src/models/dispatch.model');
const Sale = require('../src/models/sale.model');
const DeliveryChallan = require('../src/models/deliveryChallan.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const disp = await Dispatch.findById('6a2d3c90e442d6672d114ec3');
        if (disp) {
            console.log('Found Dispatch:', disp.dispatchNumber);
            console.log('referenceId:', disp.referenceId);
            console.log('referenceType:', disp.referenceType);

            if (disp.referenceType === 'Sale') {
                const sale = await Sale.findById(disp.referenceId);
                console.log('Sale found by findById:', sale ? sale.saleNumber : 'NOT FOUND');
            } else if (disp.referenceType === 'DeliveryChallan') {
                const dc = await DeliveryChallan.findById(disp.referenceId);
                console.log('DeliveryChallan found:', dc ? dc.dcNumber : 'NOT FOUND');
            }
        } else {
            console.log('Dispatch ID 6a2d3c90e442d6672d114ec3 not found');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
