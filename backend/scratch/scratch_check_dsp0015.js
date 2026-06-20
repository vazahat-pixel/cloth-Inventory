const mongoose = require('mongoose');
require('dotenv').config();

// Register models
const Warehouse = require('../src/models/warehouse.model');
const Store = require('../src/models/store.model');
const Dispatch = require('../src/models/dispatch.model');
const Item = require('../src/models/item.model');
const HSNCode = require('../src/models/hsnCode.model');
const Sale = require('../src/models/sale.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const disp = await Dispatch.findById('6a366aeb6aa096db0c864797');
        if (disp) {
            console.log('Found Dispatch:', disp.dispatchNumber);
            console.log('referenceId:', disp.referenceId);
            console.log('referenceType:', disp.referenceType);
            console.log('Items:');
            disp.items.forEach(it => {
                console.log(`  - Item Name: ${it.itemName}, barcode: ${it.barcode}, qty: ${it.qty}, rate: ${it.rate}, hsnCode: ${it.hsnCode}`);
            });

            if (disp.referenceId) {
                const sale = await Sale.findById(disp.referenceId);
                if (sale) {
                    console.log('Found linked Sale:', sale.saleNumber);
                    sale.items.forEach(it => {
                        console.log(`    - Sale Item Name: ${it.itemName}, barcode: ${it.barcode}, qty: ${it.quantity}, rate: ${it.rate}, hsnCode: ${it.hsnCode}`);
                    });
                } else {
                    console.log('Linked sale NOT found');
                }
            }
        } else {
            console.log('Dispatch not found');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
