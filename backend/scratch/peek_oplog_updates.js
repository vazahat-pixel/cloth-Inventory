require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const oplog = mongoose.connection.useDb('local').collection('oplog.rs');
        
        console.log("Fetching sample item update oplog entries...");
        const updates = await oplog.find({
            ns: '699eb747590addd15f6f3fc5_cloth-inventory.items',
            op: 'u'
        }).limit(5).toArray();
        
        console.log(`Found ${updates.length} updates. Details:`);
        updates.forEach((u, i) => {
            console.log(`\n--- Update #${i+1} ---`);
            console.log('Timestamp:', u.wall || u.ts);
            console.log('Query (o2):', JSON.stringify(u.o2));
            console.log('Update Payload (o):', JSON.stringify(u.o).substring(0, 800));
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
