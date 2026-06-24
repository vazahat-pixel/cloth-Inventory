const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');
const User = require('../src/models/user.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';
        
        // Find GTB user ID
        const gtbUser = await User.findOne({ username: 'gtbnagar@gmail.com' }).lean();
        const gtbUserId = gtbUser ? gtbUser._id.toString() : null;
        console.log("GTB User ID:", gtbUserId);

        // Fetch all POST /api/sales system logs in June 2026
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            createdAt: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-30T23:59:59Z')
            }
        }).lean();

        console.log(`Total sales logs in June: ${logs.length}`);

        const gtbLogs = [];
        logs.forEach(l => {
            const body = l.details.body;
            if (!body) return;

            const isGtbStoreId = String(body.storeId) === storeId;
            const isGtbUser = gtbUserId && String(l.userId || l.details.userId) === gtbUserId;
            
            if (isGtbStoreId || isGtbUser) {
                gtbLogs.push(l);
            }
        });

        console.log(`GTB-related logs in June: ${gtbLogs.length}`);
        
        // Write details of all these logs
        gtbLogs.forEach(l => {
            const body = l.details.body;
            const qty = (body.products || []).reduce((sum, p) => sum + p.quantity, 0);
            const amt = body.grandTotal;
            const date = body.date || new Date(l.createdAt).toISOString().split('T')[0];
            console.log(`Log ID: ${l._id}, Date: ${date}, Qty: ${qty}, Amt: ${amt.toFixed(2)}, Created: ${l.createdAt}, StoreId: ${body.storeId}, User: ${l.userId}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
