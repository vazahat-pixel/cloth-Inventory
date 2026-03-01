const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const cleanDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const collections = await mongoose.connection.db.collections();

        for (let collection of collections) {
            await collection.deleteMany({});
            console.log(`🗑️  Cleared collection: ${collection.collectionName}`);
        }

        console.log('\n✨ Database cleaned successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error cleaning DB:', err.message);
        process.exit(1);
    }
};

cleanDB();
