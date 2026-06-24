require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const oplog = mongoose.connection.useDb('local').collection('oplog.rs');
        const oldest = await oplog.find({}).sort({ ts: 1 }).limit(1).toArray();
        const newest = await oplog.find({}).sort({ ts: -1 }).limit(1).toArray();
        console.log('Oldest:', oldest[0]?.wall || oldest[0]?.ts);
        console.log('Newest:', newest[0]?.wall || newest[0]?.ts);
        const stats = await oplog.aggregate([
            {
                $group: {
                    _id: { ns: '$ns', op: '$op' },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        console.log('Oplog Stats:');
        stats.forEach(s => {
            console.log(`- NS: ${s._id.ns} | OP: ${s._id.op} | Count: ${s.count}`);
        });
    } catch(e) {
        console.error('Error:', e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();
