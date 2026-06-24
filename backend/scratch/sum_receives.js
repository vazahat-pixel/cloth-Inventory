const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const ids = ['6a34df8a6aa096db0c85501b', '6a366ad36aa096db0c8642be', '6a38d92c12517c17ad17bd51'];
        
        for (const id of ids) {
            const receiveLog = await SystemLog.findOne({
                action: new RegExp(`${id}/receive`, 'i')
            }).lean();

            if (receiveLog && receiveLog.details && receiveLog.details.body) {
                const items = receiveLog.details.body.receivedItems || [];
                const totalQty = items.reduce((sum, i) => sum + (i.receivedQty || 0), 0);
                console.log(`ID: ${id}, Receive Date: ${receiveLog.createdAt}, Total Received Qty: ${totalQty}`);
            } else {
                console.log(`ID: ${id} - No receive log details found`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
