require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const StockMovement = require('./src/models/stockMovement.model');
        const movements = await StockMovement.find({}).lean();
        
        console.log(`Total StockMovements: ${movements.length}`);
        
        const summary = {};
        let totalOut = 0;
        let totalIn = 0;
        
        movements.forEach(m => {
            const key = `${m.type} - ${m.referenceType || 'UNKNOWN'}`;
            if (!summary[key]) summary[key] = { count: 0, qty: 0 };
            summary[key].count++;
            
            // Movement qty is absolute. Let's see if it's IN or OUT based on fromLocation / toLocation
            // But wait, type is an enum (e.g. SALE, DISPATCH, ADJUSTMENT).
            summary[key].qty += m.qty;
            
            // A rough guess of whether it reduced warehouse stock:
            if (m.type === 'SALE' || m.type === 'DISPATCH' || m.type === 'TRANSFER' || m.fromLocation) {
                totalOut += m.qty;
            } else {
                totalIn += m.qty;
            }
        });
        
        console.log('\n--- Movement Summary ---');
        for (const [key, val] of Object.entries(summary)) {
            console.log(`${key}: ${val.count} movements, Total Qty: ${val.qty}`);
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

run();
