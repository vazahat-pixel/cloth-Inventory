const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const id = '69ef4aef761ce0ce3fffe083';
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
        const doc = await mongoose.connection.db.collection(col.name).findOne({ _id: new mongoose.Types.ObjectId(id) });
        if (doc) {
            console.log(`ID ${id} found in collection: ${col.name}`);
            console.log(JSON.stringify(doc, null, 2));
            process.exit(0);
        }
    }
    console.log(`ID ${id} not found in any collection.`);
    process.exit(0);
}
check();
