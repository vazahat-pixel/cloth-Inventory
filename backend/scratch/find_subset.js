const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';

        // Fetch all unmatched logs we found previously
        const logIds = [
            '6a2113e3afd24ffd18968140',
            '6a3638456aa096db0c8625ae',
            '6a3638a36aa096db0c862824',
            '6a3638cf6aa096db0c86286b',
            '6a3638fc6aa096db0c8628b5',
            '6a3639576aa096db0c86291b',
            '6a363b166aa096db0c862c15',
            '6a363b5b6aa096db0c862ca4',
            '6a363cdb6aa096db0c862e1f',
            '6a38e5f112517c17ad17f97c'
        ];

        const logs = await SystemLog.find({ _id: { $in: logIds } }).lean();

        const items = logs.map(l => {
            const body = l.details.body;
            const qty = (body.products || []).reduce((sum, p) => sum + p.quantity, 0);
            const amt = body.grandTotal;
            return {
                id: l._id.toString(),
                date: body.date || new Date(l.createdAt).toISOString().split('T')[0],
                qty,
                amt,
                createdAt: l.createdAt
            };
        });

        console.log("Unmatched Items:");
        items.forEach(it => {
            console.log(`- ID: ${it.id}, Date: ${it.date}, Qty: ${it.qty}, Amt: ${it.amt}, Created: ${it.createdAt}`);
        });

        console.log("\nSearching for subsets with Qty = 18:");
        const subsets = [];
        
        function findSubsets(index, currentSubset, currentQty, currentAmt) {
            if (currentQty === 18) {
                subsets.push({
                    items: [...currentSubset],
                    qty: currentQty,
                    amt: currentAmt
                });
            }
            if (index >= items.length) return;
            // Include items[index]
            currentSubset.push(items[index]);
            findSubsets(index + 1, currentSubset, currentQty + items[index].qty, currentAmt + items[index].amt);
            currentSubset.pop();
            // Exclude items[index]
            findSubsets(index + 1, currentSubset, currentQty, currentAmt);
        }

        findSubsets(0, [], 0, 0);

        console.log(`Found ${subsets.length} subsets with Qty = 18:`);
        subsets.forEach((sub, i) => {
            console.log(`\nSubset ${i + 1} (Amt: ${sub.amt.toFixed(2)}):`);
            sub.items.forEach(it => {
                console.log(`  - ID: ${it.id}, Qty: ${it.qty}, Amt: ${it.amt}, Date: ${it.date}`);
            });
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
