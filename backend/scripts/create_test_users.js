const mongoose = require('mongoose');
const User = require('../src/models/user.model');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const createUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. ADMIN
        const adminEmail = 'admin@admin.com';
        await User.deleteOne({ email: adminEmail });
        await User.create({
            name: 'Main Admin',
            email: adminEmail,
            passwordHash: 'password1122',
            role: 'admin',
            isActive: true
        });

        // 2. STORE
        const storeEmail = 'store@store.com';
        await User.deleteOne({ email: storeEmail });
        await User.create({
            name: 'Indore Store Manager',
            email: storeEmail,
            passwordHash: 'password1122',
            role: 'store_staff',
            shopName: 'Indore Branch',
            isActive: true
        });
        
        console.log('✅ Users Created Successfully!');
        console.log('--- ADMIN ---');
        console.log(`Email   : ${adminEmail}`);
        console.log(`Password: password1122`);
        console.log('--- STORE ---');
        console.log(`Email   : ${storeEmail}`);
        console.log(`Password: password1122`);
        console.log('-------------');
        process.exit(0);
    } catch (error) {
        console.error('❌ Creation failed:', error.message);
        process.exit(1);
    }
};

createUsers();
