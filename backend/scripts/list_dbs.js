require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const adminDb = mongoose.connection.db.admin();
        const dbs = await adminDb.listDatabases();
        console.log("Databases on the cluster:");
        dbs.databases.forEach(db => {
            console.log(`- Name: ${db.name} | Size: ${db.sizeOnDisk} bytes`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
