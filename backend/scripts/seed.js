require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../src/models/user.model');

const seedAll = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected\n');

        // ── Default Admin ─────────────────────────────────────────
        const adminEmail = 'admin@clothinventory.com';
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log(`ℹ️  Admin already exists: ${adminEmail}`);
        } else {
            await User.create({ name: 'Super Admin', email: adminEmail, passwordHash: 'Admin@1234', role: 'admin' });
            console.log('🎉 Default admin created!');
            console.log('   Email   : admin@clothinventory.com');
            console.log('   Password: Admin@1234');
        }

        // ── Default Store Staff ───────────────────────────────────
        const storeEmail = 'store@clothinventory.com';
        const existingStore = await User.findOne({ email: storeEmail });
        if (existingStore) {
            console.log(`ℹ️  Store staff already exists: ${storeEmail}`);
        } else {
            await User.create({ name: 'Store Staff', email: storeEmail, passwordHash: 'Store@1234', role: 'store_staff', shopName: 'Main Branch' });
            console.log('\n🎉 Default store staff created!');
            console.log('   Email   : store@clothinventory.com');
            console.log('   Password: Store@1234');
            console.log('   Shop    : Main Branch');
        }

        console.log('\n⚠️  Please change passwords after first login.\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
};

seedAll();
